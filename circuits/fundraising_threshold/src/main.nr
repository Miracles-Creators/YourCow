fn main(
    // Public inputs (visible on-chain, verifiable by anyone)
    threshold_percent: pub u64,   // fixed at 100 for demo
    lot_id: pub Field,            // ties this proof to a specific lot

    // Private inputs (hidden)
    funded_shares: u64,           // shares sold so far
    total_shares: u64,            // total shares in the lot
) {
    // Guards first - before any arithmetic
    assert(total_shares > 0);
    assert(threshold_percent >= 1);
    assert(threshold_percent <= 100);

    // Prove funded_shares * 100 >= threshold_percent * total_shares
    // u128 prevents overflow: max u64 * 100 = 1.8e21 < u128 max 3.4e38
    let raised_scaled: u128 = (funded_shares as u128) * 100;
    let target_scaled: u128 = (threshold_percent as u128) * (total_shares as u128);
    assert(raised_scaled >= target_scaled);
}
