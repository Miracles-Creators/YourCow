// ============================================================================
// BEEFCHAIN PROTOCOL - END-TO-END INTEGRATION TEST
// ============================================================================
// This test covers the complete MVP flow from PROJECT_SPEC.MD section 6:
//
// 1. Create lot
// 2. Register animals
// 3. Assign animals to lot
// 4. Mint shares after fiat payments
// 5. Anchor trace roots per animal
// 6. Transfer shares (while Active)
// 7. Settle lot
// 8. Verify transfers fail after settlement
// 9. Export balances for fiat payout
// ============================================================================

use contracts::animal_registry::{IAnimalRegistryDispatcher, IAnimalRegistryDispatcherTrait};
use contracts::constants::{AnimalStatus, LotStatus};
use contracts::lot_factory::{ILotFactoryDispatcher, ILotFactoryDispatcherTrait};
use contracts::lot_shares_token::{ILotSharesTokenDispatcher, ILotSharesTokenDispatcherTrait};
use contracts::settlement_registry::{
    ISettlementRegistryDispatcher, ISettlementRegistryDispatcherTrait,
};
use contracts::traceability_oracle::{
    ITraceabilityOracleDispatcher, ITraceabilityOracleDispatcherTrait,
};
use core::num::traits::Zero;
use openzeppelin_testing::declare_and_deploy;
use openzeppelin_utils::serde::SerializedAppend;
use snforge_std::{
    CheatSpan, DeclareResultTrait, cheat_caller_address, declare,
    start_cheat_block_timestamp_global,
};
use starknet::SyscallResultTrait;
use super::utils::{
    attestor, create_animal_id, investor_1, investor_2, investor_3, issuer, operator, owner,
};

// ----------------------------------------------------------------------------
// Protocol Deployment
// ----------------------------------------------------------------------------
#[derive(Drop)]
struct ProtocolContracts {
    lot_factory: ILotFactoryDispatcher,
    animal_registry: IAnimalRegistryDispatcher,
    traceability_oracle: ITraceabilityOracleDispatcher,
    settlement_registry: ISettlementRegistryDispatcher,
}

fn deploy_protocol() -> ProtocolContracts {
    // 1. Declare LotSharesToken to get class hash
    let token_declare_result = declare("LotSharesToken").unwrap_syscall();
    let token_class_hash = *token_declare_result.contract_class().class_hash;

    // 2. Deploy LotFactory
    let mut lot_factory_calldata = array![];
    lot_factory_calldata.append_serde(owner());
    lot_factory_calldata.append_serde(operator());
    lot_factory_calldata.append_serde(token_class_hash);
    let lot_factory_address = declare_and_deploy("LotFactory", lot_factory_calldata);
    let lot_factory = ILotFactoryDispatcher { contract_address: lot_factory_address };

    // 3. Deploy AnimalRegistry
    let mut animal_registry_calldata = array![];
    animal_registry_calldata.append_serde(owner());
    animal_registry_calldata.append_serde(operator());
    animal_registry_calldata.append_serde(lot_factory_address);
    let animal_registry_address = declare_and_deploy("AnimalRegistry", animal_registry_calldata);
    let animal_registry = IAnimalRegistryDispatcher { contract_address: animal_registry_address };

    // 4. Deploy TraceabilityOracle
    let mut oracle_calldata = array![];
    oracle_calldata.append_serde(owner());
    oracle_calldata.append_serde(attestor());
    let oracle_address = declare_and_deploy("TraceabilityOracle", oracle_calldata);
    let traceability_oracle = ITraceabilityOracleDispatcher { contract_address: oracle_address };

    // 5. Deploy SettlementRegistry
    let mut settlement_calldata = array![];
    settlement_calldata.append_serde(owner());
    settlement_calldata.append_serde(operator());
    settlement_calldata.append_serde(lot_factory_address);
    let settlement_address = declare_and_deploy("SettlementRegistry", settlement_calldata);
    let settlement_registry = ISettlementRegistryDispatcher {
        contract_address: settlement_address,
    };

    // 6. Configure cross-contract permissions
    // Set settlement_registry in LotFactory so it can call set_lot_status(SETTLED)
    cheat_caller_address(lot_factory_address, owner(), CheatSpan::TargetCalls(1));
    lot_factory.set_settlement_registry(settlement_address);

    ProtocolContracts { lot_factory, animal_registry, traceability_oracle, settlement_registry }
}

