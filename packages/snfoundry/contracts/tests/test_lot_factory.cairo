// ============================================================================
// LOT FACTORY TESTS
// ============================================================================

use contracts::constants::LotStatus;
use contracts::lot_factory::{ILotFactoryDispatcher, ILotFactoryDispatcherTrait};
use contracts::lot_shares_token::{ILotSharesTokenDispatcher, ILotSharesTokenDispatcherTrait};
use core::num::traits::Zero;
use snforge_std::{
    CheatSpan, cheat_caller_address, start_cheat_block_timestamp, stop_cheat_caller_address,
};
use super::utils::{deploy_lot_factory, issuer, operator, other_user, owner, settlement_registry};

// ----------------------------------------------------------------------------
// Deployment Tests
// ----------------------------------------------------------------------------

#[test]
fn test_deployment() {
    let contract_address = deploy_lot_factory();
    let dispatcher = ILotFactoryDispatcher { contract_address };

    assert(dispatcher.get_protocol_operator() == operator(), 'Wrong operator');
    assert(dispatcher.get_next_lot_id() == 1, 'Should start at 1');
    assert(dispatcher.get_shares_token_class_hash().is_non_zero(), 'Class hash should be set');
}

// ----------------------------------------------------------------------------
// Create Lot Tests
// ----------------------------------------------------------------------------

#[test]
fn test_create_lot_success() {
    let contract_address = deploy_lot_factory();
    let dispatcher = ILotFactoryDispatcher { contract_address };

    let total_shares: u256 = 1000;
    let initial_price_per_share: u256 = 7700000; // $77 with 6 decimals
    let metadata_hash: felt252 = 'lot_metadata_hash';
    let token_name: ByteArray = "Angus Premium Q1";
    let token_symbol: ByteArray = "ANGUS1";

    // Call as operator
    cheat_caller_address(contract_address, operator(), CheatSpan::TargetCalls(1));
    let lot_id = dispatcher
        .create_lot(
            issuer(),
            total_shares,
            initial_price_per_share,
            metadata_hash,
            token_name,
            token_symbol,
        );

    assert(lot_id == 1, 'First lot should be ID 1');
    assert(dispatcher.get_next_lot_id() == 2, 'Next ID should be 2');

    let lot = dispatcher.get_lot(lot_id);
    assert(lot.issuer == issuer(), 'Wrong issuer');
    assert(lot.status == LotStatus::ACTIVE, 'Should be active');
    assert(lot.total_shares == total_shares, 'Wrong total shares');
    assert(lot.initial_price_per_share == initial_price_per_share, 'Wrong initial price');
    assert(lot.metadata_hash == metadata_hash, 'Wrong metadata hash');

    // Verify token was deployed
    let shares_token = dispatcher.get_shares_token(lot_id);
    assert(!shares_token.is_zero(), 'Token should be deployed');

    // Verify token properties
    let token_dispatcher = ILotSharesTokenDispatcher { contract_address: shares_token };
    assert(token_dispatcher.name() == "Angus Premium Q1", 'Wrong token name');
    assert(token_dispatcher.symbol() == "ANGUS1", 'Wrong token symbol');
    assert(token_dispatcher.lot_id() == lot_id, 'Wrong lot_id in token');
    assert(token_dispatcher.lot_factory() == contract_address, 'Wrong lot_factory in token');
    assert(token_dispatcher.total_shares() == total_shares, 'Wrong total_shares in token');
    assert(
        dispatcher.get_initial_price_per_share(lot_id) == initial_price_per_share,
        'Wrong price getter',
    );
}

#[test]
fn test_create_multiple_lots() {
    let contract_address = deploy_lot_factory();
    let dispatcher = ILotFactoryDispatcher { contract_address };

    // Use indefinite cheat for multiple calls
    cheat_caller_address(contract_address, operator(), CheatSpan::Indefinite);

    let lot_id_1 = dispatcher.create_lot(issuer(), 1000, 5000000, 'hash1', "Lot 1", "LOT1");
    let lot_id_2 = dispatcher.create_lot(issuer(), 2000, 8000000, 'hash2', "Lot 2", "LOT2");

    stop_cheat_caller_address(contract_address);

    assert(lot_id_1 == 1, 'First lot should be 1');
    assert(lot_id_2 == 2, 'Second lot should be 2');
    assert(dispatcher.get_next_lot_id() == 3, 'Next ID should be 3');

    // Verify each lot has its own token
    let token_1 = dispatcher.get_shares_token(lot_id_1);
    let token_2 = dispatcher.get_shares_token(lot_id_2);
    assert(token_1 != token_2, 'Tokens should be different');
}

