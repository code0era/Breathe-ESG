from django.db import models
from django.conf import settings
from accounts.models import Tenant
from ingestion.models import RawIngestion

class NormalizedRecord(models.Model):
    SCOPE_CHOICES = (
        ('Scope 1', 'Scope 1 - Direct Emissions'),
        ('Scope 2', 'Scope 2 - Indirect Emissions (Electricity)'),
        ('Scope 3', 'Scope 3 - Indirect Emissions (Value Chain)'),
    )

    REVIEW_STATUS_CHOICES = (
        ('pending', 'Pending Approval'),
        ('approved', 'Approved & Locked'),
        ('rejected', 'Rejected'),
        ('suspicious', 'Suspicious / Flagged'),
    )

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='records')
    raw_ingestion = models.ForeignKey(RawIngestion, on_delete=models.SET_NULL, null=True, blank=True, related_name='records')
    source_row_index = models.IntegerField(null=True, blank=True, help_name="Row index in original file")
    
    date = models.DateField()
    scope = models.CharField(max_length=10, choices=SCOPE_CHOICES)
    category = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    
    original_value = models.DecimalField(max_digits=18, decimal_places=4)
    original_unit = models.CharField(max_length=20)
    
    normalized_value = models.DecimalField(max_digits=18, decimal_places=4)
    normalized_unit = models.CharField(max_length=20)
    
    co2e_kg = models.DecimalField(max_digits=18, decimal_places=4, help_name="Calculated carbon in kilograms of CO2e")
    location = models.CharField(max_length=100, blank=True, null=True)
    
    # Audit & Approval states
    review_status = models.CharField(max_length=20, choices=REVIEW_STATUS_CHOICES, default='pending')
    suspicious_reason = models.TextField(blank=True, null=True)
    
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_records')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.scope} - {self.category} ({self.co2e_kg} kg CO2e) for {self.tenant.name}"
