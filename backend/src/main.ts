import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(",") ?? "*",
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`Backend running on :${port} [AUTH_MODE=${process.env.AUTH_MODE ?? "local"}]`, "Bootstrap");
}

void bootstrap();
