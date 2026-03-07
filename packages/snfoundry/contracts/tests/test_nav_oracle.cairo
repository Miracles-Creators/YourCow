use contracts::nav_oracle::{INavOracleDispatcher, INavOracleDispatcherTrait};
use snforge_std::{CheatSpan, cheat_caller_address};
use super::utils::{deploy_nav_oracle, operator, other_user, owner};

const NEW_OPERATOR: felt252 = 0x30;

fn new_operator() -> starknet::ContractAddress {
    NEW_OPERATOR.try_into().unwrap()
}

#[test]
fn test_deployment() {
    let contract_address = deploy_nav_oracle();
    let dispatcher = INavOracleDispatcher { contract_address };
    assert(dispatcher.get_operator() == operator(), 'Wrong operator');
}

#[test]
fn test_update_market_prices() {
    let contract_address = deploy_nav_oracle();
    let dispatcher = INavOracleDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::TargetCalls(1));
    dispatcher.update_market_prices(88384, 23500, 120000);

    let prices = dispatcher.get_market_prices();
    assert(prices.beef_price == 88384, 'Wrong beef price');
    assert(prices.corn_price == 23500, 'Wrong corn price');
    assert(prices.ars_usd_rate == 120000, 'Wrong ARS/USD rate');
}

#[test]
#[should_panic(expected: 'Caller is not operator')]
fn test_update_market_prices_not_operator() {
    let contract_address = deploy_nav_oracle();
    let dispatcher = INavOracleDispatcher { contract_address };

    cheat_caller_address(contract_address, other_user(), CheatSpan::TargetCalls(1));
    dispatcher.update_market_prices(88384, 23500, 120000);
}

#[test]
fn test_update_nav_batch() {
    let contract_address = deploy_nav_oracle();
    let dispatcher = INavOracleDispatcher { contract_address };

    let lot_ids: Array<u256> = array![1, 2];
    let nav_values: Array<u128> = array![150000, 280000];
    let nav_per_shares: Array<u128> = array![15, 28];
    let weight_grams: Array<u32> = array![450000, 800000];

    cheat_caller_address(contract_address, operator(), CheatSpan::TargetCalls(1));
    dispatcher
        .update_nav_batch(
            lot_ids.span(), nav_values.span(), nav_per_shares.span(), weight_grams.span(),
        );

    let nav1 = dispatcher.get_nav(1);
    assert(nav1.nav_value == 150000, 'Wrong NAV lot 1');
    assert(nav1.nav_per_share == 15, 'Wrong NAV/share lot 1');
    assert(nav1.weight_grams == 450000, 'Wrong weight lot 1');

    let nav2 = dispatcher.get_nav(2);
    assert(nav2.nav_value == 280000, 'Wrong NAV lot 2');
    assert(nav2.nav_per_share == 28, 'Wrong NAV/share lot 2');
    assert(nav2.weight_grams == 800000, 'Wrong weight lot 2');
}

#[test]
#[should_panic(expected: 'Caller is not operator')]
fn test_update_nav_batch_not_operator() {
    let contract_address = deploy_nav_oracle();
    let dispatcher = INavOracleDispatcher { contract_address };

    let lot_ids: Array<u256> = array![1];
    let nav_values: Array<u128> = array![150000];
    let nav_per_shares: Array<u128> = array![15];
    let weight_grams: Array<u32> = array![450000];

    cheat_caller_address(contract_address, other_user(), CheatSpan::TargetCalls(1));
    dispatcher
        .update_nav_batch(
            lot_ids.span(), nav_values.span(), nav_per_shares.span(), weight_grams.span(),
        );
}

#[test]
#[should_panic(expected: 'Length mismatch')]
fn test_update_nav_batch_length_mismatch() {
    let contract_address = deploy_nav_oracle();
    let dispatcher = INavOracleDispatcher { contract_address };

    let lot_ids: Array<u256> = array![1, 2];
    let nav_values: Array<u128> = array![150000];
    let nav_per_shares: Array<u128> = array![15, 28];
    let weight_grams: Array<u32> = array![450000, 800000];

    cheat_caller_address(contract_address, operator(), CheatSpan::TargetCalls(1));
    dispatcher
        .update_nav_batch(
            lot_ids.span(), nav_values.span(), nav_per_shares.span(), weight_grams.span(),
        );
}

#[test]
fn test_set_operator() {
    let contract_address = deploy_nav_oracle();
    let dispatcher = INavOracleDispatcher { contract_address };

    cheat_caller_address(contract_address, owner(), CheatSpan::TargetCalls(1));
    dispatcher.set_operator(new_operator());

    assert(dispatcher.get_operator() == new_operator(), 'Operator not updated');
}

#[test]
#[should_panic(expected: 'Caller is not the owner')]
fn test_set_operator_not_owner() {
    let contract_address = deploy_nav_oracle();
    let dispatcher = INavOracleDispatcher { contract_address };

    cheat_caller_address(contract_address, other_user(), CheatSpan::TargetCalls(1));
    dispatcher.set_operator(new_operator());
}