// ----------------------------------------------------------------------------
// END-TO-END INTEGRATION TEST
// ----------------------------------------------------------------------------
#[test]
fn test_complete_mvp_flow() {
    // ========================================================================
    // SETUP: Initialize block timestamp and deploy protocol
    // ========================================================================
    // Set block timestamp to Jan 1, 2025 00:00:00 UTC
    start_cheat_block_timestamp_global(1735689600);

    let protocol = deploy_protocol();

    // ========================================================================
    // STEP 1: Create lot
    // ========================================================================
    let total_shares: u256 = 1000 * 1_000_000_000_000_000_000; // 1000 shares with 18 decimals
    let initial_price_per_share: u256 = 77_000_000; // $77.00 with 6 decimals
    let metadata_hash: felt252 = 'lot_metadata_ipfs_hash';
    let token_name: ByteArray = "Angus Premium Lot Q1 2025";
    let token_symbol: ByteArray = "APL-Q1-25";

    cheat_caller_address(
        protocol.lot_factory.contract_address, operator(), CheatSpan::TargetCalls(1),
    );
    let lot_id = protocol
        .lot_factory
        .create_lot(
            issuer(),
            total_shares,
            initial_price_per_share,
            metadata_hash,
            token_name,
            token_symbol,
        );

    assert(lot_id == 1, 'Lot ID should be 1');

    // Verify lot created correctly
    let lot = protocol.lot_factory.get_lot(lot_id);
    assert(lot.issuer == issuer(), 'Wrong issuer');
    assert(lot.status == LotStatus::ACTIVE, 'Should be ACTIVE');
    assert(lot.total_shares == total_shares, 'Wrong total shares');

    // Get shares token
    let shares_token_address = protocol.lot_factory.get_shares_token(lot_id);
    assert(!shares_token_address.is_zero(), 'Token should exist');
    let shares_token = ILotSharesTokenDispatcher { contract_address: shares_token_address };

    // Settlement registry is set at token deployment via LotFactory

    // ========================================================================
    // STEP 2: Register animals
    // ========================================================================
    let animal_1 = create_animal_id(1);
    let animal_2 = create_animal_id(2);
    let animal_3 = create_animal_id(3);
    let animal_4 = create_animal_id(4);
    let animal_5 = create_animal_id(5);

    let profile_hash_1: felt252 = 'profile_hash_animal_1';
    let profile_hash_2: felt252 = 'profile_hash_animal_2';
    let profile_hash_3: felt252 = 'profile_hash_animal_3';
    let profile_hash_4: felt252 = 'profile_hash_animal_4';
    let profile_hash_5: felt252 = 'profile_hash_animal_5';

    // Register all animals as operator
    cheat_caller_address(
        protocol.animal_registry.contract_address, operator(), CheatSpan::TargetCalls(5),
    );
    protocol.animal_registry.register_animal(animal_1, issuer(), profile_hash_1);
    protocol.animal_registry.register_animal(animal_2, issuer(), profile_hash_2);
    protocol.animal_registry.register_animal(animal_3, issuer(), profile_hash_3);
    protocol.animal_registry.register_animal(animal_4, issuer(), profile_hash_4);
    protocol.animal_registry.register_animal(animal_5, issuer(), profile_hash_5);

    // Verify animals registered
    assert(protocol.animal_registry.animal_exists(animal_1), 'Animal 1 should exist');
    assert(protocol.animal_registry.animal_exists(animal_5), 'Animal 5 should exist');

    let animal_data = protocol.animal_registry.get_animal(animal_1);
    assert(animal_data.custodian == issuer(), 'Wrong custodian');
    assert(animal_data.status == AnimalStatus::ALIVE, 'Should be ALIVE');
    assert(animal_data.current_lot_id == 0, 'Should not be in lot yet');

    // ========================================================================
    // STEP 3: Assign animals to lot
    // ========================================================================
    cheat_caller_address(
        protocol.animal_registry.contract_address, operator(), CheatSpan::TargetCalls(5),
    );
    protocol.animal_registry.assign_to_lot(animal_1, lot_id);
    protocol.animal_registry.assign_to_lot(animal_2, lot_id);
    protocol.animal_registry.assign_to_lot(animal_3, lot_id);
    protocol.animal_registry.assign_to_lot(animal_4, lot_id);
    protocol.animal_registry.assign_to_lot(animal_5, lot_id);

    // Verify animals assigned
    let animal_data = protocol.animal_registry.get_animal(animal_1);
    assert(animal_data.current_lot_id == lot_id, 'Should be in lot 1');

    let animal_count = protocol.animal_registry.get_lot_animal_count(lot_id);
    assert(animal_count == 5, 'Should have 5 animals');

    // ========================================================================
    // STEP 4: Mint shares after fiat payments
    // ========================================================================
    // Simulate 3 investors buying shares after fiat payments confirmed off-chain
    // Investor 1: 400 shares ($30,800)
    // Investor 2: 350 shares ($26,950)
    // Investor 3: 250 shares ($19,250)
    // Total: 1000 shares (100% funded)

    let shares_investor_1: u256 = 400 * 1_000_000_000_000_000_000; // 400 shares with 18 decimals
    let shares_investor_2: u256 = 350 * 1_000_000_000_000_000_000; // 350 shares
    let shares_investor_3: u256 = 250 * 1_000_000_000_000_000_000; // 250 shares

    cheat_caller_address(shares_token_address, operator(), CheatSpan::TargetCalls(3));
    shares_token.mint(investor_1(), shares_investor_1);
    shares_token.mint(investor_2(), shares_investor_2);
    shares_token.mint(investor_3(), shares_investor_3);

    // Verify balances
    assert(shares_token.balance_of(investor_1()) == shares_investor_1, 'Wrong balance inv1');
    assert(shares_token.balance_of(investor_2()) == shares_investor_2, 'Wrong balance inv2');
    assert(shares_token.balance_of(investor_3()) == shares_investor_3, 'Wrong balance inv3');

    // Verify total supply
    let expected_total: u256 = 1000 * 1_000_000_000_000_000_000; // 1000 shares
    assert(shares_token.total_supply() == expected_total, 'Wrong total supply');

    // Verify lot is now FUNDED (auto-transition when 100% minted)
    assert(shares_token.is_fully_funded(), 'Should be fully funded');
    let lot = protocol.lot_factory.get_lot(lot_id);
    assert(lot.status == LotStatus::FUNDED, 'Should be FUNDED');

    // ========================================================================
    // STEP 5: Anchor trace roots per animal
    // ========================================================================
    // Attestor anchors traceability Merkle roots for each animal
    let root_1: felt252 = 'merkle_root_animal_1';
    let root_2: felt252 = 'merkle_root_animal_2';
    let root_3: felt252 = 'merkle_root_animal_3';
    let root_4: felt252 = 'merkle_root_animal_4';
    let root_5: felt252 = 'merkle_root_animal_5';

    let event_count: u32 = 15; // Each animal has 15 trace events

    cheat_caller_address(
        protocol.traceability_oracle.contract_address, attestor(), CheatSpan::TargetCalls(5),
    );
    protocol.traceability_oracle.anchor_trace(animal_1, root_1, event_count);
    protocol.traceability_oracle.anchor_trace(animal_2, root_2, event_count);
    protocol.traceability_oracle.anchor_trace(animal_3, root_3, event_count);
    protocol.traceability_oracle.anchor_trace(animal_4, root_4, event_count);
    protocol.traceability_oracle.anchor_trace(animal_5, root_5, event_count);

    // Verify roots anchored
    assert(
        protocol.traceability_oracle.get_last_root(animal_1) == root_1, 'Wrong root for animal 1',
    );
    assert(
        protocol.traceability_oracle.get_last_root(animal_5) == root_5, 'Wrong root for animal 5',
    );

    let anchor = protocol.traceability_oracle.get_trace_anchor(animal_1);
    assert(anchor.root == root_1, 'Wrong anchor root');
    assert(anchor.event_count == event_count, 'Wrong event count');

    // ========================================================================
    // STEP 6: Transfer shares (while FUNDED/Active)
    // ========================================================================
    // Investor 1 transfers 100 shares to Investor 2
    let transfer_amount: u256 = 100 * 1_000_000_000_000_000_000; // 100 shares

    cheat_caller_address(shares_token_address, investor_1(), CheatSpan::TargetCalls(1));
    let success = shares_token.transfer(investor_2(), transfer_amount);
    assert(success, 'Transfer should succeed');

    // Verify new balances
    let expected_inv1: u256 = 300 * 1_000_000_000_000_000_000; // 400 - 100 = 300
    let expected_inv2: u256 = 450 * 1_000_000_000_000_000_000; // 350 + 100 = 450

    assert(shares_token.balance_of(investor_1()) == expected_inv1, 'Wrong balance after xfer');
    assert(shares_token.balance_of(investor_2()) == expected_inv2, 'Wrong balance after xfer');

    // Verify transfers are still allowed (not frozen yet)
    assert(!shares_token.is_frozen(), 'Should not be frozen yet');

    // ========================================================================
    // STEP 7: Settle lot
    // ========================================================================
    // Time to settle: animals sold, final accounting done
    let final_report_hash: felt252 = 'ipfs_final_settlement_report';
    let total_proceeds: u256 = 95_000_000_000; // $95,000 gross proceeds (in cents)

    cheat_caller_address(
        protocol.settlement_registry.contract_address, operator(), CheatSpan::TargetCalls(1),
    );
    protocol.settlement_registry.settle_lot(lot_id, final_report_hash, total_proceeds);

    // Verify settlement recorded
    assert(protocol.settlement_registry.is_settled(lot_id), 'Should be settled');

    let settlement = protocol.settlement_registry.get_settlement(lot_id);
    assert(settlement.final_report_hash == final_report_hash, 'Wrong report hash');
    assert(settlement.total_proceeds == total_proceeds, 'Wrong proceeds');
    assert(settlement.settled_by == operator(), 'Wrong settler');

    // Verify lot status changed to SETTLED
    let lot = protocol.lot_factory.get_lot(lot_id);
    assert(lot.status == LotStatus::SETTLED, 'Should be SETTLED');

    // Verify shares token is frozen
    assert(shares_token.is_frozen(), 'Token should be frozen');

    // ========================================================================
    // STEP 8: Verify transfers fail after settlement
    // ========================================================================
    // This would panic, so we can't test it directly in this test
    // In a real test suite, we'd use #[should_panic] attribute
    // For now, we just verify the frozen state above

    // ========================================================================
    // STEP 9: Export balances for fiat payout
    // ========================================================================
    // Read final cap-table (balances frozen at settlement)
    let final_balance_inv1 = shares_token.balance_of(investor_1());
    let final_balance_inv2 = shares_token.balance_of(investor_2());
    let final_balance_inv3 = shares_token.balance_of(investor_3());

    // Verify balances sum to total supply
    let total = final_balance_inv1 + final_balance_inv2 + final_balance_inv3;
    assert(total == shares_token.total_supply(), 'Balances should sum to total');

    // Calculate payout per share: $95,000 / 1,000 shares = $95/share
    // Investor 1: 300 shares × $95 = $28,500
    // Investor 2: 450 shares × $95 = $42,750
    // Investor 3: 250 shares × $95 = $23,750
    // Total: $95,000

    // These balances would be exported off-chain for fiat payout processing
    assert(final_balance_inv1 == expected_inv1, 'Final balance 1 mismatch');
    assert(final_balance_inv2 == expected_inv2, 'Final balance 2 mismatch');
    // ========================================================================
// TEST COMPLETE
// ========================================================================
// All MVP acceptance criteria verified:
// ✓ 1. Create lot
// ✓ 2. Register animals
// ✓ 3. Assign animals to lot
// ✓ 4. Mint shares after fiat payments
// ✓ 5. Anchor trace roots per animal
// ✓ 6. Transfer shares (Active)
// ✓ 7. Settle lot
// ✓ 8. Transfers frozen after settlement
// ✓ 9. Export balances for fiat payout
}

