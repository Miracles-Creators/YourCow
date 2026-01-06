// ============================================================================
// LOT SHARES TOKEN TESTS
// ============================================================================

use contracts::constants::LotStatus;
use contracts::lot_factory::{ILotFactoryDispatcher, ILotFactoryDispatcherTrait};
use contracts::lot_shares_token::{ILotSharesTokenDispatcher, ILotSharesTokenDispatcherTrait};
use core::num::traits::Zero;
use snforge_std::{CheatSpan, cheat_caller_address, start_cheat_block_timestamp_global};
use super::utils::{
    TOTAL_SHARES, deploy_lot_factory, deploy_lot_shares_token, investor_1, investor_2, issuer,
    operator, other_user,
};

// ----------------------------------------------------------------------------
// Deployment Tests
// ----------------------------------------------------------------------------

#[test]
fn test_deployment() {
    let contract_address = deploy_lot_shares_token();
    let dispatcher = ILotSharesTokenDispatcher { contract_address };

    assert(dispatcher.name() == "Lot 1 Shares", 'Wrong name');
    assert(dispatcher.symbol() == "LOT1", 'Wrong symbol');
    assert(dispatcher.decimals() == 18, 'Wrong decimals');
    assert(dispatcher.lot_id() == 1, 'Wrong lot_id');
    assert(!dispatcher.lot_factory().is_zero(), 'Wrong lot_factory');
    assert(dispatcher.protocol_operator() == operator(), 'Wrong operator');
    assert(dispatcher.total_supply() == 0, 'Should start at 0');
    assert(dispatcher.total_shares() == TOTAL_SHARES, 'Wrong total_shares');
    assert(!dispatcher.is_frozen(), 'Should not be frozen');
    assert(!dispatcher.is_fully_funded(), 'Should not be funded');
}

// ----------------------------------------------------------------------------
// Minting Tests
// ----------------------------------------------------------------------------

#[test]
fn test_mint_success() {
    let contract_address = deploy_lot_shares_token();
    let dispatcher = ILotSharesTokenDispatcher { contract_address };

    let amount: u256 = 1000;

    cheat_caller_address(contract_address, operator(), CheatSpan::TargetCalls(1));
    dispatcher.mint(investor_1(), amount);

    assert(dispatcher.balance_of(investor_1()) == amount, 'Wrong balance');
    assert(dispatcher.total_supply() == amount, 'Wrong total supply');
}

#[test]
fn test_mint_multiple_investors() {
    let contract_address = deploy_lot_shares_token();
    let dispatcher = ILotSharesTokenDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::TargetCalls(1));
    dispatcher.mint(investor_1(), 1000);

    cheat_caller_address(contract_address, operator(), CheatSpan::TargetCalls(1));
    dispatcher.mint(investor_2(), 500);

    assert(dispatcher.balance_of(investor_1()) == 1000, 'Wrong balance investor 1');
    assert(dispatcher.balance_of(investor_2()) == 500, 'Wrong balance investor 2');
    assert(dispatcher.total_supply() == 1500, 'Wrong total supply');
}

// #[test]
// fn test_fully_funded_for_mint(){
//     let contract_address = deploy_lot_shares_token();
//     let dispatcher = ILotSharesTokenDispatcher { contract_address };

//     cheat_caller_address(contract_address, operator(), CheatSpan::TargetCalls(1));
//     dispatcher.mint(investor_1(), TOTAL_SHARES);

//     assert(dispatcher.is_fully_funded(), 'Should be fully funded');
// }

#[test]
#[should_panic(expected: 'Caller is not operator')]
fn test_mint_not_operator() {
    let contract_address = deploy_lot_shares_token();
    let dispatcher = ILotSharesTokenDispatcher { contract_address };

    cheat_caller_address(contract_address, other_user(), CheatSpan::TargetCalls(1));
    dispatcher.mint(investor_1(), 1000);
}

#[test]
#[should_panic(expected: 'Lot not transferable')]
fn test_mint_when_frozen() {
    let contract_address = deploy_lot_shares_token();
    let dispatcher = ILotSharesTokenDispatcher { contract_address };

    // Freeze token
    cheat_caller_address(contract_address, operator(), CheatSpan::TargetCalls(1));
    dispatcher.freeze();

    // Try to mint - should fail
    cheat_caller_address(contract_address, operator(), CheatSpan::TargetCalls(1));
    dispatcher.mint(investor_1(), 1000);
}

#[test]
#[should_panic(expected: 'Exceeds total shares')]
fn test_mint_exceeds_total_shares() {
    let contract_address = deploy_lot_shares_token();
    let dispatcher = ILotSharesTokenDispatcher { contract_address };

    // Try to mint more than total_shares
    cheat_caller_address(contract_address, operator(), CheatSpan::TargetCalls(1));
    dispatcher.mint(investor_1(), TOTAL_SHARES + 1);
}

#[test]
fn test_mint_fully_funded_updates_lot_status() {
    start_cheat_block_timestamp_global(1000);
    let lot_factory_address = deploy_lot_factory();
    let lot_factory = ILotFactoryDispatcher { contract_address: lot_factory_address };

    cheat_caller_address(lot_factory_address, operator(), CheatSpan::TargetCalls(1));
    let lot_id = lot_factory
        .create_lot(issuer(), TOTAL_SHARES, 100, 'metadata_hash', "Lot 1 Shares", "LOT1");

    let shares_token_address = lot_factory.get_shares_token(lot_id);
    let shares_token = ILotSharesTokenDispatcher { contract_address: shares_token_address };

    cheat_caller_address(shares_token_address, operator(), CheatSpan::TargetCalls(1));
    shares_token.mint(investor_1(), TOTAL_SHARES);

    assert(lot_factory.get_lot_status(lot_id) == LotStatus::FUNDED, 'Lot should be FUNDED');
    assert(shares_token.is_fully_funded(), 'should be fully funded');
}

