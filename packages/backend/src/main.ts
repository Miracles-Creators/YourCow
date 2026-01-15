import "reflect-metadata";

import { RequestMethod } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import dotenv from "dotenv";

import { AppModule } from "./app.module";

dotenv.config();

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.setGlobalPrefix("api", {
    exclude: [{ path: "health", method: RequestMethod.GET }],
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  console.log(`Backend server running on port ${port}`);
}

void bootstrap();