#[test]
#[should_panic(expected: 'Caller is not operator')]
fn test_create_lot_not_operator() {
    let contract_address = deploy_lot_factory();
    let dispatcher = ILotFactoryDispatcher { contract_address };

    // Call as non-operator
    cheat_caller_address(contract_address, other_user(), CheatSpan::TargetCalls(1));
    dispatcher.create_lot(issuer(), 1000, 5000000, 'hash', "Test", "TST");
}

#[test]
#[should_panic(expected: 'Total shares must be > 0')]
fn test_create_lot_zero_shares() {
    let contract_address = deploy_lot_factory();
    let dispatcher = ILotFactoryDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::TargetCalls(1));
    dispatcher.create_lot(issuer(), 0, 5000000, 'hash', "Test", "TST");
}

#[test]
#[should_panic(expected: 'Price must be > 0')]
fn test_create_lot_zero_price() {
    let contract_address = deploy_lot_factory();
    let dispatcher = ILotFactoryDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::TargetCalls(1));
    dispatcher.create_lot(issuer(), 1000, 0, 'hash', "Test", "TST");
}

// ----------------------------------------------------------------------------
// Status Change Tests
// ----------------------------------------------------------------------------

#[test]
fn test_set_lot_status_to_paused() {
    let contract_address = deploy_lot_factory();
    let dispatcher = ILotFactoryDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::Indefinite);
    start_cheat_block_timestamp(contract_address, 1000);
    // Create lot
    let lot_id = dispatcher.create_lot(issuer(), 1000, 5000000, 'hash', "Test", "TST");

    // Change to Paused
    dispatcher.set_lot_status(lot_id, LotStatus::PAUSED);

    stop_cheat_caller_address(contract_address);

    assert(dispatcher.get_lot_status(lot_id) == LotStatus::PAUSED, 'Should be paused');
}

#[test]
fn test_set_lot_status_to_settled_by_registry() {
    let contract_address = deploy_lot_factory();
    let dispatcher = ILotFactoryDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::Indefinite);
    start_cheat_block_timestamp(contract_address, 1000);

    // Create lot
    let lot_id = dispatcher.create_lot(issuer(), 1000, 5000000, 'hash', "Test", "TST");

    stop_cheat_caller_address(contract_address);

    // Change to Settled as settlement registry
    cheat_caller_address(contract_address, settlement_registry(), CheatSpan::TargetCalls(1));
    dispatcher.set_lot_status(lot_id, LotStatus::SETTLED);

    assert(dispatcher.get_lot_status(lot_id) == LotStatus::SETTLED, 'Should be settled');
}

#[test]
#[should_panic(expected: 'Operator cannot set SETTLED')]
fn test_set_lot_status_to_settled_by_operator() {
    let contract_address = deploy_lot_factory();
    let dispatcher = ILotFactoryDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::Indefinite);
    start_cheat_block_timestamp(contract_address, 1000);

    let lot_id = dispatcher.create_lot(issuer(), 1000, 5000000, 'hash', "Test", "TST");

    dispatcher.set_lot_status(lot_id, LotStatus::SETTLED);
}

#[test]
#[should_panic(expected: 'Cannot change settled lot')]
fn test_cannot_change_status_after_settled() {
    let contract_address = deploy_lot_factory();
    let dispatcher = ILotFactoryDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::Indefinite);
    start_cheat_block_timestamp(contract_address, 1000);

    // Create and settle lot
    let lot_id = dispatcher.create_lot(issuer(), 1000, 5000000, 'hash', "Test", "TST");
    stop_cheat_caller_address(contract_address);

    cheat_caller_address(contract_address, settlement_registry(), CheatSpan::TargetCalls(1));
    dispatcher.set_lot_status(lot_id, LotStatus::SETTLED);

    // Try to change again - should fail
    cheat_caller_address(contract_address, operator(), CheatSpan::TargetCalls(1));
    dispatcher.set_lot_status(lot_id, LotStatus::ACTIVE);
}

