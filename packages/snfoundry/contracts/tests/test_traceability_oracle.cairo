// ============================================================================
// TRACEABILITY ORACLE TESTS
// ============================================================================

use contracts::traceability_oracle::{
    ITraceabilityOracleDispatcher, ITraceabilityOracleDispatcherTrait,
};
use core::array::ArrayTrait;
use snforge_std::{CheatSpan, cheat_caller_address, stop_cheat_caller_address};
use starknet::ContractAddress;
use super::utils::{
    animal_id_1, animal_id_2, attestor, deploy_traceability_oracle, other_user, owner,
};

// Additional address for this test file
const NEW_ATTESTOR: felt252 = 0x30;

fn new_attestor() -> ContractAddress {
    NEW_ATTESTOR.try_into().unwrap()
}

// ----------------------------------------------------------------------------
// Deployment Tests
// ----------------------------------------------------------------------------

#[test]
fn test_deployment() {
    let contract_address = deploy_traceability_oracle();
    let dispatcher = ITraceabilityOracleDispatcher { contract_address };

    assert(dispatcher.get_attestor() == attestor(), 'Wrong attestor');
}

// ----------------------------------------------------------------------------
// Anchor Trace Tests
// ----------------------------------------------------------------------------

#[test]
fn test_anchor_trace_success() {
    let contract_address = deploy_traceability_oracle();
    let dispatcher = ITraceabilityOracleDispatcher { contract_address };

    let animal_id = animal_id_1();
    let root: felt252 = 'merkle_root_1';
    let event_count: u32 = 10;

    cheat_caller_address(contract_address, attestor(), CheatSpan::TargetCalls(1));
    dispatcher.anchor_trace(animal_id, root, event_count);

    assert(dispatcher.get_last_root(animal_id) == root, 'Wrong root');

    let anchor = dispatcher.get_trace_anchor(animal_id);
    assert(anchor.root == root, 'Wrong anchor root');
    assert(anchor.event_count == event_count, 'Wrong event count');
    // Note: timestamp may be 0 in test environment without block time cheat
}

#[test]
fn test_anchor_trace_multiple_animals() {
    let contract_address = deploy_traceability_oracle();
    let dispatcher = ITraceabilityOracleDispatcher { contract_address };

    cheat_caller_address(contract_address, attestor(), CheatSpan::Indefinite);
    dispatcher.anchor_trace(animal_id_1(), 'root1', 5);
    dispatcher.anchor_trace(animal_id_2(), 'root2', 8);
    stop_cheat_caller_address(contract_address);

    assert(dispatcher.get_last_root(animal_id_1()) == 'root1', 'Wrong root 1');
    assert(dispatcher.get_last_root(animal_id_2()) == 'root2', 'Wrong root 2');
}

#[test]
fn test_anchor_trace_batch_success() {
    let contract_address = deploy_traceability_oracle();
    let dispatcher = ITraceabilityOracleDispatcher { contract_address };

    let mut animal_ids: Array<u256> = array![];
    animal_ids.append(animal_id_1());
    animal_ids.append(animal_id_2());

    let mut roots: Array<felt252> = array![];
    roots.append('root1');
    roots.append('root2');

    let mut event_counts: Array<u32> = array![];
    event_counts.append(5);
    event_counts.append(8);

    cheat_caller_address(contract_address, attestor(), CheatSpan::TargetCalls(1));
    dispatcher.anchor_trace_batch(animal_ids.span(), roots.span(), event_counts.span());

    assert(dispatcher.get_last_root(animal_id_1()) == 'root1', 'Wrong root 1');
    assert(dispatcher.get_last_root(animal_id_2()) == 'root2', 'Wrong root 2');
}

#[test]
#[should_panic(expected: 'Length mismatch')]
fn test_anchor_trace_batch_length_mismatch() {
    let contract_address = deploy_traceability_oracle();
    let dispatcher = ITraceabilityOracleDispatcher { contract_address };

    let mut animal_ids: Array<u256> = array![];
    animal_ids.append(animal_id_1());
    animal_ids.append(animal_id_2());

    let mut roots: Array<felt252> = array![];
    roots.append('root1');

    let mut event_counts: Array<u32> = array![];
    event_counts.append(5);
    event_counts.append(8);

    cheat_caller_address(contract_address, attestor(), CheatSpan::TargetCalls(1));
    dispatcher.anchor_trace_batch(animal_ids.span(), roots.span(), event_counts.span());
}

#[test]
fn test_anchor_trace_update() {
    let contract_address = deploy_traceability_oracle();
    let dispatcher = ITraceabilityOracleDispatcher { contract_address };

    let animal_id = animal_id_1();

    cheat_caller_address(contract_address, attestor(), CheatSpan::Indefinite);

    // First anchor
    dispatcher.anchor_trace(animal_id, 'root_v1', 5);

    // Update with new anchor
    dispatcher.anchor_trace(animal_id, 'root_v2', 10);

    stop_cheat_caller_address(contract_address);

    assert(dispatcher.get_last_root(animal_id) == 'root_v2', 'Should have new root');

    let anchor = dispatcher.get_trace_anchor(animal_id);
    assert(anchor.event_count == 10, 'Should have new event count');
}

#[test]
#[should_panic(expected: 'Caller is not attestor')]
fn test_anchor_trace_not_attestor() {
    let contract_address = deploy_traceability_oracle();
    let dispatcher = ITraceabilityOracleDispatcher { contract_address };

    cheat_caller_address(contract_address, other_user(), CheatSpan::TargetCalls(1));
    dispatcher.anchor_trace(animal_id_1(), 'root', 5);
}

