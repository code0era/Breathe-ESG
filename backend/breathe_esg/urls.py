from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from django.http import JsonResponse

def api_root(request):
    return JsonResponse({
        "status": "online",
        "message": "Breathe ESG Enterprise Carbon Ingestion API is active. Ready to ingest.",
        "endpoints": {
            "auth": "/api/auth/token/",
            "ingest": "/api/ingest/",
            "records": "/api/records/",
            "audit": "/api/audit/"
        }
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include([
        path('', api_root, name='api-root'),
        path('', include('accounts.urls')),
        path('ingest/', include('ingestion.urls')),
        path('records/', include('records.urls')),
        path('audit/', include('audit.urls')),
    ])),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
