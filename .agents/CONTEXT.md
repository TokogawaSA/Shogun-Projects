# Antigravity 2.0 & Antigravity IDE Development Context

Development and continuous integration are orchestrated using **Google Antigravity 2.0** and the **Antigravity IDE**. Antigravity operates as an agent-first workspace where autonomous agents manipulate local file directories, execute terminal build tools, inspect rendered user interfaces using headless browser sub-agents, and manage backend cloud infrastructure through the Model Context Protocol (MCP) and Firebase Agent Skills.

---

## Architectural Stack Matrix

| Architectural Tier | Selected Technology Stack | Operational Responsibilities |
| :--- | :--- | :--- |
| **Client Interface** | React 19, TypeScript, Vite, Tailwind CSS / Ant Design | Renders interactive task boards, Gantt charts, and user controls with optimistic state updates. |
| **State & Synchronization** | Firebase Web SDK v10+, React Context API, Custom Hooks | Manages persistent WebSockets via Firestore `onSnapshot` listeners for real-time collaboration. |
| **Serverless Compute** | Cloud Functions Gen 2 (TypeScript / Node.js 20+) | Handles event-driven triggers, background notifications, audit trail generation, and strict data validation. |
| **Database & Identity** | Cloud Firestore, Firebase Authentication | Provides document storage, user identity management, and server-enforced security rules. |
| **Agentic Orchestration** | Google Antigravity 2.0, Antigravity IDE, Firebase MCP | Drives multi-agent coding, TDD gates, schema generation, UI visual verification, and automated builds. |
| **Edge Delivery** | Firebase Hosting / App Hosting | Delivers globally distributed static asset caching, single-command deployments, and SSL termination. |

---

## Operational Control Dual-Wielding Model

Developers maintain optimal control by dual-wielding the standalone **Antigravity 2.0 Desktop application**—functioning as a central command center for parallel multi-agent background tasks—alongside the **Antigravity IDE** for active source-code editing. This division preserves IDE responsiveness while allowing background agents to perform broad repository sweeps and automated tests.

| Platform Surface | Antigravity 2.0 Standalone Desktop Application | Antigravity IDE Development Environment |
| :--- | :--- | :--- |
| **Primary Operational Role** | High-level agent command center and multi-agent orchestration hub | Direct source-code editing, active workspace navigation, and inline completion |
| **Context Boundary** | Operates across multi-folder "Projects" spanning disjointed repositories | Operates strictly within a single open development workspace directory |
| **Interaction Modalities** | Asynchronous scheduled tasks, JSON event hooks, parallel sub-agents | Inline tab completions, terminal execution panels, visual artifact review screens |
| **Ideal Workload** | Long-running background refactoring, environment setups, and system builds | Targeted feature implementation, bug fixing, and real-time code iteration |
