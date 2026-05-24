import io
import math
import pandas as pd
from datetime import datetime
from records.models import NormalizedRecord
from ingestion.emission_factors import calculate_scope_3

# Airport Coordinates Lookup for Haversine calculations (JFK, LHR, CDG, SFO, LAX, DEL, BOM, SIN, DXB)
AIRPORT_COORDS = {
    'JFK': (40.6413, -73.7781),
    'LHR': (51.4700, -0.4543),
    'CDG': (49.0097, 2.5479),
    'SFO': (37.6213, -122.3790),
    'LAX': (33.9416, -118.4085),
    'DEL': (28.5562, 77.1000),
    'BOM': (19.0896, 72.8656),
    'SIN': (1.3644, 103.9915),
    'DXB': (25.2532, 55.3657),
    'HND': (35.5494, 139.7798),
    'SYD': (-33.9461, 151.1772)
}

def calculate_haversine(code1, code2):
    """Calculate distance in kilometers between two IATA airport codes using Haversine formula."""
    if code1 not in AIRPORT_COORDS or code2 not in AIRPORT_COORDS:
        return None
        
    lat1, lon1 = AIRPORT_COORDS[code1]
    lat2, lon2 = AIRPORT_COORDS[code2]
    
    R = 6371.0 # Radius of Earth in km
    
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    
    a = math.sin(d_lat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

def parse_travel_csv(file_content, raw_ingestion):
    """
    Parses corporate business travel CSV exports.
    Headers: trip_id, traveler_name, travel_date, expense_type, origin, destination, quantity, unit
    """
    tenant = raw_ingestion.tenant
    
    if isinstance(file_content, bytes):
        file_content = file_content.decode('utf-8')
        
    df = pd.read_csv(io.StringIO(file_content))
    
    required_cols = {'trip_id', 'travel_date', 'expense_type', 'origin', 'destination', 'quantity', 'unit'}
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"Missing required Travel export columns: {missing}")
        
    records_created = []
    
    for index, row in df.iterrows():
        try:
            trip_id = str(row['trip_id']).strip()
            traveler = str(row['traveler_name']).strip()
            date_str = str(row['travel_date']).strip()
            exp_type = str(row['expense_type']).strip().upper() # FLIGHT, HOTEL, CAR_RENTAL, TRAIN
            origin = str(row['origin']).strip().upper()
            destination = str(row['destination']).strip().upper()
            qty = float(row['quantity'])
            unit = str(row['unit']).strip().upper()
            
            date_val = pd.to_datetime(date_str).date()
            
            # Distance logic for flights
            suspicious = False
            suspicious_reason = None
            comment = ""
            
            val_to_calc = qty
            unit_to_calc = unit
            
            if exp_type == 'FLIGHT':
                # Check distance
                distance_km = calculate_haversine(origin, destination)
                if distance_km:
                    val_to_calc = distance_km
                    unit_to_calc = 'KM'
                    comment = f"Calculated airport distance between {origin} and {destination} is {distance_km:.2f} km."
                else:
                    # Fallback to provided quantity as distance or standard default
                    val_to_calc = qty if qty > 0 else 1000.0
                    unit_to_calc = 'KM' if unit != 'MI' else 'MI'
                    suspicious = True
                    suspicious_reason = f"IATA codes '{origin}' or '{destination}' not in system lookup coordinates. Distance set to default/quantity."
                    comment = f"Fallback distance calculation for {origin} -> {destination}."
                
                # Flight hauling category determination
                distance_check = val_to_calc if unit_to_calc == 'KM' else val_to_calc * 1.60934
                if distance_check < 500:
                    category = 'FLIGHT_SHORT_HAUL'
                elif distance_check > 3700:
                    category = 'FLIGHT_LONG_HAUL'
                else:
                    category = 'FLIGHT_MEDIUM_HAUL'
            elif exp_type == 'HOTEL':
                category = 'HOTEL_STAY'
                unit_to_calc = 'ROOM_NIGHT'
                if qty > 30: # unusually long corporate stay
                    suspicious = True
                    suspicious_reason = "Unusually long single hotel stay (>30 nights)."
            elif exp_type == 'CAR_RENTAL':
                category = 'CAR_RENTAL'
                unit_to_calc = unit if unit in ['KM', 'MI'] else 'KM'
            else:
                category = 'TAXI_RIDE'
                unit_to_calc = 'KM'
                
            # Calculate Scope 3 emissions
            co2e, factor, factor_desc = calculate_scope_3(category, val_to_calc, unit_to_calc)
            
            full_description = f"Corporate Travel - Trip {trip_id} by {traveler}. {comment} {factor_desc}"
            
            record = NormalizedRecord(
                tenant=tenant,
                raw_ingestion=raw_ingestion,
                source_row_index=index + 1,
                date=date_val,
                scope='Scope 3',
                category=category.replace('_', ' ').title(),
                description=full_description,
                original_value=qty,
                original_unit=unit,
                normalized_value=val_to_calc,
                normalized_unit=unit_to_calc,
                co2e_kg=co2e,
                location=f"{origin}-{destination}" if exp_type == 'FLIGHT' else destination,
                review_status='suspicious' if suspicious else 'pending',
                suspicious_reason=suspicious_reason
            )
            records_created.append(record)
            
        except Exception as e:
            raise ValueError(f"Error parsing row {index + 1}: {str(e)}")
            
    # Bulk create
    NormalizedRecord.objects.bulk_create(records_created)
    return len(records_created)
