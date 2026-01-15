import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { RegisterAnimalDto } from "./dto/register-animal.dto";
import { AnimalsService } from "./animals.service";

@Controller("animals")
export class AnimalsController {
  constructor(private readonly animalsService: AnimalsService) {}

  @Post()
  async registerAnimal(@Body() body: RegisterAnimalDto) {
    return this.animalsService.registerAnimal(body);
  }

  @Get(":id")
  async getAnimalById(@Param("id") id: string) {
    return this.animalsService.getAnimalById(id);
  }

  @Get("eid/:eid")
  async getAnimalByEid(@Param("eid") eid: string) {
    return this.animalsService.getAnimalByEid(eid);
  }

  @Get("lot/:lotId")
  async listByLot(@Param("lotId") lotId: string) {
    return this.animalsService.listByLot(lotId);
  }
}
