// ============================================================================
// ANIMAL REGISTRY TESTS
// ============================================================================

use contracts::animal_registry::{IAnimalRegistryDispatcher, IAnimalRegistryDispatcherTrait};
use contracts::constants::AnimalStatus;
use core::array::ArrayTrait;
use snforge_std::{CheatSpan, cheat_caller_address, stop_cheat_caller_address};
use starknet::ContractAddress;
use super::utils::{
    animal_id_1, animal_id_2, create_lot, custodian_1, custodian_2, deploy_animal_registry,
    deploy_lot_factory, operator, other_user, owner,
};

// ----------------------------------------------------------------------------
// Deployment Tests
// ----------------------------------------------------------------------------

#[test]
fn test_deployment() {
    let lot_factory_address = deploy_lot_factory();
    let contract_address = deploy_animal_registry(lot_factory_address);
    let dispatcher = IAnimalRegistryDispatcher { contract_address };

    assert(dispatcher.get_protocol_operator() == operator(), 'Wrong operator');
}

// ----------------------------------------------------------------------------
// Register Animal Tests
// ----------------------------------------------------------------------------

#[test]
fn test_register_animal_success() {
    let lot_factory_address = deploy_lot_factory();
    let contract_address = deploy_animal_registry(lot_factory_address);
    let dispatcher = IAnimalRegistryDispatcher { contract_address };

    let animal_id = animal_id_1();
    let profile_hash: felt252 = 'profile_hash_1';

    cheat_caller_address(contract_address, operator(), CheatSpan::TargetCalls(1));
    dispatcher.register_animal(animal_id, custodian_1(), profile_hash);

    assert(dispatcher.animal_exists(animal_id), 'Animal should exist');

    let animal = dispatcher.get_animal(animal_id);
    assert(animal.custodian == custodian_1(), 'Wrong custodian');
    assert(animal.status == AnimalStatus::ALIVE, 'Should be alive');
    assert(animal.current_lot_id == 0, 'Should not be in lot');
    assert(animal.profile_hash == profile_hash, 'Wrong profile hash');

    assert(dispatcher.owner_of(animal_id) == custodian_1(), 'Wrong owner_of');
    assert(dispatcher.balance_of(custodian_1()) == 1, 'Wrong balance');
}

#[test]
fn test_register_multiple_animals() {
    let lot_factory_address = deploy_lot_factory();
    let contract_address = deploy_animal_registry(lot_factory_address);
    let dispatcher = IAnimalRegistryDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::Indefinite);
    dispatcher.register_animal(animal_id_1(), custodian_1(), 'hash1');
    dispatcher.register_animal(animal_id_2(), custodian_1(), 'hash2');
    stop_cheat_caller_address(contract_address);

    assert(dispatcher.balance_of(custodian_1()) == 2, 'Should have 2 animals');
}

#[test]
fn test_register_animal_batch_success() {
    let lot_factory_address = deploy_lot_factory();
    let contract_address = deploy_animal_registry(lot_factory_address);
    let dispatcher = IAnimalRegistryDispatcher { contract_address };

    let mut animal_ids: Array<u256> = array![];
    animal_ids.append(animal_id_1());
    animal_ids.append(animal_id_2());

    let mut custodians: Array<ContractAddress> = array![];
    custodians.append(custodian_1());
    custodians.append(custodian_1());

    let mut profile_hashes: Array<felt252> = array![];
    profile_hashes.append('hash1');
    profile_hashes.append('hash2');

    cheat_caller_address(contract_address, operator(), CheatSpan::TargetCalls(1));
    dispatcher.register_animal_batch(animal_ids.span(), custodians.span(), profile_hashes.span());

    assert(dispatcher.animal_exists(animal_id_1()), 'Animal 1 should exist');
    assert(dispatcher.animal_exists(animal_id_2()), 'Animal 2 should exist');
    assert(dispatcher.balance_of(custodian_1()) == 2, 'Should have 2 animals');
}

