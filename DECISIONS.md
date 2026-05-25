# Architectural Decisions Document — Breathe ESG

This document logs key technical decisions and resolutions of business ambiguities implemented in our prototype.

---

## 1. Data Source Choice & Shape Realities

### A. SAP Fuel & Procurement (Scope 1)
- **Decision**: Flat file CSV export mapping standard German SAP columns.
- **Justification**: Live SAP OData / RFC integrations require high licensing and specialized middleware. In real corporate environments, sustainability teams work with scheduled flat-file reports delivered to cost centers.
- **Assumptions**: 
  - Standard movement type `261` represents direct internal consumption.
  - Material mapping `MAT001` - `MAT005` represents standard corporate fuels (Diesel, Petrol, Gas). Unmapped codes are flagged.

### B. Utility Grid Electricity (Scope 2)
- **Decision**: Portal CSV export capturing billing cycles, rather than API scrapes.
- **Justification**: Utilities rarely provide unified REST APIs for small/medium business locations. Standard energy portals offer download tabs for ledger details.
- **Cycle Month Split Logic**: Electricity billing cycles never match calendar months (e.g. Jan 12 to Feb 15). We resolve this by calculating overlapping days in each month and splitting consumption and cost proportionally. This prevents audit reporting shifts.

### C. Corporate Travel Expenses (Scope 3)
- **Decision**: Expense report log matching Navan/Concur shapes.
- **Justification**: Corporate travel data comes as an expense aggregation. Distances are rarely supplied directly.
- **Airport IATA Distance Lookup**: To bypass missing mileage values, we coded an internal dictionary containing primary business travel hub coordinates (JFK, LHR, CDG, SFO, LAX, DEL, BOM, SIN, DXB) and executed the **Haversine formula** to calculate exact great circle track distance.

---

## 2. Open Questions & PM Alignments

If we were collaborating with the Product Manager directly, we would align on:
1. **Multi-Currency Rules**: Should Scope 3 travel expenses support automated currency conversion engines (e.g., EUR/INR → USD) to standard cost tracking?
2. **Re-parsing Locks**: If a file is re-uploaded containing already approved/locked rows, should it ignore them, raise an error, or create duplicates? Currently, we flag them.
3. **Audit trail signing**: Do auditors require double cryptographic keys or digital signatures when signing off rows, or is simple role-badge audit log tracking sufficient?
