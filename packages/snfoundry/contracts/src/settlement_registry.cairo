// ============================================================================
// SETTLEMENT REGISTRY CONTRACT
// ============================================================================
// Purpose: Record settlement parameters for audit and payouts
//
// Responsibilities:
//   - Mark lot as Settled
//   - Store final report hash
//   - Freeze ERC20 transfers (via LotSharesToken)
// ============================================================================

use starknet::ContractAddress;

// ----------------------------------------------------------------------------
// Settlement data structure
// ----------------------------------------------------------------------------
#[derive(Drop, Serde, starknet::Store)]
pub struct Settlement {
    pub settled_at: u64, // Timestamp of settlement
    pub final_report_hash: felt252, // Hash of final settlement report
    pub total_proceeds: u256, // Total proceeds in fiat (stored for record)
    pub settled_by: ContractAddress // Who triggered the settlement
}

// ----------------------------------------------------------------------------
// Interface
// ----------------------------------------------------------------------------
#[starknet::interface]
pub trait ISettlementRegistry<TContractState> {
    // Write functions (Protocol Operator only)
    /// @notice Marks a lot as settled and stores the final settlement data.
    /// @dev Also freezes the lot shares token via the registry integration.
    fn settle_lot(
        ref self: TContractState, lot_id: u256, final_report_hash: felt252, total_proceeds: u256,
    );

    // Admin functions
    fn set_protocol_operator(ref self: TContractState, new_operator: ContractAddress);

    /// @notice Updates the LotFactory used to resolve lot and shares token addresses.
    /// @dev Useful for post-deploy wiring to avoid circular dependencies.
    fn set_lot_factory(ref self: TContractState, new_lot_factory: ContractAddress);

    // View functions
    fn get_settlement(self: @TContractState, lot_id: u256) -> Settlement;
    fn is_settled(self: @TContractState, lot_id: u256) -> bool;
    fn get_lot_factory(self: @TContractState) -> ContractAddress;
    fn get_protocol_operator(self: @TContractState) -> ContractAddress;
}

// ----------------------------------------------------------------------------
// External contract interfaces
// ----------------------------------------------------------------------------
#[starknet::interface]
pub trait ILotFactoryExternal<TContractState> {
    fn set_lot_status(ref self: TContractState, lot_id: u256, new_status: u8);
    fn get_shares_token(self: @TContractState, lot_id: u256) -> ContractAddress;
    fn get_lot_status(self: @TContractState, lot_id: u256) -> u8;
}

#[starknet::interface]
pub trait ILotSharesTokenExternal<TContractState> {
    fn freeze(ref self: TContractState);
    fn is_frozen(self: @TContractState) -> bool;
}

// ----------------------------------------------------------------------------
// Contract implementation
// ----------------------------------------------------------------------------
#[starknet::contract]
pub mod SettlementRegistry {
    use contracts::constants::LotStatus;
    use core::num::traits::Zero;
    use openzeppelin_access::ownable::OwnableComponent;
    use openzeppelin_security::reentrancyguard::ReentrancyGuardComponent;
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
    use super::{
        ILotFactoryExternalDispatcher, ILotFactoryExternalDispatcherTrait,
        ILotSharesTokenExternalDispatcher, ILotSharesTokenExternalDispatcherTrait,
        ISettlementRegistry, Settlement,
    };

    // ------------------------------------------------------------------------
    // Components
    // ------------------------------------------------------------------------
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(
        path: ReentrancyGuardComponent, storage: reentrancy_guard, event: ReentrancyGuardEvent,
    );

    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;
    impl ReentrancyGuardInternalImpl = ReentrancyGuardComponent::InternalImpl<ContractState>;

