# Antigravity 2.0 & Antigravity IDE Development Context: cPanel Full-Stack Edition

Development and continuous integration are orchestrated using **Google Antigravity 2.0** and the **Antigravity IDE**. Antigravity operates as an agent-first workspace where autonomous agents manipulate local file directories, execute terminal build tools, inspect rendered user interfaces using headless browser sub-agents, and manage backend server architecture running a Node.js + Express REST API backed by **PostgreSQL 16+** and **Redis (BullMQ & Caching)**.

---

## Architectural Stack Matrix (Consolidated PostgreSQL Edition)

| Architectural Tier | Selected Technology Stack | Operational Responsibilities |
| :--- | :--- | :--- |
| **Client Interface** | React 19, TypeScript (strict mode), Vite, Tailwind CSS / Ant Design | Renders interactive dashboards, CRM modules, task boards, and PPM matrices. Deployed to `public_html` with `.htaccess` rewrite rules. |
| **State & Networking** | React Context API, Axios / Fetch Client Services, WebSockets | Communicates with the Express REST API, handles JWT session tokens, and manages real-time collaborative UI updates. |
| **Backend REST API** | Node.js, Express.js (TypeScript) | Handles routing, multi-tenant isolation, permission validation, password hashing (bcryptjs), and JWT token management. Hosted via cPanel 'Setup Node.js App' (Passenger) or VPS container. |
| **Database & Identity** | PostgreSQL 16+ (managed via Prisma ORM) | Relational data persistence, Row-Level Security (RLS), JSONB dynamic indexing, foreign key constraints, connection pooling, and multi-tenant data segmentation (`tenantId`). |
| **Queue & Cache Layer** | Redis 7+ / BullMQ / Cron Workers | Offloads heavy synchronization, email dispatch (SMTP/API), recurring task generation, audit trail ingestion, and real-time Pub/Sub broadcasts. |
| **Agentic Orchestration** | Google Antigravity 2.0, Antigravity IDE | Drives multi-agent coding, TDD gates, schema generation, UI visual verification, and automated build verification. |

---

## Multi-Tenancy & Security Directives

1. **Strict Multi-Tenant Isolation**: Every API endpoint and database query MUST validate JWT tokens and enforce tenant boundaries using `tenantId`.
2. **Role & Admin Authorization**: Privileged administrative and settings operations require `isTenantAdmin: true` or verified role permissions validated via token middleware.
3. **Database Connection Pooling**: Database connections in `server/src/config/db.ts` must use connection pooling via environment variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`).
4. **SPA Deep Linking**: Client builds must route deep links through `.htaccess` rewrites targeting `/index.html`.

---

## Operational Control Model

Developers maintain optimal control by dual-wielding the standalone **Antigravity 2.0 Desktop application**—functioning as a central command center for parallel multi-agent background tasks—alongside the **Antigravity IDE** for active source-code editing.

| Platform Surface | Antigravity 2.0 Standalone Desktop Application | Antigravity IDE Development Environment |
| :--- | :--- | :--- |
| **Primary Operational Role** | High-level agent command center and multi-agent orchestration hub | Direct source-code editing, active workspace navigation, and inline completion |
| **Context Boundary** | Operates across multi-folder "Projects" spanning disjointed repositories | Operates strictly within a single open development workspace directory |
| **Interaction Modalities** | Asynchronous scheduled tasks, JSON event hooks, parallel sub-agents | Inline tab completions, terminal execution panels, visual artifact review screens |
| **Ideal Workload** | Long-running background refactoring, environment setups, and system builds | Targeted feature implementation, bug fixing, and real-time code iteration |
