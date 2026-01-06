// ============================================================================
// TRACEABILITY ORACLE CONTRACT
// ============================================================================
// Purpose: Anchor per-animal traceability roots on-chain
//
// Key decision: Per-animal roots (not per-lot)
//
// Responsibilities:
//   - Attestor-only writes
//   - Store latest root per animal
//   - Allow correction anchors (append-only)
// ============================================================================

use core::array::Span;
use starknet::ContractAddress;

// ----------------------------------------------------------------------------
// Trace anchor data structure
// ----------------------------------------------------------------------------
#[derive(Drop, Serde, starknet::Store)]
pub struct TraceAnchor {
    pub root: felt252, // Merkle root of all trace events
    pub timestamp: u64, // When the root was anchored
    pub event_count: u32 // Number of events in the tree
}

// ----------------------------------------------------------------------------
// Interface
// ----------------------------------------------------------------------------
#[starknet::interface]
pub trait ITraceabilityOracle<TContractState> {
    // Write functions (Attestor only)
    fn anchor_trace(ref self: TContractState, animal_id: u256, root: felt252, event_count: u32);
    /// @notice Batch anchors per-animal trace roots.
    /// @dev All input spans must have the same length.
    fn anchor_trace_batch(
        ref self: TContractState,
        animal_ids: Span<u256>,
        roots: Span<felt252>,
        event_counts: Span<u32>,
    );
    /// @notice Appends a correction anchor while preserving the audit trail.
    fn correct_trace(
        ref self: TContractState,
        animal_id: u256,
        new_root: felt252,
        new_event_count: u32,
        correction_reason: felt252,
    );

    // Admin functions
    fn set_attestor(ref self: TContractState, new_attestor: ContractAddress);

    // View functions
    fn get_last_root(self: @TContractState, animal_id: u256) -> felt252;
    fn get_last_timestamp(self: @TContractState, animal_id: u256) -> u64;
    fn get_trace_anchor(self: @TContractState, animal_id: u256) -> TraceAnchor;
    fn get_attestor(self: @TContractState) -> ContractAddress;
    fn get_correction_count(self: @TContractState, animal_id: u256) -> u32;
}

