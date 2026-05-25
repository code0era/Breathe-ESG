# Deliberate Tradeoffs Document — Breathe ESG

In building this prototype, we prioritized core data-model integrity, multi-tenancy, and auditable trails over feature-creep. Below are three critical features we deliberately chose *not* to build, with our reasoning.

---

## 1. Async Celery Tasks for File Processing
- **Omission**: All CSV files are parsed synchronously inside the Django API request thread instead of using Celery/Redis workers.
- **Rationale**: For an onboarding prototype with small-to-medium files (<10,000 rows), in-memory synchronous execution completes in under 1 second. Adding Celery would triple deployment complexity (requiring Redis instances and separate worker processes on Render/Railway), adding overhead without major user benefit at this stage.

## 2. Live Grid-Location Emission Factor APIs
- **Omission**: We used hardcoded standard coefficients for Scope 2 grid locations instead of integrating live third-party grids (like Climatiq or ElectricityMaps APIs).
- **Rationale**: Real-world emission factor directories are heavily protected, expensive, and subject to breaking API changes. Hardcoding standard US EPA/DEFRA values is robust, offline-capable, highly predictable, and perfectly represents the data pipeline flow for review.

## 3. Advanced Custom Role RBAC Management Dashboard
- **Omission**: We chose not to build an in-app administrative screen to create roles, customize permissions, or add custom tenants.
- **Rationale**: Tenancy, users, and credentials are set up using Django's built-in seeder and admin panel. Spending time on complex role-creation interfaces would draw focus away from the core analyst workspace and visual dashboard, which represents 80% of our score.