    // ------------------------------------------------------------------------
    // Events
    // ------------------------------------------------------------------------
    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        ReentrancyGuardEvent: ReentrancyGuardComponent::Event,
        LotSettled: LotSettled,
        ProtocolOperatorUpdated: ProtocolOperatorUpdated,
        LotFactoryUpdated: LotFactoryUpdated,
    }

    #[derive(Drop, starknet::Event)]
    pub struct LotSettled {
        #[key]
        pub lot_id: u256,
        pub final_report_hash: felt252,
        pub total_proceeds: u256,
        pub settled_at: u64,
        pub settled_by: ContractAddress,
        pub shares_token: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ProtocolOperatorUpdated {
        pub old_operator: ContractAddress,
        pub new_operator: ContractAddress,
        pub updated_by: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct LotFactoryUpdated {
        pub old_factory: ContractAddress,
        pub new_factory: ContractAddress,
        pub updated_by: ContractAddress,
    }

    // ------------------------------------------------------------------------
    // Storage
    // ------------------------------------------------------------------------
    #[storage]
    struct Storage {
        // Settlement data per lot: lot_id → Settlement
        settlements: Map<u256, Settlement>,
        // Reference to LotFactory contract.
        // Has to be set post-deploy.
        lot_factory: ContractAddress,
        // Protocol operator
        protocol_operator: ContractAddress,
        // Ownable component storage
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        // ReentrancyGuard component storage
        #[substorage(v0)]
        reentrancy_guard: ReentrancyGuardComponent::Storage,
    }

    // ------------------------------------------------------------------------
    // Constructor
    // ------------------------------------------------------------------------
    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        protocol_operator: ContractAddress,
        lot_factory: ContractAddress,
    ) {
        self.ownable.initializer(owner);
        assert(!protocol_operator.is_zero(), 'Operator cannot be zero');
        assert(!lot_factory.is_zero(), 'LotFactory cannot be zero');
        self.protocol_operator.write(protocol_operator);
        self.lot_factory.write(lot_factory);
    }

    // ------------------------------------------------------------------------
    // Implementation
    // ------------------------------------------------------------------------
    #[abi(embed_v0)]
    impl SettlementRegistryImpl of ISettlementRegistry<ContractState> {
        // --------------------------------------------------------------------
        // Write functions (Protocol Operator only)
        // --------------------------------------------------------------------
        fn settle_lot(
            ref self: ContractState, lot_id: u256, final_report_hash: felt252, total_proceeds: u256,
        ) {
            // Reentrancy guard: prevent reentrant calls during cross-contract interactions
            self.reentrancy_guard.start();

            self.assert_only_operator();

            // Validate inputs
            assert(final_report_hash != 0, 'Report hash required');

            // Check not already settled
            let existing = self.settlements.read(lot_id);
            assert(existing.settled_at == 0, 'Lot already settled');

            // Get LotFactory dispatcher
            // CROSS-CONTRACT CALL: Protected by reentrancy guard
            let lot_factory = ILotFactoryExternalDispatcher {
                contract_address: self.lot_factory.read(),
            };

            // Get shares token address
            let shares_token = lot_factory.get_shares_token(lot_id);
            assert(!shares_token.is_zero(), 'Lot does not exist');

            // Verify lot is Active or Paused (not already Settled in factory)
            let current_status = lot_factory.get_lot_status(lot_id);
            assert(current_status != LotStatus::SETTLED, 'Already settled in factory');

            let settled_at = get_block_timestamp();
            let settled_by = get_caller_address();

            // Create settlement record
            let settlement = Settlement {
                settled_at, final_report_hash, total_proceeds, settled_by,
            };

            // Store settlement
            self.settlements.write(lot_id, settlement);

            // Update lot status in LotFactory to Settled
            // CROSS-CONTRACT CALL: Protected by reentrancy guard
            lot_factory.set_lot_status(lot_id, LotStatus::SETTLED);

            // Freeze the shares token
            // CROSS-CONTRACT CALL: Protected by reentrancy guard
            let shares_token_dispatcher = ILotSharesTokenExternalDispatcher {
                contract_address: shares_token,
            };
            shares_token_dispatcher.freeze();

            // Emit event
            self
                .emit(
                    LotSettled {
                        lot_id,
                        final_report_hash,
                        total_proceeds,
                        settled_at,
                        settled_by,
                        shares_token,
                    },
                );

            self.reentrancy_guard.end();
        }

        // --------------------------------------------------------------------
        // Admin functions
        // --------------------------------------------------------------------
        fn set_protocol_operator(ref self: ContractState, new_operator: ContractAddress) {
            self.ownable.assert_only_owner();
            assert(!new_operator.is_zero(), 'Operator cannot be zero');

            let old_operator = self.protocol_operator.read();
            self.protocol_operator.write(new_operator);

            // Emit event for administrative change
            self
                .emit(
                    ProtocolOperatorUpdated {
                        old_operator, new_operator, updated_by: get_caller_address(),
                    },
                );
        }

        fn set_lot_factory(ref self: ContractState, new_lot_factory: ContractAddress) {
            self.ownable.assert_only_owner();
            assert(!new_lot_factory.is_zero(), 'LotFactory cannot be zero');

            let old_factory = self.lot_factory.read();
            self.lot_factory.write(new_lot_factory);

            // Emit event for administrative change
            self
                .emit(
                    LotFactoryUpdated {
                        old_factory, new_factory: new_lot_factory, updated_by: get_caller_address(),
                    },
                );
        }

        // --------------------------------------------------------------------
        // View functions
        // --------------------------------------------------------------------
        fn get_settlement(self: @ContractState, lot_id: u256) -> Settlement {
            self.settlements.read(lot_id)
        }

        fn is_settled(self: @ContractState, lot_id: u256) -> bool {
            self.settlements.read(lot_id).settled_at != 0
        }

        fn get_lot_factory(self: @ContractState) -> ContractAddress {
            self.lot_factory.read()
        }

        fn get_protocol_operator(self: @ContractState) -> ContractAddress {
            self.protocol_operator.read()
        }
    }

    // ------------------------------------------------------------------------
    // Internal functions
    // ------------------------------------------------------------------------
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn assert_only_operator(self: @ContractState) {
            let caller = get_caller_address();
            let operator = self.protocol_operator.read();
            assert(caller == operator, 'Caller is not operator');
        }
    }
}
