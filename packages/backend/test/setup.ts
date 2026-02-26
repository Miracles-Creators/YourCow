import { vi } from "vitest";

// Mock environment variables for tests
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test_db";
process.env.ENVIRONMENT = "devnet";
process.env.PROTOCOL_OPERATOR_PRIVATE_KEY = "0x1234";
process.env.PROTOCOL_OPERATOR_ADDRESS = "0x1234";

// Global test utilities
vi.mock("../src/starknet/core/starknet.service", () => ({
  StarknetService: vi.fn().mockImplementation(() => ({
    onModuleInit: vi.fn(),
    getProvider: vi.fn(),
    getOperatorAccount: vi.fn(),
    getContract: vi.fn(),
    getContractReadOnly: vi.fn(),
    executeTransaction: vi.fn().mockResolvedValue("0xmocktxhash"),
    getNetwork: vi.fn().mockReturnValue("devnet"),
  })),
}));
