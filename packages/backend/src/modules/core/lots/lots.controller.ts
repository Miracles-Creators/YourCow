import { Body, Controller, Get, Param, Post, Req, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";

import { ApproveLotDto, CreateLotDto, DeployLotDto } from "./dto/lots.dto";
import { LotsService } from "./lots.service";

@Controller("lots")
export class LotsController {
  constructor(private readonly lotsService: LotsService) {}

  @Post()
  async createLot(@Body() body: CreateLotDto) {
    return this.lotsService.createLot(body);
  }

  @Get()
  async listLots() {
    return this.lotsService.listLots();
  }

  @Get("oracle")
  async getActiveLotsForOracle(@Req() req: Request) {
    const apiKey = req.headers["x-api-key"];
    const expected = process.env.ORACLE_API_KEY;
    if (!expected || apiKey !== expected) {
      throw new UnauthorizedException("Invalid or missing API key");
    }
    return this.lotsService.getActiveLotsForOracle();
  }

  @Get(":id")
  async getLotById(@Param("id") id: string) {
    return this.lotsService.getLotById(Number(id));
  }

  @Post(":id/deploy")
  async deployLot(@Param("id") id: string, @Body() body: DeployLotDto) {
    return this.lotsService.deployLot(Number(id), body);
  }

  @Post(":id/approve")
  async approveLot(@Param("id") id: string, @Body() body: ApproveLotDto) {
    return this.lotsService.approveAndDeployLot(Number(id), body);
  }
}
