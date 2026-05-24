from django.db import models
from django.conf import settings
from accounts.models import Tenant
from records.models import NormalizedRecord

class AuditLog(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='audit_logs')
    record = models.ForeignKey(NormalizedRecord, on_delete=models.CASCADE, null=True, blank=True, related_name='audit_logs')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_actions')
    
    action = models.CharField(max_length=50) # 'CREATE', 'UPDATE', 'APPROVE', 'REJECT', 'FLAG'
    field_name = models.CharField(max_length=50, blank=True, null=True)
    old_value = models.TextField(blank=True, null=True)
    new_value = models.TextField(blank=True, null=True)
    
    comments = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} by {self.user.email if self.user else 'System'} on {self.timestamp}"