// ----------------------------------------------------------------------------
// Additional Integration Test: Transfer After Settlement Should Fail
// ----------------------------------------------------------------------------
#[test]
#[should_panic(expected: 'Lot not transferable')]
fn test_transfer_fails_after_settlement() {
    start_cheat_block_timestamp_global(1735689600);
    let protocol = deploy_protocol();

    // Quick setup: create lot, mint shares, settle
    cheat_caller_address(
        protocol.lot_factory.contract_address, operator(), CheatSpan::TargetCalls(1),
    );
    let lot_id = protocol
        .lot_factory
        .create_lot(
            issuer(),
            1000 * 1_000_000_000_000_000_000, // 1000 shares with 18 decimals
            77_000_000,
            'metadata',
            "Test Lot",
            "TST",
        );

    let shares_token_address = protocol.lot_factory.get_shares_token(lot_id);
    let shares_token = ILotSharesTokenDispatcher { contract_address: shares_token_address };

    // Configure settlement registry
    cheat_caller_address(shares_token_address, operator(), CheatSpan::TargetCalls(1));
    shares_token.set_settlement_registry(protocol.settlement_registry.contract_address);

    // Mint shares
    let shares_amount: u256 = 1000 * 1_000_000_000_000_000_000;
    cheat_caller_address(shares_token_address, operator(), CheatSpan::TargetCalls(1));
    shares_token.mint(investor_1(), shares_amount);

    // Settle lot
    cheat_caller_address(
        protocol.settlement_registry.contract_address, operator(), CheatSpan::TargetCalls(1),
    );
    protocol.settlement_registry.settle_lot(lot_id, 'report', 95_000_000_000);

    // Try to transfer (should panic with "Lot not transferable")
    cheat_caller_address(shares_token_address, investor_1(), CheatSpan::TargetCalls(1));
    shares_token.transfer(investor_2(), 100);
}