// ----------------------------------------------------------------------------
// Contract implementation
// ----------------------------------------------------------------------------
#[starknet::contract]
pub mod TraceabilityOracle {
    use core::array::SpanTrait;
    use core::num::traits::Zero;
    use openzeppelin_access::ownable::OwnableComponent;
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
    use super::{ITraceabilityOracle, TraceAnchor};

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
        AnimalTraceAnchored: AnimalTraceAnchored,
        AnimalTraceCorrected: AnimalTraceCorrected,
        AttestorChanged: AttestorChanged,
    }

    #[derive(Drop, starknet::Event)]
    pub struct AnimalTraceAnchored {
        #[key]
        pub animal_id: u256,
        pub root: felt252,
        pub event_count: u32,
        pub timestamp: u64,
        pub attestor: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct AnimalTraceCorrected {
        #[key]
        pub animal_id: u256,
        pub old_root: felt252,
        pub new_root: felt252,
        pub new_event_count: u32,
        pub correction_reason: felt252,
        pub correction_number: u32,
        pub timestamp: u64,
        pub attestor: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct AttestorChanged {
        pub old_attestor: ContractAddress,
        pub new_attestor: ContractAddress,
        pub changed_by: ContractAddress,
    }

    // ------------------------------------------------------------------------
    // Storage
    // ------------------------------------------------------------------------
    #[storage]
    struct Storage {
        // Latest trace anchor per animal: animal_id → TraceAnchor
        trace_anchors: Map<u256, TraceAnchor>,
        // Correction count per animal (for audit trail)
        correction_count: Map<u256, u32>,
        // Single attestor address (MVP model)
        attestor: ContractAddress,
        // Ownable component storage
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    // ------------------------------------------------------------------------
    // Constructor
    // ------------------------------------------------------------------------
    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress, attestor: ContractAddress) {
        self.ownable.initializer(owner);
        assert(!attestor.is_zero(), 'Attestor cannot be zero');
        self.attestor.write(attestor);
    }

    // ------------------------------------------------------------------------
    // Implementation
    // ------------------------------------------------------------------------
    #[abi(embed_v0)]
    impl TraceabilityOracleImpl of ITraceabilityOracle<ContractState> {
        // --------------------------------------------------------------------
        // Write functions (Attestor only)
        // --------------------------------------------------------------------
        fn anchor_trace(ref self: ContractState, animal_id: u256, root: felt252, event_count: u32) {
            self.assert_only_attestor();

            // Validate inputs
            assert(root != 0, 'Root cannot be zero');
            assert(event_count > 0, 'Event count must be > 0');

            let timestamp = get_block_timestamp();

            // Create anchor
            let anchor = TraceAnchor { root, timestamp, event_count };

            // Store anchor
            self.trace_anchors.write(animal_id, anchor);

            // Emit event
            self
                .emit(
                    AnimalTraceAnchored {
                        animal_id, root, event_count, timestamp, attestor: get_caller_address(),
                    },
                );
        }

        fn anchor_trace_batch(
            ref self: ContractState,
            animal_ids: Span<u256>,
            roots: Span<felt252>,
            event_counts: Span<u32>,
        ) {
            self.assert_only_attestor();

            let count = animal_ids.len();
            assert(count == roots.len(), 'Length mismatch');
            assert(count == event_counts.len(), 'Length mismatch');

            let mut i: u32 = 0;
            while i < count {
                self.anchor_trace(*animal_ids.at(i), *roots.at(i), *event_counts.at(i));
                i += 1;
            }
        }

        fn correct_trace(
            ref self: ContractState,
            animal_id: u256,
            new_root: felt252,
            new_event_count: u32,
            correction_reason: felt252,
        ) {
            self.assert_only_attestor();

            // Validate inputs
            assert(new_root != 0, 'Root cannot be zero');
            assert(new_event_count > 0, 'Event count must be > 0');
            assert(correction_reason != 0, 'Reason required');

            // Get old anchor
            let old_anchor = self.trace_anchors.read(animal_id);
            assert(old_anchor.timestamp != 0, 'No existing anchor');

            let timestamp = get_block_timestamp();

            // Increment correction count
            let correction_number = self.correction_count.read(animal_id) + 1;
            self.correction_count.write(animal_id, correction_number);

            // Create new anchor
            let new_anchor = TraceAnchor {
                root: new_root, timestamp, event_count: new_event_count,
            };

            // Store new anchor (overwrites old - append-only via events)
            self.trace_anchors.write(animal_id, new_anchor);

            // Emit event (old root preserved in event for audit trail)
            self
                .emit(
                    AnimalTraceCorrected {
                        animal_id,
                        old_root: old_anchor.root,
                        new_root,
                        new_event_count,
                        correction_reason,
                        correction_number,
                        timestamp,
                        attestor: get_caller_address(),
                    },
                );
        }

        // --------------------------------------------------------------------
        // Admin functions
        // --------------------------------------------------------------------
        fn set_attestor(ref self: ContractState, new_attestor: ContractAddress) {
            self.ownable.assert_only_owner();
            assert(!new_attestor.is_zero(), 'Attestor cannot be zero');

            let old_attestor = self.attestor.read();
            self.attestor.write(new_attestor);

            // Emit event for administrative change
            self
                .emit(
                    AttestorChanged {
                        old_attestor, new_attestor, changed_by: get_caller_address(),
                    },
                );
        }

        // --------------------------------------------------------------------
        // View functions
        // --------------------------------------------------------------------
        fn get_last_root(self: @ContractState, animal_id: u256) -> felt252 {
            self.trace_anchors.read(animal_id).root
        }

        fn get_last_timestamp(self: @ContractState, animal_id: u256) -> u64 {
            self.trace_anchors.read(animal_id).timestamp
        }

        fn get_trace_anchor(self: @ContractState, animal_id: u256) -> TraceAnchor {
            self.trace_anchors.read(animal_id)
        }

        fn get_attestor(self: @ContractState) -> ContractAddress {
            self.attestor.read()
        }

        fn get_correction_count(self: @ContractState, animal_id: u256) -> u32 {
            self.correction_count.read(animal_id)
        }
    }

    // ------------------------------------------------------------------------
    // Internal functions
    // ------------------------------------------------------------------------
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn assert_only_attestor(self: @ContractState) {
            let caller = get_caller_address();
            let attestor = self.attestor.read();
            assert(caller == attestor, 'Caller is not attestor');
        }
    }
}
