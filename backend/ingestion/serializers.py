from rest_framework import serializers
from .models import DataSource, RawIngestion
from accounts.serializers import UserSerializer

class DataSourceSerializer(serializers.ModelSerializer):
    source_type_display = serializers.CharField(source='get_source_type_display', read_only=True)

    class Meta:
        model = DataSource
        fields = ['id', 'name', 'source_type', 'source_type_display', 'description', 'created_at', 'updated_at']

class RawIngestionSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    data_source_name = serializers.CharField(source='data_source.name', read_only=True)
    source_type = serializers.CharField(source='data_source.source_type', read_only=True)

    class Meta:
        model = RawIngestion
        fields = [
            'id', 'data_source', 'data_source_name', 'source_type', 'file_name', 
            'raw_data_url', 'status', 'status_display', 'error_message', 
            'uploaded_by', 'uploaded_at'
        ]
