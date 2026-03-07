use starknet::ContractAddress;

// nav_value and nav_per_share use u128 (not i128) because starknet.js v8 cannot
// validate i128 in calldata. Negative NAVs are clamped to 0 in the relay layer.
#[derive(Drop, Serde, starknet::Store)]
pub struct NavDataPoint {
    pub nav_value: u128,
    pub nav_per_share: u128,
    pub weight_grams: u32,
    pub updated_at: u64,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct MarketPrices {
    pub beef_price: u128,
    pub corn_price: u128,
    pub ars_usd_rate: u128,
    pub updated_at: u64,
}

#[starknet::interface]
pub trait INavOracle<TContractState> {
    fn update_market_prices(
        ref self: TContractState, beef_price: u128, corn_price: u128, ars_usd_rate: u128,
    );
    fn update_nav_batch(
        ref self: TContractState,
        lot_ids: Span<u256>,
        nav_values: Span<u128>,
        nav_per_shares: Span<u128>,
        weight_grams: Span<u32>,
    );
    fn set_operator(ref self: TContractState, new_operator: ContractAddress);

    fn get_market_prices(self: @TContractState) -> MarketPrices;
    fn get_nav(self: @TContractState, lot_id: u256) -> NavDataPoint;
    fn get_operator(self: @TContractState) -> ContractAddress;
}

#[starknet::contract]
pub mod NavOracle {
    use core::num::traits::Zero;
    use openzeppelin_access::ownable::OwnableComponent;
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
    use super::{INavOracle, MarketPrices, NavDataPoint};

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        MarketPricesUpdated: MarketPricesUpdated,
        NavBatchUpdated: NavBatchUpdated,
        LotNavUpdated: LotNavUpdated,
        OperatorChanged: OperatorChanged,
    }

    #[derive(Drop, starknet::Event)]
    pub struct MarketPricesUpdated {
        pub beef_price: u128,
        pub corn_price: u128,
        pub ars_usd_rate: u128,
        pub updated_at: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct NavBatchUpdated {
        pub count: u32,
        pub updated_at: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct LotNavUpdated {
        #[key]
        pub lot_id: u256,
        pub nav_value: u128,
        pub nav_per_share: u128,
        pub weight_grams: u32,
        pub updated_at: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct OperatorChanged {
        pub old_operator: ContractAddress,
        pub new_operator: ContractAddress,
        pub changed_by: ContractAddress,
    }

    #[storage]
    struct Storage {
        market_prices: MarketPrices,
        nav_data: Map<u256, NavDataPoint>,
        operator: ContractAddress,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress, operator: ContractAddress) {
        self.ownable.initializer(owner);
        assert(!operator.is_zero(), 'Operator cannot be zero');
        self.operator.write(operator);
    }

    #[abi(embed_v0)]
    impl NavOracleImpl of INavOracle<ContractState> {
        fn update_market_prices(
            ref self: ContractState, beef_price: u128, corn_price: u128, ars_usd_rate: u128,
        ) {
            self.assert_only_operator();

            assert(beef_price > 0, 'Beef price must be > 0');
            assert(corn_price > 0, 'Corn price must be > 0');
            assert(ars_usd_rate > 0, 'ARS/USD rate must be > 0');

            let updated_at = get_block_timestamp();
            self.market_prices.write(MarketPrices { beef_price, corn_price, ars_usd_rate, updated_at });

            self.emit(MarketPricesUpdated { beef_price, corn_price, ars_usd_rate, updated_at });
        }

        fn update_nav_batch(
            ref self: ContractState,
            lot_ids: Span<u256>,
            nav_values: Span<u128>,
            nav_per_shares: Span<u128>,
            weight_grams: Span<u32>,
        ) {
            self.assert_only_operator();

            let count = lot_ids.len();
            assert(count > 0, 'Empty batch');
            assert(count == nav_values.len(), 'Length mismatch');
            assert(count == nav_per_shares.len(), 'Length mismatch');
            assert(count == weight_grams.len(), 'Length mismatch');

            let updated_at = get_block_timestamp();

            let mut i: u32 = 0;
            while i < count {
                let lot_id = *lot_ids.at(i);
                let nav_value = *nav_values.at(i);
                let nav_per_share = *nav_per_shares.at(i);
                let wg = *weight_grams.at(i);

                let data_point = NavDataPoint {
                    nav_value, nav_per_share, weight_grams: wg, updated_at,
                };
                self.nav_data.write(lot_id, data_point);

                self.emit(LotNavUpdated { lot_id, nav_value, nav_per_share, weight_grams: wg, updated_at });

                i += 1;
            };

            self.emit(NavBatchUpdated { count, updated_at });
        }

        fn set_operator(ref self: ContractState, new_operator: ContractAddress) {
            self.ownable.assert_only_owner();
            assert(!new_operator.is_zero(), 'Operator cannot be zero');

            let old_operator = self.operator.read();
            self.operator.write(new_operator);

            self
                .emit(
                    OperatorChanged {
                        old_operator, new_operator, changed_by: get_caller_address(),
                    },
                );
        }

        fn get_market_prices(self: @ContractState) -> MarketPrices {
            self.market_prices.read()
        }

        fn get_nav(self: @ContractState, lot_id: u256) -> NavDataPoint {
            self.nav_data.read(lot_id)
        }

        fn get_operator(self: @ContractState) -> ContractAddress {
            self.operator.read()
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn assert_only_operator(self: @ContractState) {
            let caller = get_caller_address();
            let operator = self.operator.read();
            assert(caller == operator, 'Caller is not operator');
        }
    }
}
