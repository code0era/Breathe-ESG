import logging
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from .models import DataSource, RawIngestion
from .serializers import DataSourceSerializer, RawIngestionSerializer

# Parsers
from .parsers.sap_parser import parse_sap_csv
from .parsers.utility_parser import parse_utility_csv
from .parsers.travel_parser import parse_travel_csv

# Cloudinary (optional upload helper)
import cloudinary
import cloudinary.uploader
import os

logger = logging.getLogger(__name__)

class DataSourceViewSet(viewsets.ModelViewSet):
    serializer_class = DataSourceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DataSource.objects.filter(tenant=self.request.user.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)

class RawIngestionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RawIngestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return RawIngestion.objects.filter(tenant=self.request.user.tenant).order_by('-uploaded_at')

class IngestFileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        data_source_id = request.data.get('data_source')
        uploaded_file = request.FILES.get('file')

        if not data_source_id or not uploaded_file:
            return Response(
                {"error": "Both 'data_source' ID and 'file' are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Retrieve and verify DataSource
        try:
            data_source = DataSource.objects.get(id=data_source_id, tenant=request.user.tenant)
        except DataSource.DoesNotExist:
            return Response(
                {"error": "Data source not found or permission denied."},
                status=status.HTTP_404_NOT_FOUND
            )

        # 1. Create a RawIngestion entry in 'pending' status
        raw_ingestion = RawIngestion.objects.create(
            tenant=request.user.tenant,
            data_source=data_source,
            file_name=uploaded_file.name,
            status='pending',
            uploaded_by=request.user
        )

        # 2. Upload file to Cloudinary if configured
        cloudinary_url = os.getenv('CLOUDINARY_URL')
        raw_data_url = None
        if cloudinary_url:
            try:
                # Configure cloudinary
                # env var is parsed automatically by python-cloudinary if named CLOUDINARY_URL
                upload_result = cloudinary.uploader.upload(
                    uploaded_file,
                    resource_type="raw",
                    folder=f"breathe_esg/tenant_{request.user.tenant.id}/"
                )
                raw_data_url = upload_result.get('secure_url')
                raw_ingestion.raw_data_url = raw_data_url
                raw_ingestion.save()
            except Exception as e:
                logger.error(f"Cloudinary upload failed: {str(e)}")
                # Continue processing even if Cloudinary fails, as in-memory processing works

        # 3. Read file contents into memory for parsing
        try:
            # Move file pointer to start
            uploaded_file.seek(0)
            file_content = uploaded_file.read()
            
            # Start parsing transaction
            with transaction.atomic():
                raw_ingestion.status = 'processing'
                raw_ingestion.save()
                
                rows_count = 0
                
                # Execute specific parser
                if data_source.source_type == 'sap':
                    rows_count = parse_sap_csv(file_content, raw_ingestion)
                elif data_source.source_type == 'utility':
                    rows_count = parse_utility_csv(file_content, raw_ingestion)
                elif data_source.source_type == 'travel':
                    rows_count = parse_travel_csv(file_content, raw_ingestion)
                else:
                    raise ValueError(f"Unsupported source type: {data_source.source_type}")
                    
                # Mark as successful
                raw_ingestion.status = 'success'
                raw_ingestion.save()
                
                return Response({
                    "message": "File ingested and parsed successfully.",
                    "ingestion_id": raw_ingestion.id,
                    "rows_parsed": rows_count,
                    "status": "success"
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            # Parser failed, log error message
            raw_ingestion.status = 'failed'
            raw_ingestion.error_message = str(e)
            raw_ingestion.save()
            
            logger.error(f"Parsing failed for ingestion {raw_ingestion.id}: {str(e)}")
            
            return Response({
                "error": f"Failed to parse ingestion file: {str(e)}",
                "ingestion_id": raw_ingestion.id,
                "status": "failed"
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
