# appspine-app-template — Agent Guide

Welcome to the development guide for the business systems built using the appspine template.

## Technology Stack

This application consists of two main components:
- **Frontend**: A modern dashboard application built with Next.js 16, Tailwind CSS v4, and shadcn/ui.
- **Backend**: A NestJS API framework powered by Prisma ORM for database modeling and access.

For setting up the environment, local database, dependencies, and launching the services, please refer to the Quick Start guide in the root [README.md](../README.md).

## Shared Framework Packages

The backend comes pre-integrated with several `@appspine/*` packages located in the upstream monorepo:
- **Auth (`@appspine/auth`)**: Supports both local credentials (JWT HS256) and OpenID Connect (OIDC) through external identity providers (e.g., Keycloak).
- **RBAC (`@appspine/rbac`)**: Manages custom roles and permission mappings. Offers guards like `AdminGuard` and `PermissionGuard` to enforce access controls.
- **M2M API Key (`@appspine/m2m-api-key`)**: Handles machine-to-machine client API keys, rate-limiting, and scoped endpoint access.
- **Audit Log (`@appspine/audit-log`)**: Records key system events directly to the local database.
- **Health Check (`@appspine/health-check`)**: Exposes system health checks at `GET /health` with DB connection pinging.
- **Metadata Schema (`@appspine/metadata-schema`)**: Generates model-driven schema descriptions from Prisma DMMF, exposed at `GET /metadata/schema`.
- **MCP Server (`@appspine/mcp-server`)**: Runs a Model Context Protocol endpoint at `POST /mcp` that allows the system to register and expose customized AI tools to agents.

## Development Conventions

Full naming, directory, lint, Prisma, API design, Git/commit, testing, and frontend-component
conventions — plus the standard flow for adding a new CRUD module — live in
[conventions.md](conventions.md). Read it before starting implementation work.

## App Positioning

<!-- TODO(scaffold): Fill in this app's positioning after running scaffold-init.
     Describe the business domain and the core modules this system owns. -->

---
