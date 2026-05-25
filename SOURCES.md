# Real-World Data Feeds Analysis — Breathe ESG

This document catalogs our research on real-world system exports, how our sample data mimics those patterns, and what failure points would occur in a live production environment.

---

## 1. Real-World Feed Research & Mock Alignment

### A. SAP Fuel & Procurement
- **Real-World Discovery**: SAP ERP structures are notoriously rigid. Data is typically extracted using flat-file AL11 jobs. Material identifiers (MATNR) and plant codes (WERKS) are custom-configured for each corporation. Column names are in German abbreviations (e.g. `BUDAT` = Posting Date, `MEINS` = Unit of Measure).
- **Our Mock CSV**: Mimics this exact German-column rigid schema. It includes customized material keys like `MAT001` (Diesel) and plant codes like `1000` (Germany Facility) or `3000` (India Facility).
- **Production Failure Points**: In production, plant or movement code changes on SAP will break our hardcoded map. A robust custom lookup mapper config page would be required to let users map codes inside the UI.

### B. Utility Grid Electricity
- **Real-World Discovery**: Small/medium business locations download periodic CSVs from portal billing tabs (e.g., PG&E ShareMyData, National Grid). These contain specific meter indices (`meter_id`), account numbers, and variable cycle durations (28 to 33 days).
- **Our Mock CSV**: Captures variable billing intervals that don't match standard calendar months. It includes various regional location codes (`US`, `IN`, `DE`, `UK`) which determine the location-based Scope 2 coefficient.
- **Production Failure Points**: Electricity bills are prone to estimated readings and retroactive adjustments. In production, re-importing a corrected cycle would require reconciling overlapping records or merging ledger values.

### C. Corporate Travel Expenses
- **Real-World Discovery**: Systems like Concur or Navan generate detailed CSV outputs containing trip identifiers, employee names, cost codes, and origin/destination airport IATA tags.
- **Our Mock CSV**: Contains typical airport-to-airport flight pairs (e.g., JFK to LHR) alongside overnight hotel room stays.
- **Production Failure Points**: Employee bookings may have multi-leg connecting flights (e.g. DEL → DXB → JFK). Our Haversine lookup currently computes straight line pairings, which under-calculates fuel during layovers. In production, a global IATA coordinates directory API is mandatory.
