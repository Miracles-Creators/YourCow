// ============================================================================
// LOT FACTORY CONTRACT
// ============================================================================
// Purpose: Create lots and deploy ERC20 shares token per lot
//
// Responsibilities:
//   - Create lot record
//   - Deploy LotSharesToken (ERC20) per lot
//   - Store mapping lot → token
//   - Manage lot status
// ============================================================================

use starknet::ContractAddress;

// ----------------------------------------------------------------------------
// Lot data structure
// ----------------------------------------------------------------------------
#[derive(Drop, Serde, starknet::Store, Debug)]
pub struct Lot {
    pub issuer: ContractAddress, // Producer/Feedlot who issued the lot
    pub status: u8, // LotStatus: Active, Paused, Funded, Settled
    pub total_shares: u256, // Total shares available for this lot
    pub initial_price_per_share: u256, // Price per share at issuance (in smallest unit, e.g., cents)
    pub metadata_hash: felt252, // Poseidon hash of off-chain lot metadata
    pub created_at: u64 // Timestamp of lot creation
}

// ----------------------------------------------------------------------------
// Interface
// ----------------------------------------------------------------------------
#[starknet::interface]
pub trait ILotFactory<TContractState> {
    // Write functions (Protocol Operator only)
    /// @notice Creates a lot and deploys the shares token for that lot.
    /// @param issuer Address of the producer/feedlot issuing the lot.
    /// @param total_shares Total number of shares available.
    /// @param initial_price_per_share Initial price per share (in smallest unit).
    /// @param metadata_hash Poseidon hash of off-chain lot metadata (e.g., JSON/IPFS).
    /// @param token_name Name of the lot shares token.
    /// @param token_symbol Symbol of the lot shares token.
    /// @return lot_id ID of the created lot.
    fn create_lot(
        ref self: TContractState,
        issuer: ContractAddress,
        total_shares: u256,
        initial_price_per_share: u256,
        metadata_hash: felt252,
        token_name: ByteArray,
        token_symbol: ByteArray,
    ) -> u256;

    fn set_lot_status(ref self: TContractState, lot_id: u256, new_status: u8);

    // Admin functions
    /// @notice Updates the protocol operator (backend signer).
    fn set_protocol_operator(ref self: TContractState, new_operator: ContractAddress);

    /// @notice Sets the registry authorized to settle lots.
    /// @dev This address can mark lots as SETTLED and is passed to each deployed token.
    ///      It must be configured before create_lot can succeed (see create_lot guard).
    fn set_settlement_registry(ref self: TContractState, settlement_registry: ContractAddress);

    /// @notice Updates the class hash used to deploy LotSharesToken.
    /// @dev Use when upgrading or versioning the token implementation.
    fn set_shares_token_class_hash(ref self: TContractState, class_hash: starknet::ClassHash);

    // View functions
    fn get_lot(self: @TContractState, lot_id: u256) -> Lot;
    fn get_lot_status(self: @TContractState, lot_id: u256) -> u8;
    fn get_initial_price_per_share(self: @TContractState, lot_id: u256) -> u256;
    fn get_shares_token(self: @TContractState, lot_id: u256) -> ContractAddress;
    fn get_next_lot_id(self: @TContractState) -> u256;
    fn get_protocol_operator(self: @TContractState) -> ContractAddress;
    fn get_settlement_registry(self: @TContractState) -> ContractAddress;
    fn get_shares_token_class_hash(self: @TContractState) -> starknet::ClassHash;
}

// ----------------------------------------------------------------------------
// Contract implementation
// ----------------------------------------------------------------------------
#[starknet::contract]
pub mod LotFactory {
    use contracts::constants::LotStatus;
    use core::num::traits::Zero;
    use core::serde::Serde;
    use openzeppelin_access::ownable::OwnableComponent;
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use starknet::syscalls::deploy_syscall;
    use starknet::{
        ClassHash, ContractAddress, get_block_timestamp, get_caller_address, get_contract_address,
    };
    use super::{ILotFactory, Lot};

