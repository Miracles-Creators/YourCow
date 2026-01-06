// ============================================================================
// ANIMAL REGISTRY CONTRACT (ERC721-like)
// ============================================================================
// Purpose: Unique identity and lifecycle tracking for each animal
//
// Responsibilities:
//   - Register animals (mint NFT)
//   - Track custodian
//   - Track current lot assignment
//   - Track lifecycle status
//
// Rules:
//   - Only operator can register or assign
//   - Only Alive animals can be assigned to lots
// ============================================================================

use core::array::Span;
use starknet::ContractAddress;

// ----------------------------------------------------------------------------
// Animal data structure
// ----------------------------------------------------------------------------
#[derive(Drop, Serde, starknet::Store)]
pub struct Animal {
    pub custodian: ContractAddress, // Current custodian (producer/feedlot)
    pub status: u8, // AnimalStatus: Alive, Sold, Deceased, Removed
    pub current_lot_id: u256, // 0 if not assigned to any lot
    pub profile_hash: felt252, // Poseidon hash of off-chain profile
    pub created_at: u64 // Timestamp of registration
}

// ----------------------------------------------------------------------------
// Interface
// ----------------------------------------------------------------------------
#[starknet::interface]
pub trait IAnimalRegistry<TContractState> {
    // Write functions (Protocol Operator only)
    fn register_animal(
        ref self: TContractState,
        animal_id: u256,
        custodian: ContractAddress,
        profile_hash: felt252,
    );
    /// @notice Batch register animals with per-animal custodians and profile hashes.
    /// @dev All input spans must have the same length.
    fn register_animal_batch(
        ref self: TContractState,
        animal_ids: Span<u256>,
        custodians: Span<ContractAddress>,
        profile_hashes: Span<felt252>,
    );
    /// @notice Assigns an alive animal to a lot and increments the lot count.
    fn assign_to_lot(ref self: TContractState, animal_id: u256, lot_id: u256);

    /// @notice Batch-assign animals to the same lot.
    fn assign_to_lot_batch(ref self: TContractState, animal_ids: Span<u256>, lot_id: u256);

    fn remove_from_lot(ref self: TContractState, animal_id: u256);

    /// @notice Batch-remove animals from their current lot.
    fn remove_from_lot_batch(ref self: TContractState, animal_ids: Span<u256>);

    fn set_animal_status(ref self: TContractState, animal_id: u256, new_status: u8);
    /// @notice Batch-update animal lifecycle status.
    fn set_animal_status_batch(ref self: TContractState, animal_ids: Span<u256>, new_status: u8);

    /// @notice Transfers custody without changing ownership metadata (ERC721-like).
    fn transfer_custody(ref self: TContractState, animal_id: u256, new_custodian: ContractAddress);

    // Admin functions
    fn set_protocol_operator(ref self: TContractState, new_operator: ContractAddress);
    /// @notice Sets the LotFactory used to validate lot status and assignments.
    fn set_lot_factory(ref self: TContractState, new_lot_factory: ContractAddress);

    // View functions
    fn get_animal(self: @TContractState, animal_id: u256) -> Animal;
    fn get_custodian(self: @TContractState, animal_id: u256) -> ContractAddress;
    fn get_animal_status(self: @TContractState, animal_id: u256) -> u8;
    fn get_current_lot(self: @TContractState, animal_id: u256) -> u256;
    fn get_lot_animal_count(self: @TContractState, lot_id: u256) -> u256;
    fn animal_exists(self: @TContractState, animal_id: u256) -> bool;
    fn get_protocol_operator(self: @TContractState) -> ContractAddress;
    fn get_lot_factory(self: @TContractState) -> ContractAddress;

    // ERC721-like view functions
    fn owner_of(self: @TContractState, token_id: u256) -> ContractAddress;
    fn balance_of(self: @TContractState, owner: ContractAddress) -> u256;
}

