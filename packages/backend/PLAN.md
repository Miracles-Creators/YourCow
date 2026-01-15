# Backend Stabilization Plan (Producer -> Admin Approval -> On-chain Deploy)

## Goal
Ship a stable backend flow for: producer requests lot creation via web, admin approves, and lot deploys on-chain.

## Scope
- Core DB models and CRUD for Producer/Lot.
- Approval step with on-chain deploy and DB updates.
- Minimal validation and error handling.
- Testing architecture proposal and initial scaffolding.

## Plan
1. Baseline review
   - Validate current endpoints, DTOs, and status transitions.
   - Identify missing validations or status guards.
2. Flow hardening
   - Ensure approval step drives on-chain deploy and updates DB.
   - Define response shapes and error cases.
   - Add idempotency or duplicate-request protections if needed.
3. Operational stability
   - Make on-chain dependencies configurable (RPC URL, keys).
   - Add logging for on-chain actions and failures.
4. Testing architecture (NestJS)
   - Define testing layers: unit, integration, e2e.
   - Decide on tooling and setup.
   - Add minimal tests for the approval + deploy flow.
5. Commit preparation
   - Final review and cleanup.
   - Provide a clean summary and test instructions.

## Deliverables
- Updated backend flow with approval + on-chain deploy.
- Config-driven Starknet integration.
- Testing setup and example tests.