#[test]
#[should_panic(expected: 'Length mismatch')]
fn test_register_animal_batch_length_mismatch() {
    let lot_factory_address = deploy_lot_factory();
    let contract_address = deploy_animal_registry(lot_factory_address);
    let dispatcher = IAnimalRegistryDispatcher { contract_address };

    let mut animal_ids: Array<u256> = array![];
    animal_ids.append(animal_id_1());
    animal_ids.append(animal_id_2());

    let mut custodians: Array<ContractAddress> = array![];
    custodians.append(custodian_1());

    let mut profile_hashes: Array<felt252> = array![];
    profile_hashes.append('hash1');
    profile_hashes.append('hash2');

    cheat_caller_address(contract_address, operator(), CheatSpan::TargetCalls(1));
    dispatcher.register_animal_batch(animal_ids.span(), custodians.span(), profile_hashes.span());
}

#[test]
#[should_panic(expected: 'Caller is not operator')]
fn test_register_animal_not_operator() {
    let lot_factory_address = deploy_lot_factory();
    let contract_address = deploy_animal_registry(lot_factory_address);
    let dispatcher = IAnimalRegistryDispatcher { contract_address };

    cheat_caller_address(contract_address, other_user(), CheatSpan::TargetCalls(1));
    dispatcher.register_animal(animal_id_1(), custodian_1(), 'hash');
}

#[test]
#[should_panic(expected: 'Animal already registered')]
fn test_register_animal_duplicate() {
    let lot_factory_address = deploy_lot_factory();
    let contract_address = deploy_animal_registry(lot_factory_address);
    let dispatcher = IAnimalRegistryDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::Indefinite);
    dispatcher.register_animal(animal_id_1(), custodian_1(), 'hash1');
    dispatcher.register_animal(animal_id_1(), custodian_1(), 'hash2');
}

// ----------------------------------------------------------------------------
// Lot Assignment Tests
// ----------------------------------------------------------------------------

#[test]
fn test_assign_to_lot_success() {
    let lot_factory_address = deploy_lot_factory();
    let lot_id = create_lot(lot_factory_address);
    let contract_address = deploy_animal_registry(lot_factory_address);
    let dispatcher = IAnimalRegistryDispatcher { contract_address };

    let animal_id = animal_id_1();

    cheat_caller_address(contract_address, operator(), CheatSpan::Indefinite);

    // Register animal
    dispatcher.register_animal(animal_id, custodian_1(), 'hash');

    // Assign to lot
    dispatcher.assign_to_lot(animal_id, lot_id);

    stop_cheat_caller_address(contract_address);

    assert(dispatcher.get_current_lot(animal_id) == lot_id, 'Wrong lot assignment');
    assert(dispatcher.get_lot_animal_count(lot_id) == 1, 'Wrong lot count');
}

#[test]
fn test_assign_multiple_animals_to_lot() {
    let lot_factory_address = deploy_lot_factory();
    let lot_id = create_lot(lot_factory_address);
    let contract_address = deploy_animal_registry(lot_factory_address);
    let dispatcher = IAnimalRegistryDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::Indefinite);

    // Register and assign first animal
    dispatcher.register_animal(animal_id_1(), custodian_1(), 'hash1');
    dispatcher.assign_to_lot(animal_id_1(), lot_id);

    // Register and assign second animal
    dispatcher.register_animal(animal_id_2(), custodian_1(), 'hash2');
    dispatcher.assign_to_lot(animal_id_2(), lot_id);

    stop_cheat_caller_address(contract_address);

    assert(dispatcher.get_lot_animal_count(lot_id) == 2, 'Should have 2 animals');
}

#[test]
fn test_assign_to_lot_batch_success() {
    let lot_factory_address = deploy_lot_factory();
    let lot_id = create_lot(lot_factory_address);
    let contract_address = deploy_animal_registry(lot_factory_address);
    let dispatcher = IAnimalRegistryDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::Indefinite);
    dispatcher.register_animal(animal_id_1(), custodian_1(), 'hash1');
    dispatcher.register_animal(animal_id_2(), custodian_1(), 'hash2');

    let mut animal_ids: Array<u256> = array![];
    animal_ids.append(animal_id_1());
    animal_ids.append(animal_id_2());

    dispatcher.assign_to_lot_batch(animal_ids.span(), lot_id);
    stop_cheat_caller_address(contract_address);

    assert(dispatcher.get_current_lot(animal_id_1()) == lot_id, 'Animal 1 lot mismatch');
    assert(dispatcher.get_current_lot(animal_id_2()) == lot_id, 'Animal 2 lot mismatch');
    assert(dispatcher.get_lot_animal_count(lot_id) == 2, 'Wrong lot count');
}

