import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { TraceabilityOracleService } from "./traceability-oracle.service";
import {
  AnchorTraceBatchDto,
  AnchorTraceDto,
  CorrectTraceDto,
} from "./dto/traceability-oracle.dto";
import { toBigInt } from "../../../utils/bigint";

@Controller("contracts/traceability-oracle")
export class TraceabilityOracleController {
  constructor(
    private readonly traceabilityOracleService: TraceabilityOracleService
  ) {}

  @Post("anchor")
  async anchorTrace(@Body() body: AnchorTraceDto) {
    return this.traceabilityOracleService.anchorTrace({
      animalId: toBigInt(body.animalId),
      root: body.root,
      eventCount: body.eventCount,
    });
  }

  @Post("anchor-batch")
  async anchorTraceBatch(@Body() body: AnchorTraceBatchDto) {
    return this.traceabilityOracleService.anchorTraceBatch({
      animalIds: body.animalIds.map(toBigInt),
      roots: body.roots,
      eventCounts: body.eventCounts,
    });
  }

  @Post("correct")
  async correctTrace(@Body() body: CorrectTraceDto) {
    return this.traceabilityOracleService.correctTrace({
      animalId: toBigInt(body.animalId),
      newRoot: body.newRoot,
      newEventCount: body.newEventCount,
      correctionReason: body.correctionReason,
    });
  }

  @Get("animals/:animalId/trace-anchor")
  async getTraceAnchor(@Param("animalId") animalId: string) {
    return this.traceabilityOracleService.getTraceAnchor(toBigInt(animalId));
  }

  @Get("animals/:animalId/last-root")
  async getLastRoot(@Param("animalId") animalId: string) {
    return this.traceabilityOracleService.getLastRoot(toBigInt(animalId));
  }

  @Get("animals/:animalId/last-timestamp")
  async getLastTimestamp(@Param("animalId") animalId: string) {
    return this.traceabilityOracleService.getLastTimestamp(toBigInt(animalId));
  }

  @Get("animals/:animalId/correction-count")
  async getCorrectionCount(@Param("animalId") animalId: string) {
    return this.traceabilityOracleService.getCorrectionCount(
      toBigInt(animalId)
    );
  }

  @Get("attestor")
  async getAttestor() {
    return this.traceabilityOracleService.getAttestor();
  }
}
