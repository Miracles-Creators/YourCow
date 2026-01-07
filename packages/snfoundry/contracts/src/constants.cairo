// ============================================================================
// BEEFCHAIN PROTOCOL - FUNDAMENTAL CONSTANTS
// ============================================================================
// These constants LOCK the architecture. Define once, never change.
// All contracts depend on these formats.
// ============================================================================

// ----------------------------------------------------------------------------
// 1. ANIMAL_ID FORMAT (not used for now)
// ----------------------------------------------------------------------------
// Format: u256 (256-bit unsigned integer)
//
// Structure: Composite ID encoding origin + unique identifier
//
// Layout (256 bits):
//   [255-224] 32 bits  - Country code (ISO 3166-1 numeric, e.g., 032 = Argentina)
//   [223-192] 32 bits  - Province/State code
//   [191-128] 64 bits  - Producer/Feedlot ID (SENASA RENSPA or equivalent)
//   [127-64]  64 bits  - Animal sequential number within producer
//   [63-0]    64 bits  - Timestamp of registration (Unix epoch seconds)
//
// Example: AR-BA-RENSPA123456-00001-1704067200
// Encoded as single u256 for efficient on-chain storage and indexing
//
// Why u256?
// - Native ERC721 token_id type
// - Sufficient bits to encode all metadata
// - Single storage slot in Cairo
// - Compatible with Starknet's felt252 range
// ----------------------------------------------------------------------------
pub const ANIMAL_ID_COUNTRY_BITS: u8 = 32;
pub const ANIMAL_ID_PROVINCE_BITS: u8 = 32;
pub const ANIMAL_ID_PRODUCER_BITS: u8 = 64;
pub const ANIMAL_ID_SEQUENCE_BITS: u8 = 64;
pub const ANIMAL_ID_TIMESTAMP_BITS: u8 = 64;

// Country codes (ISO 3166-1 numeric)
pub const COUNTRY_ARGENTINA: u32 = 32;
pub const COUNTRY_BRAZIL: u32 = 76;
pub const COUNTRY_URUGUAY: u32 = 858;
pub const COUNTRY_PARAGUAY: u32 = 600;

// ----------------------------------------------------------------------------
// 2. PROFILE_HASH FORMAT
// ----------------------------------------------------------------------------
// Format: felt252 (Poseidon hash)
//
// The profile_hash is a Poseidon hash of the animal's off-chain profile data.
// Poseidon is native to Starknet and cheaper than Keccak/SHA256.
//
// Off-chain profile JSON structure (hashed):
// {
//   "breed": "Angus",
//   "birth_date": "2023-01-15",
//   "sex": "M",
//   "mother_id": "...",
//   "father_id": "...",
//   "birth_weight_kg": 35,
//   "sanitary_records": [...],
//   "genetic_markers": {...}
// }
//
// Hash computation:
//   profile_hash = poseidon_hash(serialize(profile_json))
//
// Verification:
//   - Off-chain service stores full profile
//   - Client can verify: hash(profile) == on-chain profile_hash
// ----------------------------------------------------------------------------
// No constants needed - felt252 is the native type

// ----------------------------------------------------------------------------
// 3. TRACE_ROOT FORMAT
// ----------------------------------------------------------------------------
// Format: felt252 (Poseidon Merkle root)
//
// Per-animal Merkle tree of all traceability events.
// Each leaf is a trace event hash.
//
// Trace event types:
//   - WEIGHING: { timestamp, weight_kg, certifier }
//   - VACCINATION: { timestamp, vaccine_id, vet_id, batch }
//   - MOVEMENT: { timestamp, from_location, to_location, transport_id }
//   - HEALTH_CHECK: { timestamp, vet_id, observations, status }
//   - FEEDING: { timestamp, feed_type, quantity_kg }
//   - TREATMENT: { timestamp, treatment_id, vet_id, reason }
//
// Merkle tree structure:
//   - Leaves: poseidon_hash(event_type || event_data || timestamp || certifier)
//   - Internal nodes: poseidon_hash(left_child || right_child)
//   - Root: single felt252 stored on-chain
//
// Proof verification:
//   - Verifier receives: leaf, siblings[], path_bits
//   - Computes root from leaf up
//   - Compares with on-chain root
// ----------------------------------------------------------------------------
// Trace event type identifiers
pub const TRACE_EVENT_WEIGHING: felt252 = 'WEIGHING';
pub const TRACE_EVENT_VACCINATION: felt252 = 'VACCINATION';
pub const TRACE_EVENT_MOVEMENT: felt252 = 'MOVEMENT';
pub const TRACE_EVENT_HEALTH_CHECK: felt252 = 'HEALTH_CHECK';
pub const TRACE_EVENT_FEEDING: felt252 = 'FEEDING';
pub const TRACE_EVENT_TREATMENT: felt252 = 'TREATMENT';

