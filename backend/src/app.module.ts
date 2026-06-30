import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';

// Auth / RBAC / M2M API Key / Audit Log / Metadata Schema API / MCP Server / Health Check
// are not wired yet — they will be imported here from @apptara/* packages once those
// packages exist (see dev_docs/001-app-framework-plan.md, "後續待辦事項").
@Module({
  imports: [PrismaModule],
})
export class AppModule {}