#[test]
#[should_panic(expected: 'Root cannot be zero')]
fn test_anchor_trace_zero_root() {
    let contract_address = deploy_traceability_oracle();
    let dispatcher = ITraceabilityOracleDispatcher { contract_address };

    cheat_caller_address(contract_address, attestor(), CheatSpan::TargetCalls(1));
    dispatcher.anchor_trace(animal_id_1(), 0, 5);
}

#[test]
#[should_panic(expected: 'Event count must be > 0')]
fn test_anchor_trace_zero_events() {
    let contract_address = deploy_traceability_oracle();
    let dispatcher = ITraceabilityOracleDispatcher { contract_address };

    cheat_caller_address(contract_address, attestor(), CheatSpan::TargetCalls(1));
    dispatcher.anchor_trace(animal_id_1(), 'root', 0);
}

// ----------------------------------------------------------------------------
// Correct Trace Tests
// ----------------------------------------------------------------------------

#[test]
fn test_correct_trace_success() {
    let contract_address = deploy_traceability_oracle();
    let dispatcher = ITraceabilityOracleDispatcher { contract_address };

    let animal_id = animal_id_1();

    cheat_caller_address(contract_address, attestor(), CheatSpan::Indefinite);

    // First anchor
    dispatcher.anchor_trace(animal_id, 'original_root', 5);

    // Correction
    dispatcher.correct_trace(animal_id, 'corrected_root', 6, 'data_error');

    stop_cheat_caller_address(contract_address);

    assert(dispatcher.get_last_root(animal_id) == 'corrected_root', 'Should have corrected root');
    assert(dispatcher.get_correction_count(animal_id) == 1, 'Should have 1 correction');

    let anchor = dispatcher.get_trace_anchor(animal_id);
    assert(anchor.event_count == 6, 'Should have corrected count');
}

#[test]
fn test_multiple_corrections() {
    let contract_address = deploy_traceability_oracle();
    let dispatcher = ITraceabilityOracleDispatcher { contract_address };

    let animal_id = animal_id_1();

    cheat_caller_address(contract_address, attestor(), CheatSpan::Indefinite);

    // Initial anchor
    dispatcher.anchor_trace(animal_id, 'root_v1', 5);

    // First correction
    dispatcher.correct_trace(animal_id, 'root_v2', 6, 'correction_1');

    // Second correction
    dispatcher.correct_trace(animal_id, 'root_v3', 7, 'correction_2');

    stop_cheat_caller_address(contract_address);

    assert(dispatcher.get_correction_count(animal_id) == 2, 'Should have 2 corrections');
    assert(dispatcher.get_last_root(animal_id) == 'root_v3', 'Should have latest root');
}

#[test]
#[should_panic(expected: 'No existing anchor')]
fn test_correct_trace_no_anchor() {
    let contract_address = deploy_traceability_oracle();
    let dispatcher = ITraceabilityOracleDispatcher { contract_address };

    // Try to correct without anchoring first
    cheat_caller_address(contract_address, attestor(), CheatSpan::TargetCalls(1));
    dispatcher.correct_trace(animal_id_1(), 'new_root', 5, 'reason');
}

#[test]
#[should_panic(expected: 'Reason required')]
fn test_correct_trace_no_reason() {
    let contract_address = deploy_traceability_oracle();
    let dispatcher = ITraceabilityOracleDispatcher { contract_address };

    cheat_caller_address(contract_address, attestor(), CheatSpan::Indefinite);

    dispatcher.anchor_trace(animal_id_1(), 'root', 5);
    dispatcher.correct_trace(animal_id_1(), 'new_root', 6, 0);
}

// ----------------------------------------------------------------------------
// Admin Tests
// ----------------------------------------------------------------------------

#[test]
fn test_set_attestor() {
    let contract_address = deploy_traceability_oracle();
    let dispatcher = ITraceabilityOracleDispatcher { contract_address };

    cheat_caller_address(contract_address, owner(), CheatSpan::TargetCalls(1));
    dispatcher.set_attestor(new_attestor());

    assert(dispatcher.get_attestor() == new_attestor(), 'Attestor not updated');
}

#[test]
#[should_panic(expected: 'Caller is not the owner')]
fn test_set_attestor_not_owner() {
    let contract_address = deploy_traceability_oracle();
    let dispatcher = ITraceabilityOracleDispatcher { contract_address };

    cheat_caller_address(contract_address, other_user(), CheatSpan::TargetCalls(1));
    dispatcher.set_attestor(new_attestor());
}

#[test]
fn test_new_attestor_can_anchor() {
    let contract_address = deploy_traceability_oracle();
    let dispatcher = ITraceabilityOracleDispatcher { contract_address };

    // Change attestor
    cheat_caller_address(contract_address, owner(), CheatSpan::TargetCalls(1));
    dispatcher.set_attestor(new_attestor());

    // New attestor should be able to anchor
    cheat_caller_address(contract_address, new_attestor(), CheatSpan::TargetCalls(1));
    dispatcher.anchor_trace(animal_id_1(), 'root', 5);

    assert(dispatcher.get_last_root(animal_id_1()) == 'root', 'New attestor should work');
}

#[test]
#[should_panic(expected: 'Caller is not attestor')]
fn test_old_attestor_cannot_anchor() {
    let contract_address = deploy_traceability_oracle();
    let dispatcher = ITraceabilityOracleDispatcher { contract_address };

    // Change attestor
    cheat_caller_address(contract_address, owner(), CheatSpan::TargetCalls(1));
    dispatcher.set_attestor(new_attestor());

    // Old attestor should fail
    cheat_caller_address(contract_address, attestor(), CheatSpan::TargetCalls(1));
    dispatcher.anchor_trace(animal_id_1(), 'root', 5);
}
