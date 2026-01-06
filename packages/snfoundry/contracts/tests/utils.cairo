// ============================================================================
// TEST UTILITIES
// ============================================================================
// Shared test utilities, constants, and helper functions used across all tests.
// ============================================================================

use contracts::lot_factory::{ILotFactoryDispatcher, ILotFactoryDispatcherTrait};
use openzeppelin_testing::declare_and_deploy;
use openzeppelin_utils::serde::SerializedAppend;
use snforge_std::{
    CheatSpan, DeclareResultTrait, cheat_caller_address, declare,
    start_cheat_block_timestamp_global,
};
use starknet::{ContractAddress, SyscallResultTrait};

// ============================================================================
// TEST ADDRESS CONSTANTS
// ============================================================================
pub const OWNER: felt252 = 0x1;
pub const OPERATOR: felt252 = 0x2;
pub const ATTESTOR: felt252 = 0x3;
pub const ISSUER: felt252 = 0x4;
pub const CUSTODIAN_1: felt252 = 0x5;
pub const CUSTODIAN_2: felt252 = 0x6;
pub const SETTLEMENT_REGISTRY: felt252 = 0x7;
pub const INVESTOR_1: felt252 = 0x10;
pub const INVESTOR_2: felt252 = 0x11;
pub const INVESTOR_3: felt252 = 0x12;
pub const OTHER_USER: felt252 = 0x99;

// ============================================================================
// ADDRESS HELPER FUNCTIONS
// ============================================================================
pub fn owner() -> ContractAddress {
    OWNER.try_into().unwrap()
}

pub fn operator() -> ContractAddress {
    OPERATOR.try_into().unwrap()
}

pub fn attestor() -> ContractAddress {
    ATTESTOR.try_into().unwrap()
}

pub fn issuer() -> ContractAddress {
    ISSUER.try_into().unwrap()
}

pub fn custodian_1() -> ContractAddress {
    CUSTODIAN_1.try_into().unwrap()
}

pub fn custodian_2() -> ContractAddress {
    CUSTODIAN_2.try_into().unwrap()
}

pub fn settlement_registry() -> ContractAddress {
    SETTLEMENT_REGISTRY.try_into().unwrap()
}

pub fn investor_1() -> ContractAddress {
    INVESTOR_1.try_into().unwrap()
}

pub fn investor_2() -> ContractAddress {
    INVESTOR_2.try_into().unwrap()
}

pub fn investor_3() -> ContractAddress {
    INVESTOR_3.try_into().unwrap()
}

pub fn other_user() -> ContractAddress {
    OTHER_USER.try_into().unwrap()
}

// ============================================================================
// SAMPLE ANIMAL IDS
// ============================================================================
pub fn animal_id_1() -> u256 {
    1001
}

pub fn animal_id_2() -> u256 {
    1002
}

pub fn create_animal_id(sequence: u64) -> u256 {
    sequence.into()
}

// ============================================================================
// DEPLOYMENT HELPERS
// ============================================================================

/// Deploys the LotFactory contract with LotSharesToken class hash configured.
/// Also sets the settlement registry.
pub fn deploy_lot_factory() -> ContractAddress {
    let token_declare_result = declare("LotSharesToken").unwrap_syscall();
    let token_class_hash = *token_declare_result.contract_class().class_hash;

    let mut calldata = array![];
    calldata.append_serde(owner());
    calldata.append_serde(operator());
    calldata.append_serde(token_class_hash);
    let lot_factory_address = declare_and_deploy("LotFactory", calldata);
    let dispatcher = ILotFactoryDispatcher { contract_address: lot_factory_address };

    cheat_caller_address(lot_factory_address, owner(), CheatSpan::TargetCalls(1));
    dispatcher.set_settlement_registry(settlement_registry());

    lot_factory_address
}

/// Creates a new lot via the LotFactory and returns the lot_id.
pub fn create_lot(lot_factory_address: ContractAddress) -> u256 {
    let dispatcher = ILotFactoryDispatcher { contract_address: lot_factory_address };

    cheat_caller_address(lot_factory_address, operator(), CheatSpan::TargetCalls(1));
    dispatcher.create_lot(custodian_1(), 1000, 100, 'metadata_hash', "Lot 1", "LOT1")
}

/// Deploys the AnimalRegistry contract.
pub fn deploy_animal_registry(lot_factory_address: ContractAddress) -> ContractAddress {
    // Set block timestamp globally to a non-zero value so animal_exists checks work
    start_cheat_block_timestamp_global(1000);

    let mut calldata = array![];
    calldata.append_serde(owner());
    calldata.append_serde(operator());
    calldata.append_serde(lot_factory_address);
    declare_and_deploy("AnimalRegistry", calldata)
}

/// Deploys the TraceabilityOracle contract.
pub fn deploy_traceability_oracle() -> ContractAddress {
    start_cheat_block_timestamp_global(1000);

    let mut calldata = array![];
    calldata.append_serde(owner());
    calldata.append_serde(attestor());
    declare_and_deploy("TraceabilityOracle", calldata)
}

/// Deploys the SettlementRegistry contract.
pub fn deploy_settlement_registry(lot_factory: ContractAddress) -> ContractAddress {
    let mut calldata = array![];
    calldata.append_serde(owner());
    calldata.append_serde(operator());
    calldata.append_serde(lot_factory);
    declare_and_deploy("SettlementRegistry", calldata)
}

/// Deploys LotFactory and creates a lot, returning the shares token address.
pub fn deploy_lot_shares_token() -> ContractAddress {
    let lot_factory_address = deploy_lot_factory();
    let dispatcher = ILotFactoryDispatcher { contract_address: lot_factory_address };

    cheat_caller_address(lot_factory_address, operator(), CheatSpan::TargetCalls(1));
    let lot_id = dispatcher
        .create_lot(issuer(), 10000, 100, 'metadata_hash', "Lot 1 Shares", "LOT1");

    dispatcher.get_shares_token(lot_id)
}

// ============================================================================
// COMMON TEST VALUES
// ============================================================================
pub const TOTAL_SHARES: u256 = 10000;
