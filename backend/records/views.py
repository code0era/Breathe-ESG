from rest_framework import viewsets, permissions, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth
from .models import NormalizedRecord
from .serializers import NormalizedRecordSerializer
from audit.models import AuditLog

class NormalizedRecordViewSet(viewsets.ModelViewSet):
    serializer_class = NormalizedRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = NormalizedRecord.objects.filter(tenant=self.request.user.tenant)
        
        # Apply filters
        scope = self.request.query_params.get('scope')
        category = self.request.query_params.get('category')
        status_param = self.request.query_params.get('status')
        location = self.request.query_params.get('location')
        
        if scope:
            queryset = queryset.filter(scope=scope)
        if category:
            queryset = queryset.filter(category=category)
        if status_param:
            queryset = queryset.filter(review_status=status_param)
        if location:
            queryset = queryset.filter(location__icontains=location)
            
        return queryset.order_by('-date')

    def perform_create(self, serializer):
        record = serializer.save(tenant=self.request.user.tenant)
        # Log to AuditLog
        AuditLog.objects.create(
            tenant=self.request.user.tenant,
            record=record,
            user=self.request.user,
            action='CREATE',
            comments="Manually created record."
        )

    def perform_update(self, serializer):
        # Fetch old values to track differences
        old_record = self.get_object()
        old_val_str = f"Date: {old_record.date}, Qty: {old_record.original_value} {old_record.original_unit}, Location: {old_record.location}, Scope: {old_record.scope}, Category: {old_record.category}"
        
        record = serializer.save()
        
        new_val_str = f"Date: {record.date}, Qty: {record.original_value} {record.original_unit}, Location: {record.location}, Scope: {record.scope}, Category: {record.category}"
        
        # Log manual edit to AuditLog
        AuditLog.objects.create(
            tenant=self.request.user.tenant,
            record=record,
            user=self.request.user,
            action='UPDATE',
            old_value=old_val_str,
            new_value=new_val_str,
            comments="Manually edited details, emissions recalculated."
        )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        record = self.get_object()
        
        if record.review_status == 'approved':
            return Response({"message": "Record already approved."}, status=status.HTTP_400_BAD_REQUEST)
            
        record.review_status = 'approved'
        record.reviewed_by = request.user
        record.reviewed_at = timezone.now()
        record.save()
        
        # Log to AuditLog
        AuditLog.objects.create(
            tenant=request.user.tenant,
            record=record,
            user=request.user,
            action='APPROVE',
            comments="Approved row for audit trail."
        )
        
        return Response({"message": "Record approved successfully.", "status": "approved"})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        record = self.get_object()
        comments = request.data.get('comments', "No comment provided.")
        
        record.review_status = 'rejected'
        record.reviewed_by = request.user
        record.reviewed_at = timezone.now()
        record.save()
        
        # Log to AuditLog
        AuditLog.objects.create(
            tenant=request.user.tenant,
            record=record,
            user=request.user,
            action='REJECT',
            comments=comments
        )
        
        return Response({"message": "Record rejected successfully.", "status": "rejected"})

    @action(detail=True, methods=['post'])
    def flag(self, request, pk=None):
        record = self.get_object()
        reason = request.data.get('reason', "Flagged for further investigation.")
        
        record.review_status = 'suspicious'
        record.suspicious_reason = reason
        record.save()
        
        # Log to AuditLog
        AuditLog.objects.create(
            tenant=request.user.tenant,
            record=record,
            user=request.user,
            action='FLAG',
            comments=f"Flagged as suspicious. Reason: {reason}"
        )
        
        return Response({"message": "Record flagged successfully.", "status": "suspicious"})

class DashboardStatsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        tenant = request.user.tenant
        records = NormalizedRecord.objects.filter(tenant=tenant)
        
        # 1. Row counts by status
        status_counts = records.values('review_status').annotate(count=Count('id'))
        status_map = {item['review_status']: item['count'] for item in status_counts}
        
        # 2. Total carbon emissions
        total_co2 = records.aggregate(total=Sum('co2e_kg'))['total'] or 0.0
        
        # Approved carbon emissions
        approved_co2 = records.filter(review_status='approved').aggregate(total=Sum('co2e_kg'))['total'] or 0.0
        
        # 3. Emissions by Scope
        scope_emissions = records.values('scope').annotate(total=Sum('co2e_kg'))
        scope_map = {item['scope']: item['total'] for item in scope_emissions}
        
        # 4. Monthly timeline emissions (last 12 months)
        monthly_trend = records.annotate(month=TruncMonth('date')) \
                               .values('month') \
                               .annotate(total=Sum('co2e_kg')) \
                               .order_by('month')
                               
        trend_list = []
        for item in monthly_trend:
            if item['month']:
                trend_list.append({
                    "month": item['month'].strftime('%Y-%m'),
                    "total_co2e": float(item['total'] or 0.0)
                })
                
        # 5. Emissions by Category breakdown
        category_breakdown = records.values('category', 'scope') \
                                   .annotate(total=Sum('co2e_kg')) \
                                   .order_by('-total')
        cat_list = []
        for item in category_breakdown:
            cat_list.append({
                "category": item['category'],
                "scope": item['scope'],
                "total_co2e": float(item['total'] or 0.0)
            })

        return Response({
            "total_co2e": float(total_co2),
            "approved_co2e": float(approved_co2),
            "status_counts": {
                "pending": status_map.get('pending', 0),
                "approved": status_map.get('approved', 0),
                "rejected": status_map.get('rejected', 0),
                "suspicious": status_map.get('suspicious', 0),
                "total": sum(status_map.values())
            },
            "scope_breakdown": {
                "scope_1": float(scope_map.get('Scope 1', 0.0)),
                "scope_2": float(scope_map.get('Scope 2', 0.0)),
                "scope_3": float(scope_map.get('Scope 3', 0.0))
            },
            "monthly_trend": trend_list,
            "category_breakdown": cat_list
        })
