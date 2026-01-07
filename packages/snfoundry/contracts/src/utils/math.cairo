use core::num::traits::Bounded;

#[inline(always)]
pub fn u64_saturating_sub(a: u64, b: u64) -> u64 {
    if a > b {
        a - b
    } else {
        0
    }
}

#[inline(always)]
pub fn u64_saturating_add(a: u64, b: u64) -> u64 {
    let max = Bounded::<u64>::MAX;
    if a > max - b {
        max
    } else {
        a + b
    }
}

#[inline(always)]
pub fn u256_saturating_add(a: u256, b: u256) -> u256 {
    let max = Bounded::<u256>::MAX;
    if a > max - b {
        max
    } else {
        a + b
    }
}

#[inline(always)]
pub fn u256_saturating_mul(a: u256, b: u256) -> u256 {
    let max = Bounded::<u256>::MAX;

    if a == 0 || b == 0 {
        return 0;
    }

    if a > max / b {
        max
    } else {
        a * b
    }
}
