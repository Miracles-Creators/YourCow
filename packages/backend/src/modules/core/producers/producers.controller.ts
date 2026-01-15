import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { CreateProducerDto } from "./dto/create-producer.dto";
import { ProducersService } from "./producers.service";

@Controller("producers")
export class ProducersController {
  constructor(private readonly producersService: ProducersService) {}

  @Get()
  async listProducers() {
    return this.producersService.listProducers();
  }

  @Get(":id")
  async getProducerById(@Param("id") id: string) {
    return this.producersService.getProducerById(id);
  }

  @Post()
  async createProducer(@Body() body: CreateProducerDto) {
    return this.producersService.createProducer(body);
  }
}
