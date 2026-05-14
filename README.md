# Backend Engineering Evaluation - Roll No: 12300584

This repository contains the backend evaluation for Afford Medical Technologies. The solution is divided into a reusable logging package, a vehicle maintenance scheduling microservice, and a comprehensive notification system design.

## Repository Structure

- `logging_middleware/`: A decoupled, reusable Node.js/TypeScript package for centralized logging.
- `vehicle_maintenance_scheduler/`: Express.js microservice for optimal task allocation.
- `notification_system_design.md`: Technical documentation and implementation for Stages 1–6 of the Notification System.

---

## 1. Logging Middleware

A custom logging utility designed for observability and production monitoring.

### Features
* **Remote Logging**: Sends structured logs to the Afford Medical evaluation server via HTTP POST.
* **Request Interception**: Express middleware to log incoming requests and response status codes.
* **Auto-Truncation**: Automatically handles the 48-character message constraint for remote log safety.
* **Type Safety**: Full TypeScript support for Stack, Level, and Package enums.

### Setup
```bash
cd logging_middleware
npm install
npm run build
2. Vehicle Maintenance SchedulerA microservice built to solve the resource allocation problem (0/1 Knapsack) to maximize maintenance impact within mechanic hour constraints.Key LogicAlgorithm: Implements a Dynamic Programming (DP) approach to ensure optimal task selection in $O(N \cdot W)$ time complexity.Architecture: Follows a modular Controller-Service-Repository pattern.Integration: Imports and utilizes the local logging_middleware package for all system events.Setup & ExecutionBashcd vehicle_maintenance_scheduler
npm install
# Run in development mode
npx ts-node src/server.ts
3. Notification System DesignThe notification_system_design.md file includes:Stage 1 & 2: REST API schemas and Relational DB (PostgreSQL) architecture.Stage 3 & 4: Query optimization (Composite Indexing) and scaling strategies (SSE vs WebSockets).Stage 5: Distributed worker architecture using Message Queues (RabbitMQ/Kafka) for async processing.Stage 6: Production-ready TypeScript implementation for a Priority Inbox using weighted sorting.Technical StackRuntime: Node.jsLanguage: TypeScriptFramework: Express.jsHTTP Client: Axios
