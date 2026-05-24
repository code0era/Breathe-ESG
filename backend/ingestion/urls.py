from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DataSourceViewSet, RawIngestionViewSet, IngestFileView

router = DefaultRouter()
router.register('sources', DataSourceViewSet, basename='datasource')
router.register('uploads', RawIngestionViewSet, basename='rawingestion')

urlpatterns = [
    path('', include(router.urls)),
    path('ingest/', IngestFileView.as_view(), name='ingest_file'),
]
