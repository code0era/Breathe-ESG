# Breathe ESG — Enterprise Carbon Accounting & Auditor Review Portal

A premium, full-stack, compliance-grade carbon accounting prototype. Built with a robust **Django REST API** backend and a gorgeous, glassmorphic **React (Vite) SPA** frontend. Uses **PostgreSQL (Neon)** for auditable records and **Cloudinary** for secure file retention.

---

## 🔑 Quick Demo Credentials

Use these pre-seeded roles to log in and test active analyst/auditor workspaces instantly:

| Role | Email Address | Password | Privileges |
|---|---|---|---|
| **Sustainability Analyst** | `analyst@breatheesg.com` | `Test1234` | Ingest files, manually override quantities, approve, reject, flag |
| **Compliance Auditor** | `auditor@breatheesg.com` | `Test1234` | Read-only dashboards, access compliance logs, audit sign-offs |

---

## 🚀 Key Features Built-In

1. **Multi-Tenant Architecture**: Robust DB-level segregation preventing data cross-exposure.
2. **Proportional Month Allocation (Scope 2)**: Automatically parses utility cycles spanning multiple months and splits kWh consumption proportionally to clean calendar boundaries.
3. **Haversine Distance Calculator (Scope 3)**: Resolves missing travel distances by running Great Circle calculations between origin and destination IATA airport codes.
4. **Interactive Analyst Review Dashboard**: Filter records by Scope, Status, and location. Click to edit values (which recalculates carbon instantly), approve, reject, or flag suspicious records.
5. **Change Trail (Audit Log)**: Every single action, state transition, and manual override is logged into an immutable compliance table with details of before/after values.

---

## 📂 Project Structure

```
breathe-esg/
├── backend/                  # Django REST Project
│   ├── breathe_esg/          # Django settings, WSGI, URLs
│   ├── accounts/             # Tenants, Custom Users, JWT Auth
│   ├── ingestion/            # Parsers (SAP, Utility, Travel), Seeder
│   ├── records/              # NormalizedRecord ledger, Stats
│   ├── audit/                # Compliance AuditLog history
│   └── sample_data/          # Mock CSV files for instant seeder runs
└── frontend/                 # React SPA (Vite, Axios, Tailwind, Lucide)
    ├── src/
    │   ├── components/       # Premium glass sidebar
    │   ├── pages/            # Login, Dashboard, Ingest, Review, Audit
    │   └── api.js            # Axios client with JWT refresh interceptors
```

---

## 🛠️ Local Installation & Development

### 1. Backend Setup
1. Navigate to backend:
   ```bash
   cd backend
   ```
2. Create and activate virtual environment:
   ```bash
   py -3 -m venv .venv
   .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Setup environment variables (`.env` in `backend/`):
   ```env
   SECRET_KEY=dQkGyNc4Y9DZWW7OtU6luy8spqBGTbLO_SCp45U7GXuVb4GgkfXUHXhuYJc-RenF3Us
   DATABASE_URL=postgresql://neondb_owner:npg_TJ7tUH5YxMdv@ep-long-resonance-aqnetnkd-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   DEBUG=True
   ```
5. Apply migrations and seed the ESG database:
   ```bash
   python manage.py migrate
   python manage.py seed_esg
   ```
6. Start dev server:
   ```bash
   python manage.py runserver
   ```

### 2. Frontend Setup
1. Navigate to frontend:
   ```bash
   cd ../frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Set environment variable (`.env` in `frontend/`):
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   ```
4. Launch development server:
   ```bash
   npm run dev
   ```

---

## 📝 Compliance & Design Deliverables Included
- **MODEL.md**: Complete database mappings and normalizations rationale.
- **DECISIONS.md**: Justifications for flat-files, IATA Haversine math, and month splits.
- **TRADEOFFS.md**: Technical tradeoffs (synchronous parser runs, offline factor lookups).
- **SOURCES.md**: Real-world feed discoveries (AL11 German headers, Navan/Concur shapes).