#[test]
#[should_panic(expected: 'Already assigned to lot')]
fn test_assign_already_assigned() {
    let lot_factory_address = deploy_lot_factory();
    let lot_id = create_lot(lot_factory_address);
    let contract_address = deploy_animal_registry(lot_factory_address);
    let dispatcher = IAnimalRegistryDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::Indefinite);

    dispatcher.register_animal(animal_id_1(), custodian_1(), 'hash');
    dispatcher.assign_to_lot(animal_id_1(), lot_id);

    // Try to assign again
    dispatcher.assign_to_lot(animal_id_1(), lot_id + 1);
}

#[test]
#[should_panic(expected: 'Animal must be alive')]
fn test_assign_dead_animal() {
    let lot_factory_address = deploy_lot_factory();
    let lot_id = create_lot(lot_factory_address);
    let contract_address = deploy_animal_registry(lot_factory_address);
    let dispatcher = IAnimalRegistryDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::Indefinite);

    dispatcher.register_animal(animal_id_1(), custodian_1(), 'hash');

    // Mark as deceased
    dispatcher.set_animal_status(animal_id_1(), AnimalStatus::DECEASED);

    // Try to assign - should fail
    dispatcher.assign_to_lot(animal_id_1(), lot_id);
}

// ----------------------------------------------------------------------------
// Remove from Lot Tests
// ----------------------------------------------------------------------------

#[test]
fn test_remove_from_lot_success() {
    let lot_factory_address = deploy_lot_factory();
    let lot_id = create_lot(lot_factory_address);
    let contract_address = deploy_animal_registry(lot_factory_address);
    let dispatcher = IAnimalRegistryDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::Indefinite);

    dispatcher.register_animal(animal_id_1(), custodian_1(), 'hash');
    dispatcher.assign_to_lot(animal_id_1(), lot_id);

    // Remove from lot
    dispatcher.remove_from_lot(animal_id_1());

    stop_cheat_caller_address(contract_address);

    assert(dispatcher.get_current_lot(animal_id_1()) == 0, 'Should not be in lot');
    assert(dispatcher.get_lot_animal_count(lot_id) == 0, 'Lot should be empty');
}

#[test]
fn test_remove_from_lot_batch_success() {
    let lot_factory_address = deploy_lot_factory();
    let lot_id = create_lot(lot_factory_address);
    let contract_address = deploy_animal_registry(lot_factory_address);
    let dispatcher = IAnimalRegistryDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::Indefinite);
    dispatcher.register_animal(animal_id_1(), custodian_1(), 'hash1');
    dispatcher.register_animal(animal_id_2(), custodian_1(), 'hash2');
    dispatcher.assign_to_lot(animal_id_1(), lot_id);
    dispatcher.assign_to_lot(animal_id_2(), lot_id);

    let mut animal_ids: Array<u256> = array![];
    animal_ids.append(animal_id_1());
    animal_ids.append(animal_id_2());

    dispatcher.remove_from_lot_batch(animal_ids.span());
    stop_cheat_caller_address(contract_address);

    assert(dispatcher.get_current_lot(animal_id_1()) == 0, 'Animal 1 still in lot');
    assert(dispatcher.get_current_lot(animal_id_2()) == 0, 'Animal 2 still in lot');
    assert(dispatcher.get_lot_animal_count(lot_id) == 0, 'Lot should be empty');
}

#[test]
#[should_panic(expected: 'Not assigned to any lot')]
fn test_remove_not_in_lot() {
    let lot_factory_address = deploy_lot_factory();
    let contract_address = deploy_animal_registry(lot_factory_address);
    let dispatcher = IAnimalRegistryDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::Indefinite);

    dispatcher.register_animal(animal_id_1(), custodian_1(), 'hash');
    dispatcher.remove_from_lot(animal_id_1());
}

