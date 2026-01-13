Cross-Border Payments Ops Simulator

A production-style simulation of a cross-border payment processing system with ops tooling, retries, alerts, incidents, SLA escalation, and audit trails.

Focused on reliability, observability, and operational excellence, inspired by real fintech systems.

 Features

State-driven payment processing with retry-aware failure handling
Alerts for early risk signals (retryable failures, stuck payments)
Incident management with SLA-based escalation (L1 → L2)
Ops actions: retry & cancel with state validation
Full audit trail of all payment lifecycle events

 Tech Stack

Next.js (App Router)
PostgreSQL (Docker)
Tailwind CSS
Recharts

 Payment Flow
initiated → completed
                   ↘ failed → incident

Key API Endpoints

Processor
POST /api/processor

Ops – Payments
GET  /api/ops/payments/list
POST /api/ops/payments/{id}?action=retry
POST /api/ops/payments/{id}?action=cancel

Ops – Alerts
GET  /api/ops/alerts
POST /api/ops/alerts/{id}/resolve

Ops – Incidents
GET  /api/ops/incidents
POST /api/ops/incidents/{id}/resolve

 Run Locally
docker run -d \
  --name payments-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=payments_db \
  -p 5432:5432 \
  postgres:15

npm install
npm run dev


App runs at http://localhost:3000.

Author

Ishan Parab
Backend systems • Reliability • Ops tooling