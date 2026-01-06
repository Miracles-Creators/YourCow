// ============================================================================
// LOT SHARES TOKEN CONTRACT (ERC20)
// ============================================================================
// Purpose: Investable shares for a specific lot
//
// Rules:
//   - Minting only by Protocol Operator
//   - Minting only while lot is Active
//   - Transfers allowed only while Active and Funded
//   - Transfers frozen when lot is Settled
// ============================================================================

use starknet::ContractAddress;

// ----------------------------------------------------------------------------
// Interface
// ----------------------------------------------------------------------------
#[starknet::interface]
pub trait ILotSharesToken<TContractState> {
    // ERC20 standard write functions
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256,
    ) -> bool;
    fn approve(ref self: TContractState, spender: ContractAddress, amount: u256) -> bool;

    // Custom write functions (Protocol Operator only)
    /// @notice Mints shares to an investor while the lot is Active.
    /// @dev Reverts if total supply would exceed total_shares.
    fn mint(ref self: TContractState, to: ContractAddress, amount: u256);
    /// @notice Freezes transfers permanently after settlement.
    fn freeze(ref self: TContractState);

    // Admin functions
    /// @notice Updates the settlement registry authorized to freeze the token.
    fn set_settlement_registry(ref self: TContractState, settlement_registry: ContractAddress);

    // ERC20 standard view functions
    fn name(self: @TContractState) -> ByteArray;
    fn symbol(self: @TContractState) -> ByteArray;
    fn decimals(self: @TContractState) -> u8;
    fn total_supply(self: @TContractState) -> u256;
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
    fn allowance(self: @TContractState, owner: ContractAddress, spender: ContractAddress) -> u256;

    // Custom view functions
    fn lot_id(self: @TContractState) -> u256;
    fn lot_factory(self: @TContractState) -> ContractAddress;
    fn protocol_operator(self: @TContractState) -> ContractAddress;
    fn settlement_registry(self: @TContractState) -> ContractAddress;
    fn is_frozen(self: @TContractState) -> bool;
    fn total_shares(self: @TContractState) -> u256;
    /// @notice Returns true if total_supply has reached total_shares.
    fn is_fully_funded(self: @TContractState) -> bool;
}

