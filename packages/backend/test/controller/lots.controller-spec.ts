import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

import { LotsService } from "../../src/modules/core/lots/lots.service";
import { LotsController } from "../../src/modules/core/lots/lots.controller";
import { PrismaService } from "../../src/database/prisma.service";
import { LotFactoryService } from "../../src/modules/onchain/lot-factory/lot-factory.service";
import {
  createPrismaMock,
  PrismaMock,
} from "../mocks/prisma.mock";
import { createLotFactoryServiceMock } from "../mocks/onchain.mock";

describe("Lots Integration Tests", () => {
  let app: INestApplication;
  let prismaMock: PrismaMock;
  let lotFactoryMock: ReturnType<typeof createLotFactoryServiceMock>;
  let producerId: string;

  beforeAll(async () => {
    prismaMock = createPrismaMock();
    lotFactoryMock = createLotFactoryServiceMock();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [LotsController],
      providers: [
        LotsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: LotFactoryService, useValue: lotFactoryMock },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(async () => {
    // Create a producer for each test
    const producer = await prismaMock.producer.create({
      data: {
        name: "Test Producer",
        senasaId: "RENSPA-" + Date.now(),
        email: `test-${Date.now()}@example.com`,
        walletAddress: "0x123456789",
        status: "ACTIVE",
      },
    });
    producerId = (producer as { id: string }).id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /lots", () => {
    it("should create a new lot in DRAFT status", async () => {
      const createLotDto = {
        producerId,
        name: "Test Lot",
        description: "A test lot for integration testing",
        totalShares: 1000,
        pricePerShare: 100.5,
        metadata: { location: "Buenos Aires" },
      };

      const response = await request(app.getHttpServer())
        .post("/lots")
        .send(createLotDto)
        .expect(201);

      expect(response.body).toMatchObject({
        name: "Test Lot",
        description: "A test lot for integration testing",
        totalShares: 1000,
      });
      expect(response.body.id).toBeDefined();
    });
  });

  describe("GET /lots", () => {
    it("should return all lots", async () => {
      // Create a lot first
      await prismaMock.lot.create({
        data: {
          producerId,
          name: "Existing Lot",
          description: "An existing lot",
          totalShares: 500,
          pricePerShare: 50,
          status: "DRAFT",
        },
      });

      const response = await request(app.getHttpServer())
        .get("/lots")
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe("GET /lots/:id", () => {
    it("should return a specific lot by ID", async () => {
      const lot = await prismaMock.lot.create({
        data: {
          producerId,
          name: "Specific Lot",
          description: "A specific lot",
          totalShares: 750,
          pricePerShare: 75,
          status: "DRAFT",
        },
      });
      const lotId = (lot as { id: string }).id;

      const response = await request(app.getHttpServer())
        .get(`/lots/${lotId}`)
        .expect(200);

      expect(response.body.name).toBe("Specific Lot");
      expect(response.body.totalShares).toBe(750);
    });

    it("should return 404 for non-existent lot", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";

      await request(app.getHttpServer()).get(`/lots/${fakeId}`).expect(404);
    });
  });

  describe("Lot Lifecycle - DRAFT to FUNDING", () => {
    it("should deploy a lot and update its status to FUNDING", async () => {
      // First create a lot
      const lot = await prismaMock.lot.create({
        data: {
          producerId,
          name: "Deployable Lot",
          description: "A lot ready for deployment",
          totalShares: 1000,
          pricePerShare: 100,
          status: "DRAFT",
        },
      });
      const lotId = (lot as { id: string }).id;

      // Deploy the lot
      const deployDto = {
        onChainLotId: "1",
        tokenAddress: "0xtoken123",
        txHash: "0xtxhash123",
      };

      const response = await request(app.getHttpServer())
        .post(`/lots/${lotId}/deploy`)
        .send(deployDto)
        .expect(201);

      expect(response.body.status).toBe("FUNDING");
      expect(response.body.onChainLotId).toBe("1");
      expect(response.body.tokenAddress).toBe("0xtoken123");
    });
  });
});
