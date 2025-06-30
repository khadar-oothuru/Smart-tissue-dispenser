from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from django_filters import rest_framework as filters
from ..permissions import IsAdminUser
from ..models import AppLog
from ..serializers import AppLogSerializer
from rest_framework.decorators import api_view, permission_classes
from django.http import HttpResponse, JsonResponse
import csv
import io
import json
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas


class AdminLogsListView(generics.ListAPIView):
    """View for listing application logs with pagination and filtering"""
    
    serializer_class = AppLogSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [filters.DjangoFilterBackend]
    filterset_fields = ['level', 'source']
    
    def get_queryset(self):
        """Get filtered queryset based on query parameters"""
        queryset = AppLog.objects.all()
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            try:
                start_datetime = datetime.strptime(start_date, '%Y-%m-%d')
                queryset = queryset.filter(timestamp__gte=start_datetime)
            except ValueError:
                pass
        
        if end_date:
            try:
                end_datetime = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
                queryset = queryset.filter(timestamp__lt=end_datetime)
            except ValueError:
                pass
        
        # Filter by user
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Search in message and details
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(message__icontains=search) | 
                Q(details__icontains=search) |
                Q(source__icontains=search)
            )
        
        # Limit results (default 100, max 1000)
        limit = min(int(self.request.query_params.get('limit', 100)), 1000)
        queryset = queryset[:limit]
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """Custom list method to add metadata"""
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response_data = {
                'results': serializer.data,
                'count': queryset.count(),
                'total_count': AppLog.objects.count(),
            }
            return self.get_paginated_response(response_data)
        
        serializer = self.get_serializer(queryset, many=True)
        response_data = {
            'results': serializer.data,
            'count': len(serializer.data),
            'total_count': AppLog.objects.count(),
        }
        return Response(response_data)


class AdminLogsFilterView(generics.ListAPIView):
    """View for filtering logs by specific criteria"""
    
    serializer_class = AppLogSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        """Get logs filtered by level"""
        level = self.kwargs.get('level')
        if level and level.upper() in dict(AppLog.LOG_LEVELS):
            return AppLog.objects.filter(level=level.upper())
        return AppLog.objects.none()


class AdminLogsStatsView(generics.GenericAPIView):
    """View for getting log statistics"""
    
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        """Get comprehensive log statistics"""
        try:
            # Get date range from query params (default: last 30 days)
            days = int(request.query_params.get('days', 30))
            end_date = timezone.now()
            start_date = end_date - timedelta(days=days)
            
            # Filter logs by date range
            logs = AppLog.objects.filter(timestamp__range=[start_date, end_date])
            
            # Count by level
            level_stats = logs.values('level').annotate(count=Count('level')).order_by('level')
            
            # Count by source
            source_stats = logs.values('source').annotate(count=Count('source')).order_by('-count')[:10]
            
            # Count by day (last 7 days)
            daily_stats = []
            for i in range(7):
                date = end_date - timedelta(days=i)
                day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
                day_end = day_start + timedelta(days=1)
                count = logs.filter(timestamp__range=[day_start, day_end]).count()
                daily_stats.append({
                    'date': day_start.strftime('%Y-%m-%d'),
                    'count': count
                })
            daily_stats.reverse()
            
            # Error rate calculation
            total_logs = logs.count()
            error_count = logs.filter(level='ERROR').count()
            warning_count = logs.filter(level='WARNING').count()
            
            error_rate = (error_count / total_logs * 100) if total_logs > 0 else 0
            warning_rate = (warning_count / total_logs * 100) if total_logs > 0 else 0
            
            # Recent activity (last 24 hours)
            last_24h = end_date - timedelta(hours=24)
            recent_logs = logs.filter(timestamp__gte=last_24h)
            
            # Top sources
            top_sources = logs.values('source').annotate(count=Count('source')).order_by('-count')[:5]
            
            stats = {
                'summary': {
                    'total_logs': total_logs,
                    'error_count': error_count,
                    'warning_count': warning_count,
                    'error_rate': round(error_rate, 2),
                    'warning_rate': round(warning_rate, 2),
                    'recent_activity_24h': recent_logs.count(),
                },
                'by_level': list(level_stats),
                'by_source': list(source_stats),
                'daily_trend': daily_stats,
                'top_sources': list(top_sources),
                'date_range': {
                    'start_date': start_date.strftime('%Y-%m-%d'),
                    'end_date': end_date.strftime('%Y-%m-%d'),
                    'days': days,
                }
            }
            
            return Response(stats, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate log statistics: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def export_logs_csv(request):
    print("export_logs_csv endpoint was called")
    level = request.query_params.get('level')
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    queryset = AppLog.objects.all()
    if level:
        queryset = queryset.filter(level=level.upper())
    if start_date:
        queryset = queryset.filter(timestamp__gte=start_date)
    if end_date:
        queryset = queryset.filter(timestamp__lte=end_date)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['timestamp', 'level', 'message', 'source', 'details', 'user'])
    for log in queryset:
        writer.writerow([
            log.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            log.level,
            log.message,
            log.source,
            log.details,
            log.user.email if log.user else ''
        ])
    response = HttpResponse(output.getvalue(), content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="logs.csv"'
    return response

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def export_logs_json(request):
    print("export_logs_json endpoint was called")
    level = request.query_params.get('level')
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    queryset = AppLog.objects.all()
    if level:
        queryset = queryset.filter(level=level.upper())
    if start_date:
        queryset = queryset.filter(timestamp__gte=start_date)
    if end_date:
        queryset = queryset.filter(timestamp__lte=end_date)
    serializer = AppLogSerializer(queryset, many=True)
    return JsonResponse(serializer.data, safe=False)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def export_logs_pdf(request):
    print("export_logs_pdf endpoint was called")
    level = request.query_params.get('level')
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    queryset = AppLog.objects.all()
    if level:
        queryset = queryset.filter(level=level.upper())
    if start_date:
        queryset = queryset.filter(timestamp__gte=start_date)
    if end_date:
        queryset = queryset.filter(timestamp__lte=end_date)
    try:
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        y = height - 40
        p.setFont("Helvetica-Bold", 14)
        p.drawString(40, y, "Application Logs Export")
        y -= 30
        p.setFont("Helvetica", 10)
        p.drawString(40, y, "Timestamp")
        p.drawString(140, y, "Level")
        p.drawString(200, y, "Message")
        p.drawString(400, y, "Source")
        y -= 18
        p.setFont("Helvetica", 9)
        for log in queryset:
            if y < 40:
                p.showPage()
                y = height - 40
            timestamp = log.timestamp.strftime('%Y-%m-%d %H:%M:%S')
            level = log.level
            message = (log.message or '')[:30]
            source = (log.source or '')[:20]
            p.drawString(40, y, timestamp)
            p.drawString(140, y, level)
            p.drawString(200, y, message)
            p.drawString(400, y, source)
            y -= 16
        p.save()
        pdf = buffer.getvalue()
        buffer.close()
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="logs.pdf"'
        return response
    except Exception as pdf_error:
        print(f"PDF generation error: {pdf_error}")
        return Response({'error': f'PDF generation failed: {str(pdf_error)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 