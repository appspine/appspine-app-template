import { GlobalExceptionFilter } from "@appspine/common";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { Logger as PinoLogger } from "nestjs-pino";

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

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true, rawBody: true });

  // Without this, `bufferLogs: true` flushes into Nest's default console logger and every
  // application-level Logger call (including GlobalExceptionFilter's error path) bypasses
  // pino — and therefore bypasses LoggingModule's redaction config.
  app.useLogger(app.get(PinoLogger));

  app.useGlobalFilters(new GlobalExceptionFilter());

  // Baseline security response headers. This is a JSON API with no browser-rendered
  // views, so CSP/COEP defaults are harmless; the frontend sets its own (next.config.mjs).
  app.use(helmet());
  app.disable("x-powered-by");

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Without this, Nest never wires OS termination signals to lifecycle hooks —
  // OnApplicationShutdown implementations (including AppspinePluginHost's
  // required reverse-order plugin shutdown, and any capability's own resource
  // cleanup such as ChatGateway's socket server close) silently never run on a
  // real SIGTERM/SIGINT, even though they do run under NestJS's test module
  // `.close()`, which is why compile-only tests never caught this.
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`Backend running on :${port} [AUTH_MODE=${authMode}]`, "Bootstrap");
}

void bootstrap();