#[test]
#[should_panic(expected: 'Lot does not exist')]
fn test_set_status_nonexistent_lot() {
    let contract_address = deploy_lot_factory();
    let dispatcher = ILotFactoryDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::TargetCalls(1));
    dispatcher.set_lot_status(999, LotStatus::PAUSED);
}

#[test]
fn test_set_lot_status_to_funded() {
    let contract_address = deploy_lot_factory();
    let dispatcher = ILotFactoryDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::Indefinite);
    start_cheat_block_timestamp(contract_address, 1000);

    // Create lot
    let lot_id = dispatcher.create_lot(issuer(), 1000, 5000000, 'hash', "Test", "TST");

    // Change to Funded
    dispatcher.set_lot_status(lot_id, LotStatus::FUNDED);

    stop_cheat_caller_address(contract_address);

    assert(dispatcher.get_lot_status(lot_id) == LotStatus::FUNDED, 'Should be funded');
}

#[test]
#[should_panic(expected: 'Cannot unfund lot')]
fn test_cannot_go_from_funded_to_active() {
    let contract_address = deploy_lot_factory();
    let dispatcher = ILotFactoryDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::Indefinite);
    start_cheat_block_timestamp(contract_address, 1000);

    // Create and fund lot
    let lot_id = dispatcher.create_lot(issuer(), 1000, 5000000, 'hash', "Test", "TST");
    dispatcher.set_lot_status(lot_id, LotStatus::FUNDED);

    // Try to go back to ACTIVE - should fail
    dispatcher.set_lot_status(lot_id, LotStatus::ACTIVE);
}

#[test]
fn test_funded_to_settled() {
    let contract_address = deploy_lot_factory();
    let dispatcher = ILotFactoryDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::Indefinite);
    start_cheat_block_timestamp(contract_address, 1000);

    // Create → Fund → Settle
    let lot_id = dispatcher.create_lot(issuer(), 1000, 5000000, 'hash', "Test", "TST");
    dispatcher.set_lot_status(lot_id, LotStatus::FUNDED);

    stop_cheat_caller_address(contract_address);

    cheat_caller_address(contract_address, settlement_registry(), CheatSpan::TargetCalls(1));
    dispatcher.set_lot_status(lot_id, LotStatus::SETTLED);

    assert(dispatcher.get_lot_status(lot_id) == LotStatus::SETTLED, 'Should be settled');
}

#[test]
fn test_funded_to_paused() {
    let contract_address = deploy_lot_factory();
    let dispatcher = ILotFactoryDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::Indefinite);
    start_cheat_block_timestamp(contract_address, 1000);

    // Create → Fund → Pause
    let lot_id = dispatcher.create_lot(issuer(), 1000, 5000000, 'hash', "Test", "TST");
    dispatcher.set_lot_status(lot_id, LotStatus::FUNDED);
    dispatcher.set_lot_status(lot_id, LotStatus::PAUSED);

    stop_cheat_caller_address(contract_address);

    assert(dispatcher.get_lot_status(lot_id) == LotStatus::PAUSED, 'Should be paused');
}

// ----------------------------------------------------------------------------
// Admin Tests
// ----------------------------------------------------------------------------

#[test]
fn test_set_protocol_operator() {
    let contract_address = deploy_lot_factory();
    let dispatcher = ILotFactoryDispatcher { contract_address };

    let new_operator = other_user();

    // Call as owner
    cheat_caller_address(contract_address, owner(), CheatSpan::TargetCalls(1));
    dispatcher.set_protocol_operator(new_operator);

    assert(dispatcher.get_protocol_operator() == new_operator, 'Operator not updated');
}

#[test]
#[should_panic(expected: 'Caller is not the owner')]
fn test_set_protocol_operator_not_owner() {
    let contract_address = deploy_lot_factory();
    let dispatcher = ILotFactoryDispatcher { contract_address };

    cheat_caller_address(contract_address, other_user(), CheatSpan::TargetCalls(1));
    dispatcher.set_protocol_operator(other_user());
}
