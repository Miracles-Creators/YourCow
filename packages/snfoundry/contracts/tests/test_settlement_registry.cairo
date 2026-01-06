// ============================================================================
// SETTLEMENT REGISTRY TESTS
// ============================================================================

use contracts::settlement_registry::{
    ISettlementRegistryDispatcher, ISettlementRegistryDispatcherTrait,
};
use snforge_std::{CheatSpan, cheat_caller_address};
use starknet::ContractAddress;
use super::utils::{deploy_settlement_registry, operator, other_user, owner};

// ----------------------------------------------------------------------------
// Deployment Tests
// ----------------------------------------------------------------------------

#[test]
fn test_deployment() {
    // Use a dummy address for lot_factory
    let lot_factory: ContractAddress = 0x100.try_into().unwrap();
    let contract_address = deploy_settlement_registry(lot_factory);
    let dispatcher = ISettlementRegistryDispatcher { contract_address };

    assert(dispatcher.get_protocol_operator() == operator(), 'Wrong operator');
    assert(dispatcher.get_lot_factory() == lot_factory, 'Wrong lot factory');
}

// ----------------------------------------------------------------------------
// View Function Tests
// ----------------------------------------------------------------------------

#[test]
fn test_is_settled_returns_false_for_non_settled() {
    let lot_factory: ContractAddress = 0x100.try_into().unwrap();
    let contract_address = deploy_settlement_registry(lot_factory);
    let dispatcher = ISettlementRegistryDispatcher { contract_address };

    // Lot 1 was never settled
    assert(!dispatcher.is_settled(1), 'Should not be settled');
}

#[test]
fn test_get_settlement_default() {
    let lot_factory: ContractAddress = 0x100.try_into().unwrap();
    let contract_address = deploy_settlement_registry(lot_factory);
    let dispatcher = ISettlementRegistryDispatcher { contract_address };

    let settlement = dispatcher.get_settlement(1);
    assert(settlement.settled_at == 0, 'Should have zero timestamp');
    assert(settlement.final_report_hash == 0, 'Should have zero hash');
    assert(settlement.total_proceeds == 0, 'Should have zero proceeds');
}

// ----------------------------------------------------------------------------
// Admin Tests
// ----------------------------------------------------------------------------

#[test]
fn test_set_protocol_operator() {
    let lot_factory: ContractAddress = 0x100.try_into().unwrap();
    let contract_address = deploy_settlement_registry(lot_factory);
    let dispatcher = ISettlementRegistryDispatcher { contract_address };

    cheat_caller_address(contract_address, owner(), CheatSpan::TargetCalls(1));
    dispatcher.set_protocol_operator(other_user());

    assert(dispatcher.get_protocol_operator() == other_user(), 'Operator not updated');
}

#[test]
#[should_panic(expected: 'Caller is not the owner')]
fn test_set_protocol_operator_not_owner() {
    let lot_factory: ContractAddress = 0x100.try_into().unwrap();
    let contract_address = deploy_settlement_registry(lot_factory);
    let dispatcher = ISettlementRegistryDispatcher { contract_address };

    cheat_caller_address(contract_address, other_user(), CheatSpan::TargetCalls(1));
    dispatcher.set_protocol_operator(other_user());
}

#[test]
fn test_set_lot_factory() {
    let lot_factory: ContractAddress = 0x100.try_into().unwrap();
    let new_lot_factory: ContractAddress = 0x200.try_into().unwrap();
    let contract_address = deploy_settlement_registry(lot_factory);
    let dispatcher = ISettlementRegistryDispatcher { contract_address };

    cheat_caller_address(contract_address, owner(), CheatSpan::TargetCalls(1));
    dispatcher.set_lot_factory(new_lot_factory);

    assert(dispatcher.get_lot_factory() == new_lot_factory, 'Lot factory not updated');
}

#[test]
#[should_panic(expected: 'Caller is not the owner')]
fn test_set_lot_factory_not_owner() {
    let lot_factory: ContractAddress = 0x100.try_into().unwrap();
    let new_lot_factory: ContractAddress = 0x200.try_into().unwrap();
    let contract_address = deploy_settlement_registry(lot_factory);
    let dispatcher = ISettlementRegistryDispatcher { contract_address };

    cheat_caller_address(contract_address, other_user(), CheatSpan::TargetCalls(1));
    dispatcher.set_lot_factory(new_lot_factory);
}
// Note: Full settle_lot tests require integration tests with actual
// LotFactory and LotSharesToken contracts deployed together.
// See test_integration.cairo for end-to-end tests.