    // ------------------------------------------------------------------------
    // Components
    // ------------------------------------------------------------------------
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    // ------------------------------------------------------------------------
    // Events
    // ------------------------------------------------------------------------
    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        LotCreated: LotCreated,
        LotStatusChanged: LotStatusChanged,
        ProtocolOperatorUpdated: ProtocolOperatorUpdated,
        SettlementRegistryUpdated: SettlementRegistryUpdated,
    }

    #[derive(Drop, starknet::Event)]
    pub struct LotCreated {
        #[key]
        pub lot_id: u256,
        #[key]
        pub issuer: ContractAddress,
        pub total_shares: u256,
        pub initial_price_per_share: u256,
        pub metadata_hash: felt252,
        pub shares_token: ContractAddress,
        pub created_at: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct LotStatusChanged {
        #[key]
        pub lot_id: u256,
        pub old_status: u8,
        pub new_status: u8,
        pub changed_by: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ProtocolOperatorUpdated {
        pub old_operator: ContractAddress,
        pub new_operator: ContractAddress,
        pub updated_by: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct SettlementRegistryUpdated {
        pub old_registry: ContractAddress,
        pub new_registry: ContractAddress,
        pub updated_by: ContractAddress,
    }

    // ------------------------------------------------------------------------
    // Storage
    // ------------------------------------------------------------------------
    #[storage]
    struct Storage {
        // Lot ID counter
        next_lot_id: u256,
        // Lot data: lot_id → Lot
        lots: Map<u256, Lot>,
        // Shares token address per lot: lot_id → token address
        shares_token: Map<u256, ContractAddress>,
        // Protocol operator (backend signer)
        protocol_operator: ContractAddress,
        // Settlement registry (authorized to settle lots).
        // Set post-deploy to avoid circular dependency with SettlementRegistry.
        settlement_registry: ContractAddress,
        // Class hash of LotSharesToken for deploying new tokens
        shares_token_class_hash: ClassHash,
        // Ownable component storage
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    // ------------------------------------------------------------------------
    // Constructor
    // ------------------------------------------------------------------------
    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        protocol_operator: ContractAddress,
        shares_token_class_hash: ClassHash,
    ) {
        // Initialize ownable (admin)
        self.ownable.initializer(owner);
        // Set protocol operator
        self.protocol_operator.write(protocol_operator);
        // Set shares token class hash
        self.shares_token_class_hash.write(shares_token_class_hash);
        // Start lot IDs at 1
        self.next_lot_id.write(1);
    }

    // ------------------------------------------------------------------------
    // Implementation
    // ------------------------------------------------------------------------
    #[abi(embed_v0)]
    impl LotFactoryImpl of ILotFactory<ContractState> {
        // --------------------------------------------------------------------
        // Write functions (Protocol Operator only)
        // --------------------------------------------------------------------
        fn create_lot(
            ref self: ContractState,
            issuer: ContractAddress,
            total_shares: u256,
            initial_price_per_share: u256,
            metadata_hash: felt252,
            token_name: ByteArray,
            token_symbol: ByteArray,
        ) -> u256 {
            // Only protocol operator can create lots
            self.assert_only_operator();

            // Validate inputs
            assert(!issuer.is_zero(), 'Issuer cannot be zero');
            assert(total_shares > 0, 'Total shares must be > 0');
            assert(initial_price_per_share > 0, 'Price must be > 0');
            // Registry must be configured before issuing lots (token needs it in constructor).
            assert(!self.settlement_registry.read().is_zero(), 'Settlement registry not set');

            // Get and increment lot ID
            let lot_id = self.next_lot_id.read();
            self.next_lot_id.write(lot_id + 1);

            // Get current timestamp
            let created_at = get_block_timestamp();

            // Deploy LotSharesToken contract
            let class_hash = self.shares_token_class_hash.read();
            assert(class_hash.is_non_zero(), 'Token class hash not set');

            let contract_address_salt: felt252 = lot_id.try_into().unwrap();
            let mut constructor_calldata: Array<felt252> = array![];
            token_name.serialize(ref constructor_calldata);
            token_symbol.serialize(ref constructor_calldata);
            lot_id.serialize(ref constructor_calldata);
            get_contract_address().serialize(ref constructor_calldata);
            self.protocol_operator.read().serialize(ref constructor_calldata);
            self.settlement_registry.read().serialize(ref constructor_calldata);
            total_shares.serialize(ref constructor_calldata);

            let (shares_token, _) = deploy_syscall(
                class_hash,
                contract_address_salt,
                constructor_calldata.span(),
                false // deploy_from_zero
            )
                .expect('Token deploy failed');

            // Create lot record
            let lot = Lot {
                issuer,
                status: LotStatus::ACTIVE,
                total_shares,
                initial_price_per_share,
                metadata_hash,
                created_at,
            };

            // Store lot and token mapping
            self.lots.write(lot_id, lot);
            self.shares_token.write(lot_id, shares_token);

            // Emit event
            self
                .emit(
                    LotCreated {
                        lot_id,
                        issuer,
                        total_shares,
                        initial_price_per_share,
                        metadata_hash,
                        shares_token,
                        created_at,
                    },
                );

            lot_id
        }

        fn set_lot_status(ref self: ContractState, lot_id: u256, new_status: u8) {
            // Validate lot exists
            let mut lot = self.lots.read(lot_id);
            assert(lot.created_at != 0, 'Lot does not exist');

            // Check authorization:
            // - Protocol operator can change any status
            // - Shares token can only set status to FUNDED (auto-transition on full mint)
            // - Settlement registry can only set status to SETTLED
            let caller = get_caller_address();
            let is_operator = caller == self.protocol_operator.read();
            let is_shares_token = caller == self.shares_token.read(lot_id);
            let is_settlement_registry = caller == self.settlement_registry.read();

            if is_shares_token {
                // Token can only transition to FUNDED
                assert(new_status == LotStatus::FUNDED, 'Token can only set FUNDED');
            } else if is_settlement_registry {
                // Settlement registry can only transition to SETTLED
                assert(new_status == LotStatus::SETTLED, 'Registry can only set SETTLED');
            } else {
                // Must be operator for other transitions
                assert(is_operator, 'Caller is not operator');
            }

            if is_operator {
                assert(new_status != LotStatus::SETTLED, 'Operator cannot set SETTLED');
            }

            // Validate status transition
            self.validate_status_transition(lot.status, new_status);

            // Store old status for event
            let old_status = lot.status;

            // Update status
            lot.status = new_status;
            self.lots.write(lot_id, lot);

            // Emit event
            self.emit(LotStatusChanged { lot_id, old_status, new_status, changed_by: caller });
        }

        // --------------------------------------------------------------------
        // Admin functions
        // --------------------------------------------------------------------
        fn set_protocol_operator(ref self: ContractState, new_operator: ContractAddress) {
            // Only owner can change operator
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

        fn set_settlement_registry(ref self: ContractState, settlement_registry: ContractAddress) {
            // Only owner can set settlement registry
            self.ownable.assert_only_owner();
            assert(!settlement_registry.is_zero(), 'Registry cannot be zero');

            let old_registry = self.settlement_registry.read();
            self.settlement_registry.write(settlement_registry);

            // Emit event for administrative change
            self
                .emit(
                    SettlementRegistryUpdated {
                        old_registry,
                        new_registry: settlement_registry,
                        updated_by: get_caller_address(),
                    },
                );
        }

        fn set_shares_token_class_hash(ref self: ContractState, class_hash: ClassHash) {
            // Only owner can set class hash
            self.ownable.assert_only_owner();
            assert(class_hash.is_non_zero(), 'Class hash cannot be zero');
            self.shares_token_class_hash.write(class_hash);
        }

        // --------------------------------------------------------------------
        // View functions
        // --------------------------------------------------------------------
        fn get_lot(self: @ContractState, lot_id: u256) -> Lot {
            self.lots.read(lot_id)
        }

        fn get_lot_status(self: @ContractState, lot_id: u256) -> u8 {
            self.lots.read(lot_id).status
        }

        fn get_initial_price_per_share(self: @ContractState, lot_id: u256) -> u256 {
            self.lots.read(lot_id).initial_price_per_share
        }

        fn get_shares_token(self: @ContractState, lot_id: u256) -> ContractAddress {
            self.shares_token.read(lot_id)
        }

        fn get_next_lot_id(self: @ContractState) -> u256 {
            self.next_lot_id.read()
        }

        fn get_protocol_operator(self: @ContractState) -> ContractAddress {
            self.protocol_operator.read()
        }

        fn get_settlement_registry(self: @ContractState) -> ContractAddress {
            self.settlement_registry.read()
        }

        fn get_shares_token_class_hash(self: @ContractState) -> ClassHash {
            self.shares_token_class_hash.read()
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

        fn validate_status_transition(self: @ContractState, from: u8, to: u8) {
            // Valid transitions:
            // ACTIVE → PAUSED, ACTIVE → FUNDED (auto), ACTIVE → SETTLED
            // FUNDED → PAUSED, FUNDED → SETTLED
            // PAUSED → ACTIVE, PAUSED → FUNDED, PAUSED → SETTLED
            // SETTLED → (terminal, no transitions)

            assert(to != from, 'Status unchanged');
            assert(
                to == LotStatus::ACTIVE
                    || to == LotStatus::PAUSED
                    || to == LotStatus::SETTLED
                    || to == LotStatus::FUNDED,
                'Invalid status',
            );

            // Cannot transition from Settled (terminal state)
            assert(from != LotStatus::SETTLED, 'Cannot change settled lot');

            // Cannot go back to ACTIVE from FUNDED (only forward or to PAUSED)
            if from == LotStatus::FUNDED {
                assert(to != LotStatus::ACTIVE, 'Cannot unfund lot');
            }
        }
    }
}
