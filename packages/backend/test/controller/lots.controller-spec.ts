import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";

import { LotsService } from "../../src/modules/core/lots/lots.service";
import { LotsController } from "../../src/modules/core/lots/lots.controller";
import { PrismaService } from "../../src/database/prisma.service";
import { AuthService } from "../../src/modules/core/auth/auth.service";
import { LotFactoryService } from "../../src/modules/onchain/lot-factory/lot-factory.service";
import { createPrismaMock, PrismaMock } from "../mocks/prisma.mock";
import { createLotFactoryServiceMock } from "../mocks/onchain.mock";

const SESSIONS: Record<string, { id: number; role: string }> = {
  admin: { id: 1, role: "ADMIN" },
  investor: { id: 2, role: "INVESTOR" },
};

const createLotBody = (producerId: number) => ({
  producerId,
  name: "Test Lot",
  description: "A test lot",
  farmName: "Estancia Test",
  location: "Pergamino, Buenos Aires",
  productionType: "FEEDLOT",
  cattleCount: 80,
  averageWeightKg: 420,
  durationWeeks: 20,
  investorPercent: 15,
});

describe("Lots Integration Tests", () => {
  let app: INestApplication;
  let prismaMock: PrismaMock;
  let producerId: number;

  beforeAll(async () => {
    prismaMock = createPrismaMock();
    const authServiceMock = {
      getUserFromRequest: vi.fn(async (headers: { cookie?: string }) => SESSIONS[headers.cookie ?? ""] ?? null),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [LotsController],
      providers: [
        LotsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: LotFactoryService, useValue: createLotFactoryServiceMock() },
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(async () => {
    const producer = await prismaMock.producerProfile.create({
      data: { status: "ACTIVE", user: { walletAddress: "0x123" } },
    });
    producerId = producer.id;
  });

  afterAll(async () => {
    await app.close();
  });

  const createDraftLot = async (): Promise<number> => {
    const response = await request(app.getHttpServer()).post("/lots").send(createLotBody(producerId)).expect(201);
    return response.body.id;
  };

  it("creates a lot in DRAFT with no shares yet", async () => {
    const response = await request(app.getHttpServer()).post("/lots").send(createLotBody(producerId)).expect(201);

    expect(response.body).toMatchObject({ name: "Test Lot", totalShares: 0, pricePerShare: 0 });
  });

  it("lists lots with their funded percent", async () => {
    await createDraftLot();

    const response = await request(app.getHttpServer()).get("/lots").expect(200);

    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].fundedPercent).toBe(0);
  });

  it("returns a lot by id and 404 for an unknown one", async () => {
    const lotId = await createDraftLot();

    const response = await request(app.getHttpServer()).get(`/lots/${lotId}`).expect(200);
    expect(response.body.name).toBe("Test Lot");

    await request(app.getHttpServer()).get("/lots/9999").expect(404);
  });

  it("moves a lot to FUNDING when deploy data is recorded", async () => {
    const lotId = await createDraftLot();

    const response = await request(app.getHttpServer())
      .post(`/lots/${lotId}/deploy`)
      .send({ onChainLotId: 1, tokenAddress: "0xtoken123", txHash: "0xtxhash123" })
      .expect(201);

    expect(response.body).toMatchObject({ status: "FUNDING", onChainLotId: 1, tokenAddress: "0xtoken123" });
  });

  describe("POST /lots/:id/approve", () => {
    const approveBody = { tokenName: "Test", tokenSymbol: "TST", totalShares: 1000, pricePerShare: 100 };

    it("rejects callers without a session", async () => {
      const lotId = await createDraftLot();
      await request(app.getHttpServer()).post(`/lots/${lotId}/approve`).send(approveBody).expect(401);
    });

    it("rejects non-admin users", async () => {
      const lotId = await createDraftLot();
      await request(app.getHttpServer())
        .post(`/lots/${lotId}/approve`)
        .set("Cookie", "investor")
        .send(approveBody)
        .expect(403);
    });

    it("deploys the lot on-chain for an admin", async () => {
      const lotId = await createDraftLot();

      const response = await request(app.getHttpServer())
        .post(`/lots/${lotId}/approve`)
        .set("Cookie", "admin")
        .send(approveBody)
        .expect(201);

      expect(response.body).toMatchObject({
        status: "FUNDING",
        onChainStatus: "SYNCED",
        tokenAddress: "0xmocktokenaddress",
        totalShares: 1000,
      });
    });
  });
});