// ----------------------------------------------------------------------------
// Additional Integration Test: Verify Trace Corrections
// ----------------------------------------------------------------------------
#[test]
fn test_trace_correction_flow() {
    start_cheat_block_timestamp_global(1735689600);
    let protocol = deploy_protocol();

    // Register an animal
    let animal_id = create_animal_id(100);
    cheat_caller_address(
        protocol.animal_registry.contract_address, operator(), CheatSpan::TargetCalls(1),
    );
    protocol.animal_registry.register_animal(animal_id, issuer(), 'profile');

    // Anchor initial root
    let initial_root: felt252 = 'initial_merkle_root';
    cheat_caller_address(
        protocol.traceability_oracle.contract_address, attestor(), CheatSpan::TargetCalls(1),
    );
    protocol.traceability_oracle.anchor_trace(animal_id, initial_root, 10);

    assert(
        protocol.traceability_oracle.get_last_root(animal_id) == initial_root, 'Wrong initial root',
    );
    assert(
        protocol.traceability_oracle.get_correction_count(animal_id) == 0,
        'Should have 0 corrections',
    );

    // Submit a correction (e.g., new events added, tree rebuilt)
    let corrected_root: felt252 = 'corrected_merkle_root';
    let reason: felt252 = 'Added missing vet records';
    cheat_caller_address(
        protocol.traceability_oracle.contract_address, attestor(), CheatSpan::TargetCalls(1),
    );
    protocol.traceability_oracle.correct_trace(animal_id, corrected_root, 15, reason);

    // Verify correction applied
    assert(
        protocol.traceability_oracle.get_last_root(animal_id) == corrected_root, 'Root not updated',
    );
    assert(
        protocol.traceability_oracle.get_correction_count(animal_id) == 1,
        'Should have 1 correction',
    );

    let anchor = protocol.traceability_oracle.get_trace_anchor(animal_id);
    assert(anchor.root == corrected_root, 'Wrong corrected root');
    assert(anchor.event_count == 15, 'Wrong event count');
}