// ----------------------------------------------------------------------------
// Contract implementation
// ----------------------------------------------------------------------------
#[starknet::contract]
pub mod LotSharesToken {
    use contracts::constants::LotStatus;
    use contracts::lot_factory::{ILotFactoryDispatcher, ILotFactoryDispatcherTrait};
    use contracts::utils::math::u256_saturating_add;
    use core::num::traits::Zero;
    use openzeppelin_security::reentrancyguard::ReentrancyGuardComponent;
    use openzeppelin_token::erc20::ERC20Component;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ContractAddress, get_caller_address};
    use super::ILotSharesToken;

    // ------------------------------------------------------------------------
    // Components
    // ------------------------------------------------------------------------
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);
    component!(
        path: ReentrancyGuardComponent, storage: reentrancy_guard, event: ReentrancyGuardEvent,
    );

    // Component implementations (bring ERC20 methods into scope)
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    impl ERC20MetadataImpl = ERC20Component::ERC20MetadataImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;
    impl ReentrancyGuardInternalImpl = ReentrancyGuardComponent::InternalImpl<ContractState>;

    // ERC20 decimals configuration
    impl ERC20Config of ERC20Component::ImmutableConfig {
        const DECIMALS: u8 = 18;
    }

    // ERC20 Hooks: Add custom validations (freeze, lot status)
    impl ERC20HooksImpl of ERC20Component::ERC20HooksTrait<ContractState> {
        fn before_update(
            ref self: ERC20Component::ComponentState<ContractState>,
            from: ContractAddress,
            recipient: ContractAddress,
            amount: u256,
        ) {
            let contract_state = self.get_contract();

            // Always validate token is not frozen
            contract_state.assert_not_frozen();

            // For transfers only (not mints/burns), validate lot is transferable
            if !from.is_zero() && !recipient.is_zero() {
                contract_state.assert_lot_transferable();
            }

            // For mints only (from == zero), validate lot is active
            if from.is_zero() && !recipient.is_zero() {
                contract_state.assert_lot_active_for_mint();
            }
        }
        // Note: after_update() not implemented - uses default empty implementation
    }

    // ------------------------------------------------------------------------
    // Events
    // ------------------------------------------------------------------------
    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event,
        #[flat]
        ReentrancyGuardEvent: ReentrancyGuardComponent::Event,
        SharesMinted: SharesMinted,
        TokenFrozen: TokenFrozen,
        SettlementRegistryUpdated: SettlementRegistryUpdated,
    }

    #[derive(Drop, starknet::Event)]
    pub struct SharesMinted {
        #[key]
        pub to: ContractAddress,
        pub amount: u256,
        pub new_total_supply: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct TokenFrozen {
        #[key]
        pub lot_id: u256,
        pub frozen_by: ContractAddress,
        pub total_supply_at_freeze: u256,
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
        // ERC20 Component storage
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
        // Custom storage
        lot_id: u256,
        lot_factory: ContractAddress,
        protocol_operator: ContractAddress,
        settlement_registry: ContractAddress,
        frozen: bool,
        total_shares: u256, // Max shares that can be minted for this lot
        // Components storage
        #[substorage(v0)]
        reentrancy_guard: ReentrancyGuardComponent::Storage,
    }

    // ------------------------------------------------------------------------
    // Constructor
    // ------------------------------------------------------------------------
    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: ByteArray,
        symbol: ByteArray,
        lot_id: u256,
        lot_factory: ContractAddress,
        protocol_operator: ContractAddress,
        settlement_registry: ContractAddress,
        total_shares: u256,
    ) {
        // Initialize ERC20 component
        self.erc20.initializer(name, symbol);

        // Initialize custom storage
        self.lot_id.write(lot_id);
        self.lot_factory.write(lot_factory);
        self.protocol_operator.write(protocol_operator);
        self.settlement_registry.write(settlement_registry);
        self.frozen.write(false);
        self.total_shares.write(total_shares);
    }

    // ------------------------------------------------------------------------
    // Implementation
    // ------------------------------------------------------------------------
    #[abi(embed_v0)]
    impl LotSharesTokenImpl of ILotSharesToken<ContractState> {
        // --------------------------------------------------------------------
        // ERC20 standard write functions (delegate to component)
        // Note: Custom validations (freeze, lot status) run automatically in hooks
        // --------------------------------------------------------------------
        fn transfer(ref self: ContractState, recipient: ContractAddress, amount: u256) -> bool {
            self.erc20.transfer(recipient, amount)
        }

        fn transfer_from(
            ref self: ContractState,
            sender: ContractAddress,
            recipient: ContractAddress,
            amount: u256,
        ) -> bool {
            self.erc20.transfer_from(sender, recipient, amount)
        }

        fn approve(ref self: ContractState, spender: ContractAddress, amount: u256) -> bool {
            self.assert_not_frozen();
            self.assert_lot_transferable();
            self.erc20.approve(spender, amount)
        }

        // --------------------------------------------------------------------
        // Custom write functions (Protocol Operator only)
        // --------------------------------------------------------------------
        fn mint(ref self: ContractState, to: ContractAddress, amount: u256) {
            // Reentrancy guard: prevent reentrant calls during cross-contract interaction
            self.reentrancy_guard.start();

            self.assert_only_operator();
            assert(!to.is_zero(), 'Mint to zero address');
            assert(amount > 0, 'Amount must be > 0');
            // Note: freeze and lot status validations run automatically in ERC20 hook

            // Check we don't exceed total_shares
            let current_supply = self.erc20.total_supply();
            let total_shares = self.total_shares.read();
            let new_total_supply = u256_saturating_add(current_supply, amount);
            assert(new_total_supply <= total_shares, 'Exceeds total shares');

            // Mint via ERC20 component (emits Transfer event automatically)
            self.erc20.mint(to, amount);

            // Emit custom event
            self.emit(SharesMinted { to, amount, new_total_supply });

            // If fully funded, update lot status to FUNDED
            // CROSS-CONTRACT CALL: Protected by reentrancy guard
            if new_total_supply == total_shares {
                let lot_factory = ILotFactoryDispatcher {
                    contract_address: self.lot_factory.read(),
                };
                lot_factory.set_lot_status(self.lot_id.read(), LotStatus::FUNDED);
            }

            self.reentrancy_guard.end();
        }

        fn freeze(ref self: ContractState) {
            // Only operator or settlement registry can freeze
            let caller = get_caller_address();
            let is_operator = caller == self.protocol_operator.read();
            let is_settlement_registry = caller == self.settlement_registry.read();
            assert(is_operator || is_settlement_registry, 'Not authorized to freeze');

            assert(!self.frozen.read(), 'Already frozen');

            self.frozen.write(true);

            self
                .emit(
                    TokenFrozen {
                        lot_id: self.lot_id.read(),
                        frozen_by: caller,
                        total_supply_at_freeze: self.erc20.total_supply(),
                    },
                );
        }

        fn set_settlement_registry(ref self: ContractState, settlement_registry: ContractAddress) {
            // Only operator can set settlement registry
            self.assert_only_operator();
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

        // --------------------------------------------------------------------
        // ERC20 standard view functions (delegate to component)
        // --------------------------------------------------------------------
        fn name(self: @ContractState) -> ByteArray {
            self.erc20.name()
        }

        fn symbol(self: @ContractState) -> ByteArray {
            self.erc20.symbol()
        }

        fn decimals(self: @ContractState) -> u8 {
            self.erc20.decimals()
        }

        fn total_supply(self: @ContractState) -> u256 {
            self.erc20.total_supply()
        }

        fn balance_of(self: @ContractState, account: ContractAddress) -> u256 {
            self.erc20.balance_of(account)
        }

        fn allowance(
            self: @ContractState, owner: ContractAddress, spender: ContractAddress,
        ) -> u256 {
            self.erc20.allowance(owner, spender)
        }

        // --------------------------------------------------------------------
        // Custom view functions
        // --------------------------------------------------------------------
        fn lot_id(self: @ContractState) -> u256 {
            self.lot_id.read()
        }

        fn lot_factory(self: @ContractState) -> ContractAddress {
            self.lot_factory.read()
        }

        fn protocol_operator(self: @ContractState) -> ContractAddress {
            self.protocol_operator.read()
        }

        fn settlement_registry(self: @ContractState) -> ContractAddress {
            self.settlement_registry.read()
        }

        fn is_frozen(self: @ContractState) -> bool {
            self.frozen.read()
        }

        fn total_shares(self: @ContractState) -> u256 {
            self.total_shares.read()
        }

        fn is_fully_funded(self: @ContractState) -> bool {
            self.erc20.total_supply() >= self.total_shares.read()
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

        fn assert_not_frozen(self: @ContractState) {
            assert(!self.frozen.read(), 'Lot not transferable');
        }

        fn assert_lot_active_for_mint(self: @ContractState) {
            let lot_factory = ILotFactoryDispatcher { contract_address: self.lot_factory.read() };
            let status = lot_factory.get_lot_status(self.lot_id.read());
            assert(status == LotStatus::ACTIVE, 'Lot not active for mint');
        }

        fn assert_lot_transferable(self: @ContractState) {
            let lot_factory = ILotFactoryDispatcher { contract_address: self.lot_factory.read() };
            let status = lot_factory.get_lot_status(self.lot_id.read());
            assert(
                status == LotStatus::ACTIVE || status == LotStatus::FUNDED, 'Lot not transferable',
            );
        }
    }
}
