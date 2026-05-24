# Realistic emission factors based on standard references (e.g. DEFRA 2023, US EPA, GHG Protocol)
# All final emissions are calculated in kilograms of CO2 equivalent (kg CO2e)

# Scope 1: Fuel combustion (activity values in liters or cubic meters)
# Fuel factors map fuel type -> kg CO2e per unit
SCOPE_1_FACTORS = {
    'DIESEL': {
        'factor': 2.68,          # kg CO2e per Liter
        'unit': 'L',
        'label': 'Diesel (Stationary / Transport)'
    },
    'PETROL': {
        'factor': 2.31,          # kg CO2e per Liter
        'unit': 'L',
        'label': 'Motor Gasoline / Petrol'
    },
    'NATURAL_GAS': {
        'factor': 2.02,          # kg CO2e per Cubic Meter (m3)
        'unit': 'M3',
        'label': 'Natural Gas'
    },
    'FUEL_OIL': {
        'factor': 2.96,          # kg CO2e per Liter
        'unit': 'L',
        'label': 'Heavy Fuel Oil'
    },
    'LPG': {
        'factor': 1.56,          # kg CO2e per Liter
        'unit': 'L',
        'label': 'Liquefied Petroleum Gas'
    }
}

# Scope 2: Purchased Electricity (activity values in kWh)
# Factors map grid location code -> kg CO2e per kWh (market/location-based grid average)
SCOPE_2_FACTORS = {
    'US': {
        'factor': 0.38,          # US average grid emission factor
        'label': 'US Grid Average'
    },
    'DE': {
        'factor': 0.35,          # Germany grid mix
        'label': 'Germany Grid Average'
    },
    'IN': {
        'factor': 0.71,          # India grid mix (heavy coal dependency)
        'label': 'India Grid Average'
    },
    'UK': {
        'factor': 0.21,          # UK grid mix (higher renewables)
        'label': 'UK Grid Average'
    },
    'EU': {
        'factor': 0.28,          # European Union average
        'label': 'EU Grid Average'
    },
    'DEFAULT': {
        'factor': 0.44,          # Global grid average fallback
        'label': 'Global Grid Average'
    }
}

# Scope 3: Corporate Travel (Business travel - flights, hotels, and ground transport)
# Factors map expense/activity category -> kg CO2e per unit
SCOPE_3_FACTORS = {
    'FLIGHT_SHORT_HAUL': {
        'factor': 0.15,          # kg CO2e per passenger-km (< 500 km, e.g. regional flights)
        'unit': 'PKM',
        'label': 'Short-Haul Flight (<500km)'
    },
    'FLIGHT_MEDIUM_HAUL': {
        'factor': 0.08,          # kg CO2e per passenger-km (500km to 3700km, e.g. trans-continental)
        'unit': 'PKM',
        'label': 'Medium-Haul Flight (500-3700km)'
    },
    'FLIGHT_LONG_HAUL': {
        'factor': 0.10,          # kg CO2e per passenger-km (> 3700km, e.g. international)
        'unit': 'PKM',
        'label': 'Long-Haul Flight (>3700km)'
    },
    'HOTEL_STAY': {
        'factor': 25.0,          # kg CO2e per room-night (standard average)
        'unit': 'ROOM_NIGHT',
        'label': 'Hotel Room Stay'
    },
    'CAR_RENTAL': {
        'factor': 0.18,          # kg CO2e per km (average medium gasoline passenger car)
        'unit': 'KM',
        'label': 'Gasoline Passenger Car Travel'
    },
    'TAXI_RIDE': {
        'factor': 0.22,          # kg CO2e per km
        'unit': 'KM',
        'label': 'Taxi / Ride-Share Travel'
    },
    'TRAIN_TRAVEL': {
        'factor': 0.04,          # kg CO2e per passenger-km (national rail average)
        'unit': 'PKM',
        'label': 'National Train Travel'
    }
}

def calculate_scope_1(fuel_type, quantity, unit='L'):
    """Calculate Scope 1 emissions in kg CO2e."""
    fuel_key = fuel_type.upper().replace(' ', '_')
    if fuel_key not in SCOPE_1_FACTORS:
        # Try to find standard match
        for k in SCOPE_1_FACTORS:
            if k in fuel_key:
                fuel_key = k
                break
        else:
            raise ValueError(f"Unknown Scope 1 fuel type: {fuel_type}")

    factor_info = SCOPE_1_FACTORS[fuel_key]
    
    # Simple unit conversion to standard
    target_unit = factor_info['unit']
    multiplier = 1.0
    
    # Liter vs Gallon
    if unit.upper() in ['GAL', 'GALLON', 'GALLONS'] and target_unit == 'L':
        multiplier = 3.78541 # 1 gallon = 3.78541 liters
    
    final_quantity = quantity * multiplier
    emissions = final_quantity * factor_info['factor']
    return emissions, factor_info['factor'], f"Calculated using {factor_info['label']} emission factor ({factor_info['factor']} kg CO2e / {target_unit})"

def calculate_scope_2(kwh, location_code='DEFAULT'):
    """Calculate Scope 2 emissions in kg CO2e."""
    loc_key = location_code.upper().strip()
    if loc_key not in SCOPE_2_FACTORS:
        loc_key = 'DEFAULT'
        
    factor_info = SCOPE_2_FACTORS[loc_key]
    emissions = kwh * factor_info['factor']
    return emissions, factor_info['factor'], f"Calculated using {factor_info['label']} emission factor ({factor_info['factor']} kg CO2e / kWh)"

def calculate_scope_3(category, value, unit='KM'):
    """Calculate Scope 3 emissions in kg CO2e."""
    cat_key = category.upper().replace(' ', '_')
    
    # Try matching categories
    matched_key = None
    for k in SCOPE_3_FACTORS:
        if k in cat_key or cat_key in k:
            matched_key = k
            break
            
    if not matched_key:
        if 'FLIGHT' in cat_key or 'AIR' in cat_key:
            matched_key = 'FLIGHT_MEDIUM_HAUL'
        elif 'HOTEL' in cat_key or 'STAY' in cat_key or 'ACCOMMODATION' in cat_key:
            matched_key = 'HOTEL_STAY'
        elif 'CAR' in cat_key or 'VEHICLE' in cat_key:
            matched_key = 'CAR_RENTAL'
        else:
            matched_key = 'TAXI_RIDE' # fallback

    factor_info = SCOPE_3_FACTORS[matched_key]
    
    # Apply standard multiplier (e.g. miles to km)
    multiplier = 1.0
    if unit.upper() in ['MI', 'MILE', 'MILES'] and factor_info['unit'] in ['KM', 'PKM']:
        multiplier = 1.60934 # 1 mile = 1.60934 km
        
    final_value = value * multiplier
    emissions = final_value * factor_info['factor']
    return emissions, factor_info['factor'], f"Calculated using {factor_info['label']} emission factor ({factor_info['factor']} kg CO2e / {factor_info['unit']})"
