import { GlobalExceptionFilter } from "@appspine/common";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";

async function bootstrap() {
  // Fail closed: a missing CORS_ORIGINS must not silently open CORS to every
  // origin ("*" is also an invalid combination with credentials:true).
  const corsOrigins = process.env.CORS_ORIGINS?.split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  if (!corsOrigins?.length) {
    throw new Error("CORS_ORIGINS must be set (comma-separated origins, e.g. http://localhost:3901).");
  }

  const authMode = process.env.AUTH_MODE ?? "oidc";

  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`Backend running on :${port} [AUTH_MODE=${authMode}]`, "Bootstrap");
}

void bootstrap();
