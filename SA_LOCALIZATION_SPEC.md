# Shogun Projects: South African Market Localization & Sovereignty Addendum (`SA_LOCALIZATION_SPEC.md`)

**Parent Specifications:** `CONTEXT.md`, `shogun_projects_system_specification.md`  
**Target Jurisdiction:** Republic of South Africa (`Africa/Johannesburg`, SAST / UTC+2)  
**Target Stack:** React 19, TypeScript (strict), Express, Prisma ORM, PostgreSQL 16+ (RLS + JSONB), Redis 7+ / BullMQ, Socket.io, MCP Gateway

---

## 1. Architectural Overview & Localization Topology

This addendum defines the mandatory regional extensions required to deploy **Shogun Projects** for South African enterprise, mid-market, and public-sector tenants while maintaining strict multi-tenant Row-Level Security (RLS) isolation.

```mermaid
graph TD
    subgraph Client & Offline Edge
        SPA[React 19 SPA + TanStack Query]
        IDB[(IndexedDB Offline Mutation Queue)]
        PORTAL[External Client Portal]
    end

    subgraph South African Compute Boundary - SAST
        API[Express REST API + Idempotency Guard]
        WS[Socket.io Gateway + Redis Pub/Sub]
        MCP[MCP Gateway + POPIA PII Redactor]
        WORKERS[BullMQ Workers: POPIA, Accounting, WhatsApp, Holidays]
    end

    subgraph Local ZA Persistence & Storage
        PG[(PostgreSQL 16+ RLS: af-south-1 / JHB)]
        REDIS[(Redis 7+ Ephemeral PII Map & Queues)]
        S3[(ZA Object Storage: tenants/tenantId/...)]
    end

    subgraph External & Regional Integrations
        PEACH[Peach Payments V2: PayShap, EFT, Capitec, Cards]
        ACCT[Sage Business Cloud SA v2.0.0 / Xero]
        META[Meta WhatsApp Business Cloud API]
        LLM[Offshore LLM Inference - Redacted Tokens Only]
    end

    SPA <--> IDB
    SPA & PORTAL --> API & WS
    API --> PG & REDIS & S3
    WORKERS --> PG & REDIS
    MCP --> REDIS
    MCP -->|Sanitized Tokens Only| LLM
    WORKERS --> PEACH & ACCT & META
```
