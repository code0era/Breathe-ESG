import io
import pandas as pd
from datetime import datetime
from records.models import NormalizedRecord
from ingestion.emission_factors import calculate_scope_1

# SAP material mapping
MATERIAL_MAP = {
    'MAT001': 'DIESEL',
    'MAT002': 'PETROL',
    'MAT003': 'NATURAL_GAS',
    'MAT004': 'FUEL_OIL',
    'MAT005': 'LPG'
}

# SAP Plant to Location lookup
PLANT_LOOKUP = {
    '1000': 'Berlin Facility, DE',
    '2000': 'New York Warehouse, US',
    '3000': 'Mumbai Factory, IN',
    '4000': 'London Office, UK'
}

def parse_sap_csv(file_content, raw_ingestion):
    """
    Parses a typical SAP flat file / CSV export.
    Expects headers: WERKS, MATNR, MENGE, MEINS, BUDAT, BWART
    (German SAP standard columns for plant, material, quantity, unit, posting date, movement type)
    """
    tenant = raw_ingestion.tenant
    
    # Read the file
    if isinstance(file_content, bytes):
        file_content = file_content.decode('utf-8')
    
    df = pd.read_csv(io.StringIO(file_content))
    
    # Required columns validation
    required_cols = {'WERKS', 'MATNR', 'MENGE', 'MEINS', 'BUDAT'}
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"Missing required SAP export columns: {missing}")
        
    records_created = []
    
    for index, row in df.iterrows():
        try:
            # 1. Extract values
            plant_code = str(row['WERKS']).strip()
            material_code = str(row['MATNR']).strip()
            quantity = float(row['MENGE'])
            unit = str(row['MEINS']).strip()
            posting_date_str = str(row['BUDAT']).strip()
            
            # 2. Map plant to location
            location = PLANT_LOOKUP.get(plant_code, f"Unknown SAP Plant ({plant_code})")
            
            # 3. Map material code to fuel type
            fuel_type = MATERIAL_MAP.get(material_code)
            if not fuel_type:
                # Fallback to checking description if available, otherwise skip or flag as suspicious
                fuel_type = 'DIESEL' # fallback default
                suspicious = True
                suspicious_reason = f"Unmapped SAP material code '{material_code}'. Fallback to DIESEL."
            else:
                suspicious = False
                suspicious_reason = None
                
            # 4. Handle date formatting (YYYYMMDD is SAP default)
            try:
                if len(posting_date_str) == 8:
                    date_val = datetime.strptime(posting_date_str, '%Y%m%d').date()
                else:
                    # try standard date formats
                    date_val = pd.to_datetime(posting_date_str).date()
            except Exception:
                date_val = datetime.now().date()
                suspicious = True
                suspicious_reason = f"Malformed SAP posting date '{posting_date_str}'. Fallback to current date."
                
            # 5. Calculate emissions
            try:
                co2e, factor, comment = calculate_scope_1(fuel_type, quantity, unit)
            except Exception as e:
                # If calculations fail, default to 0 and flag
                co2e, factor, comment = 0.0, 0.0, f"Calculation failed: {str(e)}"
                suspicious = True
                suspicious_reason = f"Emissions calculation failed: {str(e)}"
                
            # Create NormalizedRecord
            record = NormalizedRecord(
                tenant=tenant,
                raw_ingestion=raw_ingestion,
                source_row_index=index + 1,
                date=date_val,
                scope='Scope 1',
                category=f"SAP Fuel - {fuel_type.title()}",
                description=f"SAP Post - Material {material_code}, Plant {plant_code}. {comment}",
                original_value=quantity,
                original_unit=unit,
                normalized_value=quantity, # standard normalization matches or converted in calculation
                normalized_unit='L' if fuel_type != 'NATURAL_GAS' else 'M3',
                co2e_kg=co2e,
                location=location,
                review_status='suspicious' if suspicious else 'pending',
                suspicious_reason=suspicious_reason
            )
            records_created.append(record)
            
        except Exception as e:
            # Let general row errors flag as suspicious/failed
            raise ValueError(f"Error parsing row {index + 1}: {str(e)}")
            
    # Bulk create
    NormalizedRecord.objects.bulk_create(records_created)
    return len(records_created)