// ----------------------------------------------------------------------------
// Contract implementation
// ----------------------------------------------------------------------------
#[starknet::contract]
pub mod AnimalRegistry {
    use contracts::constants::{AnimalStatus, LotStatus};
    use contracts::lot_factory::{ILotFactoryDispatcher, ILotFactoryDispatcherTrait};
    use core::array::SpanTrait;
    use core::num::traits::Zero;
    use openzeppelin_access::ownable::OwnableComponent;
    use openzeppelin_security::reentrancyguard::ReentrancyGuardComponent;
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
    use super::{Animal, IAnimalRegistry};

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
        AnimalRegistered: AnimalRegistered,
        AnimalAssigned: AnimalAssigned,
        AnimalRemoved: AnimalRemoved,
        AnimalStatusChanged: AnimalStatusChanged,
        CustodyTransferred: CustodyTransferred,
        ProtocolOperatorUpdated: ProtocolOperatorUpdated,
        LotFactoryUpdated: LotFactoryUpdated,
    }

    #[derive(Drop, starknet::Event)]
    pub struct AnimalRegistered {
        #[key]
        pub animal_id: u256,
        #[key]
        pub custodian: ContractAddress,
        pub profile_hash: felt252,
        pub created_at: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct AnimalAssigned {
        #[key]
        pub animal_id: u256,
        #[key]
        pub lot_id: u256,
        pub assigned_by: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct AnimalRemoved {
        #[key]
        pub animal_id: u256,
        #[key]
        pub lot_id: u256,
        pub removed_by: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct AnimalStatusChanged {
        #[key]
        pub animal_id: u256,
        pub old_status: u8,
        pub new_status: u8,
        pub changed_by: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct CustodyTransferred {
        #[key]
        pub animal_id: u256,
        #[key]
        pub from: ContractAddress,
        #[key]
        pub to: ContractAddress,
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
        // Animal data: animal_id → Animal
        animals: Map<u256, Animal>,
        // Count of animals per lot: lot_id → count
        lot_animal_count: Map<u256, u256>,
        // Count of animals per custodian (ERC721-like balance)
        custodian_balance: Map<ContractAddress, u256>,
        // Protocol operator
        protocol_operator: ContractAddress,
        // Lot factory (for status validation)
        lot_factory: ContractAddress,
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
        self.protocol_operator.write(protocol_operator);
        self.lot_factory.write(lot_factory);
    }

    // ------------------------------------------------------------------------
    // Implementation
    // ------------------------------------------------------------------------
    #[abi(embed_v0)]
    impl AnimalRegistryImpl of IAnimalRegistry<ContractState> {
        // --------------------------------------------------------------------
        // Write functions (Protocol Operator only)
        // --------------------------------------------------------------------
        fn register_animal(
            ref self: ContractState,
            animal_id: u256,
            custodian: ContractAddress,
            profile_hash: felt252,
        ) {
            self.assert_only_operator();

            // Validate inputs
            assert(!custodian.is_zero(), 'Custodian cannot be zero');

            // Check animal doesn't already exist
            let existing = self.animals.read(animal_id);
            assert(existing.created_at == 0, 'Animal already registered');

            let created_at = get_block_timestamp();

            // Create animal record
            let animal = Animal {
                custodian,
                status: AnimalStatus::ALIVE,
                current_lot_id: 0, // Not assigned to any lot
                profile_hash,
                created_at,
            };

            // Store animal
            self.animals.write(animal_id, animal);

            // Update custodian balance
            let current_balance = self.custodian_balance.read(custodian);
            self.custodian_balance.write(custodian, current_balance + 1);

            // Emit event
            self.emit(AnimalRegistered { animal_id, custodian, profile_hash, created_at });
        }

        fn register_animal_batch(
            ref self: ContractState,
            animal_ids: Span<u256>,
            custodians: Span<ContractAddress>,
            profile_hashes: Span<felt252>,
        ) {
            self.assert_only_operator();

            let count = animal_ids.len();
            assert(count == custodians.len(), 'Length mismatch');
            assert(count == profile_hashes.len(), 'Length mismatch');

            let mut i: u32 = 0;
            while i < count {
                self.register_animal(*animal_ids.at(i), *custodians.at(i), *profile_hashes.at(i));
                i += 1;
            }
        }

        fn assign_to_lot(ref self: ContractState, animal_id: u256, lot_id: u256) {
            // Reentrancy guard: prevent reentrant calls during cross-contract interaction
            self.reentrancy_guard.start();

            self.assert_only_operator();

            // Get animal
            let mut animal = self.animals.read(animal_id);
            assert(animal.created_at != 0, 'Animal does not exist');

            // Only Alive animals can be assigned
            assert(animal.status == AnimalStatus::ALIVE, 'Animal must be alive');

            // Check not already assigned to a lot
            assert(animal.current_lot_id == 0, 'Already assigned to lot');

            // Validate lot status (must be ACTIVE)
            // CROSS-CONTRACT CALL: Protected by reentrancy guard
            let lot_factory = self.lot_factory.read();
            assert(!lot_factory.is_zero(), 'LotFactory not set');
            let lot_factory_dispatcher = ILotFactoryDispatcher { contract_address: lot_factory };
            let lot_status = lot_factory_dispatcher.get_lot_status(lot_id);
            assert(lot_status == LotStatus::ACTIVE, 'Lot not active');

            // Assign to lot
            animal.current_lot_id = lot_id;
            self.animals.write(animal_id, animal);

            // Increment lot animal count
            let current_count = self.lot_animal_count.read(lot_id);
            self.lot_animal_count.write(lot_id, current_count + 1);

            // Emit event
            self.emit(AnimalAssigned { animal_id, lot_id, assigned_by: get_caller_address() });

            self.reentrancy_guard.end();
        }

        fn assign_to_lot_batch(ref self: ContractState, animal_ids: Span<u256>, lot_id: u256) {
            self.assert_only_operator();

            let count = animal_ids.len();
            let mut i: u32 = 0;
            while i < count {
                self.assign_to_lot(*animal_ids.at(i), lot_id);
                i += 1;
            }
        }

        fn remove_from_lot(ref self: ContractState, animal_id: u256) {
            self.assert_only_operator();

            // Get animal
            let mut animal = self.animals.read(animal_id);
            assert(animal.created_at != 0, 'Animal does not exist');

            // Check is assigned to a lot
            let lot_id = animal.current_lot_id;
            assert(lot_id != 0, 'Not assigned to any lot');

            // Remove from lot
            animal.current_lot_id = 0;
            self.animals.write(animal_id, animal);

            // Decrement lot animal count
            let current_count = self.lot_animal_count.read(lot_id);
            self.lot_animal_count.write(lot_id, current_count - 1);

            // Emit event
            self.emit(AnimalRemoved { animal_id, lot_id, removed_by: get_caller_address() });
        }

        fn remove_from_lot_batch(ref self: ContractState, animal_ids: Span<u256>) {
            self.assert_only_operator();

            let count = animal_ids.len();
            let mut i: u32 = 0;
            while i < count {
                self.remove_from_lot(*animal_ids.at(i));
                i += 1;
            }
        }

        fn set_animal_status(ref self: ContractState, animal_id: u256, new_status: u8) {
            self.assert_only_operator();

            // Get animal
            let mut animal = self.animals.read(animal_id);
            assert(animal.created_at != 0, 'Animal does not exist');

            // Validate status
            self.validate_animal_status(new_status);

            let old_status = animal.status;
            assert(old_status != new_status, 'Status unchanged');

            // Update status
            animal.status = new_status;
            self.animals.write(animal_id, animal);

            // Emit event
            self
                .emit(
                    AnimalStatusChanged {
                        animal_id, old_status, new_status, changed_by: get_caller_address(),
                    },
                );
        }

        fn set_animal_status_batch(
            ref self: ContractState, animal_ids: Span<u256>, new_status: u8,
        ) {
            self.assert_only_operator();

            let count = animal_ids.len();
            let mut i: u32 = 0;
            while i < count {
                self.set_animal_status(*animal_ids.at(i), new_status);
                i += 1;
            }
        }

        fn transfer_custody(
            ref self: ContractState, animal_id: u256, new_custodian: ContractAddress,
        ) {
            self.assert_only_operator();

            assert(!new_custodian.is_zero(), 'New custodian cannot be zero');

            // Get animal
            let mut animal = self.animals.read(animal_id);
            assert(animal.created_at != 0, 'Animal does not exist');

            let old_custodian = animal.custodian;
            assert(old_custodian != new_custodian, 'Same custodian');

            // Update custodian
            animal.custodian = new_custodian;
            self.animals.write(animal_id, animal);

            // Update balances
            let old_balance = self.custodian_balance.read(old_custodian);
            self.custodian_balance.write(old_custodian, old_balance - 1);

            let new_balance = self.custodian_balance.read(new_custodian);
            self.custodian_balance.write(new_custodian, new_balance + 1);

            // Emit event
            self.emit(CustodyTransferred { animal_id, from: old_custodian, to: new_custodian });
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
        fn get_animal(self: @ContractState, animal_id: u256) -> Animal {
            self.animals.read(animal_id)
        }

        fn get_custodian(self: @ContractState, animal_id: u256) -> ContractAddress {
            self.animals.read(animal_id).custodian
        }

        fn get_animal_status(self: @ContractState, animal_id: u256) -> u8 {
            self.animals.read(animal_id).status
        }

        fn get_current_lot(self: @ContractState, animal_id: u256) -> u256 {
            self.animals.read(animal_id).current_lot_id
        }

        fn get_lot_animal_count(self: @ContractState, lot_id: u256) -> u256 {
            self.lot_animal_count.read(lot_id)
        }

        fn animal_exists(self: @ContractState, animal_id: u256) -> bool {
            self.animals.read(animal_id).created_at != 0
        }

        fn get_protocol_operator(self: @ContractState) -> ContractAddress {
            self.protocol_operator.read()
        }

        fn get_lot_factory(self: @ContractState) -> ContractAddress {
            self.lot_factory.read()
        }

        // ERC721-like view functions
        fn owner_of(self: @ContractState, token_id: u256) -> ContractAddress {
            let animal = self.animals.read(token_id);
            assert(animal.created_at != 0, 'Animal does not exist');
            animal.custodian
        }

        fn balance_of(self: @ContractState, owner: ContractAddress) -> u256 {
            self.custodian_balance.read(owner)
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

        fn validate_animal_status(self: @ContractState, status: u8) {
            assert(
                status == AnimalStatus::ALIVE
                    || status == AnimalStatus::SOLD
                    || status == AnimalStatus::DECEASED
                    || status == AnimalStatus::REMOVED,
                'Invalid status',
            );
        }
    }
}
