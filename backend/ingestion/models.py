from django.db import models
from django.conf import settings
from accounts.models import Tenant

class DataSource(models.Model):
    SOURCE_TYPES = (
        ('sap', 'SAP Fuel & Procurement'),
        ('utility', 'Utility Grid Electricity'),
        ('travel', 'Corporate Travel'),
    )

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='data_sources')
    name = models.CharField(max_length=255)
    source_type = models.CharField(max_length=20, choices=SOURCE_TYPES)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_source_type_display()}) for {self.tenant.name}"

class RawIngestion(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending Processing'),
        ('processing', 'Processing'),
        ('success', 'Processed Successfully'),
        ('failed', 'Processing Failed'),
    )

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='raw_ingestions')
    data_source = models.ForeignKey(DataSource, on_delete=models.CASCADE, related_name='ingestions')
    file_name = models.CharField(max_length=255)
    raw_data_url = models.URLField(blank=True, null=True, max_length=1000) # link to Cloudinary or uploaded file path
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True, null=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='uploads')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.file_name} ({self.status}) at {self.uploaded_at}"
