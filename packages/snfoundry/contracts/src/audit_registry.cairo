// ============================================================================
// AUDIT REGISTRY CONTRACT
// ============================================================================
// Purpose: Anchor off-chain ledger audit hashes on-chain for verifiability
//
// Responsibilities:
//   - Store audit batch hashes with ledger ID ranges
//   - Allow operator to anchor new batches
//   - Provide view functions for batch verification
// ============================================================================

use starknet::ContractAddress;

// ----------------------------------------------------------------------------
// Batch anchor data structure
// ----------------------------------------------------------------------------
#[derive(Drop, Serde, starknet::Store)]
pub struct BatchAnchor {
    pub batch_hash: felt252,      // SHA256 hash of canonical JSON (truncated to felt252)
    pub from_ledger_id: u64,      // First ledger entry ID in batch
    pub to_ledger_id: u64,        // Last ledger entry ID in batch
    pub timestamp: u64,           // Block timestamp when anchored
}

// ----------------------------------------------------------------------------
// Interface
// ----------------------------------------------------------------------------
#[starknet::interface]
pub trait IAuditRegistry<TContractState> {
    // Write functions (Operator only)
    /// @notice Anchors a new audit batch with its hash and ledger ID range.
    /// @param batch_id Unique identifier for the batch
    /// @param batch_hash SHA256 hash of the canonical JSON data
    /// @param from_ledger_id First ledger entry ID included in this batch
    /// @param to_ledger_id Last ledger entry ID included in this batch
    fn anchor_batch(
        ref self: TContractState,
        batch_id: u64,
        batch_hash: felt252,
        from_ledger_id: u64,
        to_ledger_id: u64,
    );

    // Admin functions (Owner only)
    /// @notice Updates the operator address.
    fn set_operator(ref self: TContractState, new_operator: ContractAddress);

    // View functions
    /// @notice Returns the batch anchor data for a given batch ID.
    fn get_batch(self: @TContractState, batch_id: u64) -> BatchAnchor;

    /// @notice Checks if a batch has been anchored.
    fn is_anchored(self: @TContractState, batch_id: u64) -> bool;

    /// @notice Returns the current operator address.
    fn get_operator(self: @TContractState) -> ContractAddress;

    /// @notice Returns the total number of batches anchored.
    fn get_batch_count(self: @TContractState) -> u64;

    /// @notice Returns the latest anchored batch ID.
    fn get_latest_batch_id(self: @TContractState) -> u64;
}

// ----------------------------------------------------------------------------
// Contract implementation
// ----------------------------------------------------------------------------
#[starknet::contract]
pub mod AuditRegistry {
    use core::num::traits::Zero;
    use openzeppelin_access::ownable::OwnableComponent;
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
    use super::{BatchAnchor, IAuditRegistry};

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
        BatchAnchored: BatchAnchored,
        OperatorUpdated: OperatorUpdated,
    }

    #[derive(Drop, starknet::Event)]
    pub struct BatchAnchored {
        #[key]
        pub batch_id: u64,
        pub batch_hash: felt252,
        pub from_ledger_id: u64,
        pub to_ledger_id: u64,
        pub timestamp: u64,
        pub anchored_by: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct OperatorUpdated {
        pub old_operator: ContractAddress,
        pub new_operator: ContractAddress,
        pub updated_by: ContractAddress,
    }

    // ------------------------------------------------------------------------
    // Storage
    // ------------------------------------------------------------------------
    #[storage]
    struct Storage {
        // Batch anchors: batch_id → BatchAnchor
        batches: Map<u64, BatchAnchor>,
        // Operator address (can anchor batches)
        operator: ContractAddress,
        // Total number of batches anchored
        batch_count: u64,
        // Latest batch ID anchored
        latest_batch_id: u64,
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
        operator: ContractAddress,
    ) {
        self.ownable.initializer(owner);
        assert(!operator.is_zero(), 'Operator cannot be zero');
        self.operator.write(operator);
        self.batch_count.write(0);
        self.latest_batch_id.write(0);
    }

    // ------------------------------------------------------------------------
    // Implementation
    // ------------------------------------------------------------------------
    #[abi(embed_v0)]
    impl AuditRegistryImpl of IAuditRegistry<ContractState> {
        // --------------------------------------------------------------------
        // Write functions (Operator only)
        // --------------------------------------------------------------------
        fn anchor_batch(
            ref self: ContractState,
            batch_id: u64,
            batch_hash: felt252,
            from_ledger_id: u64,
            to_ledger_id: u64,
        ) {
            self.assert_only_operator();

            // Validate inputs
            assert(batch_hash != 0, 'Batch hash required');
            assert(from_ledger_id > 0, 'From ID must be > 0');
            assert(to_ledger_id >= from_ledger_id, 'Invalid ID range');

            // Check batch not already anchored
            let existing = self.batches.read(batch_id);
            assert(existing.timestamp == 0, 'Batch already anchored');

            let timestamp = get_block_timestamp();
            let anchored_by = get_caller_address();

            // Create batch anchor
            let batch_anchor = BatchAnchor {
                batch_hash,
                from_ledger_id,
                to_ledger_id,
                timestamp,
            };

            // Store batch anchor
            self.batches.write(batch_id, batch_anchor);

            // Update counters
            let current_count = self.batch_count.read();
            self.batch_count.write(current_count + 1);
            self.latest_batch_id.write(batch_id);

            // Emit event
            self.emit(
                BatchAnchored {
                    batch_id,
                    batch_hash,
                    from_ledger_id,
                    to_ledger_id,
                    timestamp,
                    anchored_by,
                },
            );
        }

        // --------------------------------------------------------------------
        // Admin functions (Owner only)
        // --------------------------------------------------------------------
        fn set_operator(ref self: ContractState, new_operator: ContractAddress) {
            self.ownable.assert_only_owner();
            assert(!new_operator.is_zero(), 'Operator cannot be zero');

            let old_operator = self.operator.read();
            self.operator.write(new_operator);

            // Emit event
            self.emit(
                OperatorUpdated {
                    old_operator,
                    new_operator,
                    updated_by: get_caller_address(),
                },
            );
        }

        // --------------------------------------------------------------------
        // View functions
        // --------------------------------------------------------------------
        fn get_batch(self: @ContractState, batch_id: u64) -> BatchAnchor {
            self.batches.read(batch_id)
        }

        fn is_anchored(self: @ContractState, batch_id: u64) -> bool {
            self.batches.read(batch_id).timestamp != 0
        }

        fn get_operator(self: @ContractState) -> ContractAddress {
            self.operator.read()
        }

        fn get_batch_count(self: @ContractState) -> u64 {
            self.batch_count.read()
        }

        fn get_latest_batch_id(self: @ContractState) -> u64 {
            self.latest_batch_id.read()
        }
    }

    // ------------------------------------------------------------------------
    // Internal functions
    // ------------------------------------------------------------------------
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn assert_only_operator(self: @ContractState) {
            let caller = get_caller_address();
            let operator = self.operator.read();
            assert(caller == operator, 'Caller is not operator');
        }
    }
}