// Maximum Merkle tree depth (2^16 = 65536 events per animal max)
pub const MAX_TRACE_TREE_DEPTH: u8 = 16;

// ----------------------------------------------------------------------------
// 4. ATTESTOR TRUST MODEL
// ----------------------------------------------------------------------------
// Model: SINGLE ATTESTOR (MVP)
//
// For MVP, we use a single trusted attestor (protocol-controlled oracle service).
// This simplifies implementation while maintaining security guarantees.
//
// Trust assumptions:
//   - Attestor is operated by the protocol
//   - Attestor validates off-chain data before anchoring
//   - Attestor cannot fabricate events (data comes from certified sources)
//   - Attestor can be rotated by protocol admin
//
// Future evolution (post-MVP):
//   - Multi-attestor with threshold signatures (2-of-3, 3-of-5)
//   - Attestor staking and slashing
//   - Decentralized attestor network
//
// Current implementation:
//   - Single `attestor` address stored in TraceabilityOracle
//   - Only attestor can call `anchor_trace` and `correct_trace`
//   - Protocol admin can change attestor address
// ----------------------------------------------------------------------------
// Attestor model type (for future extensibility)
pub const ATTESTOR_MODEL_SINGLE: felt252 = 'SINGLE';
pub const ATTESTOR_MODEL_MULTI: felt252 = 'MULTI';
pub const ATTESTOR_MODEL_THRESHOLD: felt252 = 'THRESHOLD';

// Current model
pub const CURRENT_ATTESTOR_MODEL: felt252 = 'SINGLE';

// ----------------------------------------------------------------------------
// LOT STATUS
// ----------------------------------------------------------------------------
// State transitions:
//   ACTIVE → FUNDED (automatic when 100% shares minted)
//   ACTIVE → PAUSED (manual, emergency)
//   FUNDED → PAUSED (manual, emergency)
//   FUNDED → SETTLED (manual, at liquidation)
//   PAUSED → ACTIVE (manual, resume)
//   PAUSED → FUNDED (manual, resume if was funded)
//   PAUSED → SETTLED (manual, at liquidation)
//   SETTLED → (terminal state, no transitions)
pub mod LotStatus {
    pub const ACTIVE: u8 = 1; // Minting and transfers allowed
    pub const PAUSED: u8 = 2; // Emergency stop
    pub const SETTLED: u8 = 3; // Terminal: transfers frozen, payout ready
    pub const FUNDED: u8 = 4; // 100% shares minted, transfers allowed, no more minting
}

// ----------------------------------------------------------------------------
// ANIMAL STATUS
// ----------------------------------------------------------------------------
pub mod AnimalStatus {
    pub const ALIVE: u8 = 1;
    pub const SOLD: u8 = 2;
    pub const DECEASED: u8 = 3;
    pub const REMOVED: u8 = 4;
}

// ----------------------------------------------------------------------------
// ROLE IDENTIFIERS (for access control)
// ----------------------------------------------------------------------------
pub const ROLE_PROTOCOL_ADMIN: felt252 = 'PROTOCOL_ADMIN';
pub const ROLE_PROTOCOL_OPERATOR: felt252 = 'PROTOCOL_OPERATOR';
pub const ROLE_ATTESTOR: felt252 = 'ATTESTOR';

// ----------------------------------------------------------------------------
// WEIGHT TRACKING CONSTANTS
// ----------------------------------------------------------------------------
// Weight units: All weights are stored in GRAMS for precision without decimals
// Example: 250kg = 250,000 grams

// Minimum animal weight: 50kg (50,000 grams) - minimum for a small calf
pub const MIN_ANIMAL_WEIGHT_GRAMS: u64 = 50000;

// Maximum animal weight: 550kg (550,000 grams) - maximum for a large bull
pub const MAX_ANIMAL_WEIGHT_GRAMS: u64 = 650000;

// Weight tolerance in basis points (1% = 100 basis points)
// Used for validating weight measurements within acceptable error margin
pub const WEIGHT_TOLERANCE_BASIS_POINTS: u32 = 100;