// ----------------------------------------------------------------------------
// Status Change Tests
// ----------------------------------------------------------------------------

#[test]
fn test_set_animal_status() {
    let lot_factory_address = deploy_lot_factory();
    let contract_address = deploy_animal_registry(lot_factory_address);
    let dispatcher = IAnimalRegistryDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::Indefinite);

    dispatcher.register_animal(animal_id_1(), custodian_1(), 'hash');
    dispatcher.set_animal_status(animal_id_1(), AnimalStatus::SOLD);

    stop_cheat_caller_address(contract_address);

    assert(dispatcher.get_animal_status(animal_id_1()) == AnimalStatus::SOLD, 'Wrong status');
}

#[test]
fn test_set_animal_status_batch_success() {
    let lot_factory_address = deploy_lot_factory();
    let contract_address = deploy_animal_registry(lot_factory_address);
    let dispatcher = IAnimalRegistryDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::Indefinite);
    dispatcher.register_animal(animal_id_1(), custodian_1(), 'hash1');
    dispatcher.register_animal(animal_id_2(), custodian_1(), 'hash2');

    let mut animal_ids: Array<u256> = array![];
    animal_ids.append(animal_id_1());
    animal_ids.append(animal_id_2());

    dispatcher.set_animal_status_batch(animal_ids.span(), AnimalStatus::SOLD);
    stop_cheat_caller_address(contract_address);

    assert(dispatcher.get_animal_status(animal_id_1()) == AnimalStatus::SOLD, 'Wrong status 1');
    assert(dispatcher.get_animal_status(animal_id_2()) == AnimalStatus::SOLD, 'Wrong status 2');
}

#[test]
#[should_panic(expected: 'Invalid status')]
fn test_set_invalid_status() {
    let lot_factory_address = deploy_lot_factory();
    let contract_address = deploy_animal_registry(lot_factory_address);
    let dispatcher = IAnimalRegistryDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::Indefinite);

    dispatcher.register_animal(animal_id_1(), custodian_1(), 'hash');
    dispatcher.set_animal_status(animal_id_1(), 99); // Invalid status
}

// ----------------------------------------------------------------------------
// Custody Transfer Tests
// ----------------------------------------------------------------------------

#[test]
fn test_transfer_custody_success() {
    let lot_factory_address = deploy_lot_factory();
    let contract_address = deploy_animal_registry(lot_factory_address);
    let dispatcher = IAnimalRegistryDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::Indefinite);

    dispatcher.register_animal(animal_id_1(), custodian_1(), 'hash');
    dispatcher.transfer_custody(animal_id_1(), custodian_2());

    stop_cheat_caller_address(contract_address);

    assert(dispatcher.get_custodian(animal_id_1()) == custodian_2(), 'Wrong new custodian');
    assert(dispatcher.owner_of(animal_id_1()) == custodian_2(), 'Wrong owner_of');
    assert(dispatcher.balance_of(custodian_1()) == 0, 'Old custodian balance wrong');
    assert(dispatcher.balance_of(custodian_2()) == 1, 'New custodian balance wrong');
}

#[test]
#[should_panic(expected: 'Same custodian')]
fn test_transfer_custody_same() {
    let lot_factory_address = deploy_lot_factory();
    let contract_address = deploy_animal_registry(lot_factory_address);
    let dispatcher = IAnimalRegistryDispatcher { contract_address };

    cheat_caller_address(contract_address, operator(), CheatSpan::Indefinite);

    dispatcher.register_animal(animal_id_1(), custodian_1(), 'hash');
    dispatcher.transfer_custody(animal_id_1(), custodian_1());
}

// ----------------------------------------------------------------------------
// Admin Tests
// ----------------------------------------------------------------------------

#[test]
fn test_set_protocol_operator() {
    let lot_factory_address = deploy_lot_factory();
    let contract_address = deploy_animal_registry(lot_factory_address);
    let dispatcher = IAnimalRegistryDispatcher { contract_address };

    cheat_caller_address(contract_address, owner(), CheatSpan::TargetCalls(1));
    dispatcher.set_protocol_operator(other_user());

    assert(dispatcher.get_protocol_operator() == other_user(), 'Operator not updated');
}
