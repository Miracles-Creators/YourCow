import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";

import { AuthGuard } from "../auth/auth.guard";
import { ApproveProducerDto } from "./dto/approve-producer.dto";
import { CreateProducerDto } from "./dto/create-producer.dto";
import { ProducersService } from "./producers.service";
import type { AuthenticatedRequest } from "../auth/types";

@Controller("producers")
export class ProducersController {
  constructor(private readonly producersService: ProducersService) {}

  @Get()
  async listProducers() {
    return this.producersService.listProducers();
  }

  @UseGuards(AuthGuard)
  @Get("me")
  async getProducerMe(@Req() req: AuthenticatedRequest) {
    if (!req.user) {
      throw new UnauthorizedException("Not authenticated");
    }
    return this.producersService.getProducerById(req.user.id);
  }

  @Get(":id")
  async getProducerById(@Param("id") id: string) {
    return this.producersService.getProducerById(Number(id));
  }

  @Post()
  async createProducer(@Body() body: CreateProducerDto) {
    return this.producersService.createProducer(body);
  }

  @Post(":id/approve")
  async approveProducer(@Param("id") id: string, @Body() body: ApproveProducerDto) {
    return this.producersService.approveProducer(Number(id), body);
  }
}
