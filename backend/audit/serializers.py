from rest_framework import serializers
from .models import AuditLog
from accounts.serializers import UserSerializer

class AuditLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    record_category = serializers.CharField(source='record.category', read_only=True)
    record_scope = serializers.CharField(source='record.scope', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'tenant', 'record', 'record_category', 'record_scope', 
            'user', 'action', 'field_name', 'old_value', 'new_value', 
            'comments', 'timestamp'
        ]
