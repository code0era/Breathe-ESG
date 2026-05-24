import io
import pandas as pd
from datetime import datetime, timedelta
from records.models import NormalizedRecord
from ingestion.emission_factors import calculate_scope_2

def get_days_in_month_overlap(start_date, end_date):
    """
    Given a billing period, return a list of tuples containing:
    (year, month, fraction_of_total_days, days_in_month_overlap)
    Used to allocate billing cycle consumption proportionally to calendar months.
    """
    total_days = (end_date - start_date).days + 1
    if total_days <= 0:
        return [(start_date.year, start_date.month, 1.0, 1)]
        
    current_date = start_date
    month_days = {}
    
    while current_date <= end_date:
        key = (current_date.year, current_date.month)
        month_days[key] = month_days.get(key, 0) + 1
        current_date += timedelta(days=1)
        
    overlap_list = []
    for (year, month), days in month_days.items():
        overlap_list.append((year, month, days / total_days, days))
        
    return overlap_list

def parse_utility_csv(file_content, raw_ingestion):
    """
    Parses utility grid electricity CSV portal exports.
    Headers: account_number, meter_id, billing_start, billing_end, consumption_kwh, location_code
    Supports calendar month allocation.
    """
    tenant = raw_ingestion.tenant
    
    if isinstance(file_content, bytes):
        file_content = file_content.decode('utf-8')
        
    df = pd.read_csv(io.StringIO(file_content))
    
    required_cols = {'account_number', 'meter_id', 'billing_start', 'billing_end', 'consumption_kwh', 'location_code'}
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"Missing required Utility export columns: {missing}")
        
    records_created = []
    
    for index, row in df.iterrows():
        try:
            account = str(row['account_number']).strip()
            meter = str(row['meter_id']).strip()
            start_str = str(row['billing_start']).strip()
            end_str = str(row['billing_end']).strip()
            consumption = float(row['consumption_kwh'])
            loc_code = str(row['location_code']).strip().upper()
            
            # Parse dates
            start_date = pd.to_datetime(start_str).date()
            end_date = pd.to_datetime(end_str).date()
            
            # Calculate overlapping months
            overlaps = get_days_in_month_overlap(start_date, end_date)
            
            for year, month, fraction, days in overlaps:
                allocated_kwh = consumption * fraction
                allocated_date = datetime(year, month, 1).date()
                
                # Check for suspicious grid consumption spikes (e.g. > 100,000 kWh on single meter)
                suspicious = False
                suspicious_reason = None
                if allocated_kwh > 100000:
                    suspicious = True
                    suspicious_reason = f"Abnormally high electricity consumption ({allocated_kwh:.2f} kWh) detected."
                
                # Calculate emissions
                co2e, factor, comment = calculate_scope_2(allocated_kwh, loc_code)
                
                record = NormalizedRecord(
                    tenant=tenant,
                    raw_ingestion=raw_ingestion,
                    source_row_index=index + 1,
                    date=allocated_date,
                    scope='Scope 2',
                    category='Purchased Electricity',
                    description=f"Utility Billing - Account {account}, Meter {meter}. Allocated {days} days to {allocated_date.strftime('%B %Y')} ({fraction*100:.1f}% of cycle). {comment}",
                    original_value=consumption,
                    original_unit='kWh',
                    normalized_value=allocated_kwh,
                    normalized_unit='kWh',
                    co2e_kg=co2e,
                    location=loc_code,
                    review_status='suspicious' if suspicious else 'pending',
                    suspicious_reason=suspicious_reason
                )
                records_created.append(record)
                
        except Exception as e:
            raise ValueError(f"Error parsing row {index + 1}: {str(e)}")
            
    # Bulk create
    NormalizedRecord.objects.bulk_create(records_created)
    return len(records_created)