// ----------------------------------------------------------------------------
// Transfer Tests
// ----------------------------------------------------------------------------

#[test]
fn test_transfer_success() {
    let contract_address = deploy_lot_shares_token();
    let dispatcher = ILotSharesTokenDispatcher { contract_address };

    // Mint to investor 1
    cheat_caller_address(contract_address, operator(), CheatSpan::TargetCalls(1));
    dispatcher.mint(investor_1(), 1000);

    // Transfer from investor 1 to investor 2
    cheat_caller_address(contract_address, investor_1(), CheatSpan::TargetCalls(1));
    let result = dispatcher.transfer(investor_2(), 300);

    assert(result, 'Transfer should return true');
    assert(dispatcher.balance_of(investor_1()) == 700, 'Wrong sender balance');
    assert(dispatcher.balance_of(investor_2()) == 300, 'Wrong recipient balance');
}

#[test]
#[should_panic(expected: 'ERC20: insufficient balance')]
fn test_transfer_insufficient_balance() {
    let contract_address = deploy_lot_shares_token();
    let dispatcher = ILotSharesTokenDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::TargetCalls(1));
    dispatcher.mint(investor_1(), 100);

    cheat_caller_address(contract_address, investor_1(), CheatSpan::TargetCalls(1));
    dispatcher.transfer(investor_2(), 200);
}

#[test]
#[should_panic(expected: 'Lot not transferable')]
fn test_transfer_when_frozen() {
    let contract_address = deploy_lot_shares_token();
    let dispatcher = ILotSharesTokenDispatcher { contract_address };

    // Mint and freeze
    cheat_caller_address(contract_address, operator(), CheatSpan::TargetCalls(1));
    dispatcher.mint(investor_1(), 1000);

    cheat_caller_address(contract_address, operator(), CheatSpan::TargetCalls(1));
    dispatcher.freeze();

    // Try to transfer - should fail
    cheat_caller_address(contract_address, investor_1(), CheatSpan::TargetCalls(1));
    dispatcher.transfer(investor_2(), 100);
}

// ----------------------------------------------------------------------------
// Approval and TransferFrom Tests
// ----------------------------------------------------------------------------

#[test]
fn test_approve_and_transfer_from() {
    let contract_address = deploy_lot_shares_token();
    let dispatcher = ILotSharesTokenDispatcher { contract_address };

    // Mint to investor 1
    cheat_caller_address(contract_address, operator(), CheatSpan::TargetCalls(1));
    dispatcher.mint(investor_1(), 1000);

    // Investor 1 approves investor 2
    cheat_caller_address(contract_address, investor_1(), CheatSpan::TargetCalls(1));
    dispatcher.approve(investor_2(), 500);

    assert(dispatcher.allowance(investor_1(), investor_2()) == 500, 'Wrong allowance');

    // Investor 2 transfers from investor 1
    cheat_caller_address(contract_address, investor_2(), CheatSpan::TargetCalls(1));
    let result = dispatcher.transfer_from(investor_1(), investor_2(), 300);

    assert(result, 'TransferFrom should return true');
    assert(dispatcher.balance_of(investor_1()) == 700, 'Wrong sender balance');
    assert(dispatcher.balance_of(investor_2()) == 300, 'Wrong recipient balance');
    assert(dispatcher.allowance(investor_1(), investor_2()) == 200, 'Wrong remaining allowance');
}

#[test]
#[should_panic(expected: 'ERC20: insufficient allowance')]
fn test_transfer_from_insufficient_allowance() {
    let contract_address = deploy_lot_shares_token();
    let dispatcher = ILotSharesTokenDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::TargetCalls(1));
    dispatcher.mint(investor_1(), 1000);

    cheat_caller_address(contract_address, investor_1(), CheatSpan::TargetCalls(1));
    dispatcher.approve(investor_2(), 100);

    cheat_caller_address(contract_address, investor_2(), CheatSpan::TargetCalls(1));
    dispatcher.transfer_from(investor_1(), investor_2(), 200);
}

// ----------------------------------------------------------------------------
// Freeze Tests
// ----------------------------------------------------------------------------

#[test]
fn test_freeze_success() {
    let contract_address = deploy_lot_shares_token();
    let dispatcher = ILotSharesTokenDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::TargetCalls(1));
    dispatcher.freeze();

    assert(dispatcher.is_frozen(), 'Should be frozen');
}

#[test]
#[should_panic(expected: 'Not authorized to freeze')]
fn test_freeze_not_authorized() {
    let contract_address = deploy_lot_shares_token();
    let dispatcher = ILotSharesTokenDispatcher { contract_address };

    // other_user is neither operator nor settlement_registry
    cheat_caller_address(contract_address, other_user(), CheatSpan::TargetCalls(1));
    dispatcher.freeze();
}

#[test]
#[should_panic(expected: 'Already frozen')]
fn test_freeze_already_frozen() {
    let contract_address = deploy_lot_shares_token();
    let dispatcher = ILotSharesTokenDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::TargetCalls(1));
    dispatcher.freeze();

    cheat_caller_address(contract_address, operator(), CheatSpan::TargetCalls(1));
    dispatcher.freeze();
}
