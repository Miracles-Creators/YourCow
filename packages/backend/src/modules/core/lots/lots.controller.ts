import { Body, Controller, Get, Param, Post } from "@nestjs/common";

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

  @Get(":id")
  async getLotById(@Param("id") id: string) {
    return this.lotsService.getLotById(id);
  }

  @Post(":id/deploy")
  async deployLot(@Param("id") id: string, @Body() body: DeployLotDto) {
    return this.lotsService.deployLot(id, body);
  }

  @Post(":id/approve")
  async approveLot(@Param("id") id: string, @Body() body: ApproveLotDto) {
    return this.lotsService.approveAndDeployLot(id, body);
  }
}
