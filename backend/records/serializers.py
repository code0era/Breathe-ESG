from rest_framework import serializers
from .models import NormalizedRecord
from accounts.serializers import UserSerializer
from ingestion.serializers import RawIngestionSerializer
from ingestion.emission_factors import calculate_scope_1, calculate_scope_2, calculate_scope_3

class NormalizedRecordSerializer(serializers.ModelSerializer):
    reviewed_by = UserSerializer(read_only=True)
    raw_ingestion = RawIngestionSerializer(read_only=True)
    
    class Meta:
        model = NormalizedRecord
        fields = [
            'id', 'tenant', 'raw_ingestion', 'source_row_index', 'date', 
            'scope', 'category', 'description', 'original_value', 'original_unit', 
            'normalized_value', 'normalized_unit', 'co2e_kg', 'location', 
            'review_status', 'suspicious_reason', 'reviewed_by', 'reviewed_at', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'tenant', 'raw_ingestion', 'source_row_index', 'co2e_kg', 'reviewed_by', 'reviewed_at']

    def update(self, instance, validated_data):
        # Allow analysts to edit dates and activity quantities
        # Recalculate carbon emissions when values change
        instance.date = validated_data.get('date', instance.date)
        instance.scope = validated_data.get('scope', instance.scope)
        instance.category = validated_data.get('category', instance.category)
        instance.original_value = validated_data.get('original_value', instance.original_value)
        instance.original_unit = validated_data.get('original_unit', instance.original_unit)
        instance.location = validated_data.get('location', instance.location)
        
        # Keep normalized value aligned
        instance.normalized_value = instance.original_value
        instance.normalized_unit = instance.original_unit
        
        # Recalculate based on scope
        try:
            if instance.scope == 'Scope 1':
                # Try to map category to fuel type
                fuel_type = instance.category.replace('SAP Fuel - ', '').upper()
                co2e, _, _ = calculate_scope_1(fuel_type, float(instance.original_value), instance.original_unit)
            elif instance.scope == 'Scope 2':
                co2e, _, _ = calculate_scope_2(float(instance.original_value), instance.location or 'DEFAULT')
            else: # Scope 3
                # Map category to travel category key
                travel_cat = instance.category.upper().replace(' ', '_')
                co2e, _, _ = calculate_scope_3(travel_cat, float(instance.original_value), instance.original_unit)
                
            instance.co2e_kg = co2e
        except Exception as e:
            # log warning or raise validation error
            raise serializers.ValidationError({"error": f"Failed to recalculate carbon emissions: {str(e)}"})

        # If manually edited, change review status back to pending or suspicious if it has errors
        instance.review_status = 'pending'
        instance.save()
        return instance
