from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from apps.core.views import TenantModelViewSet
from .models import Attendance
from .serializers import AttendanceSerializer
from django.utils import timezone
import datetime

class AttendanceViewSet(TenantModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        
        # TLs can see their reporting team's attendance. Employees only see their own.
        if user.role in ['ceo', 'operations_head', 'hr']:
            return qs
        elif user.role == 'tl':
            return qs.filter(user__employee_profile__manager=user)
        else:
            return qs.filter(user=user)

    @action(detail=False, methods=['get'], url_path='today')
    def today_status(self, request):
        today = timezone.localdate()
        try:
            record = Attendance.objects.get(user=request.user, date=today)
            serializer = self.get_serializer(record)
            return Response(serializer.data)
        except Attendance.DoesNotExist:
            return Response({"status": "not_checked_in"})

    @action(detail=False, methods=['post'], url_path='check-in')
    def check_in(self, request):
        today = timezone.localdate()
        now = timezone.now()
        
        record, created = Attendance.objects.get_or_create(
            user=request.user,
            date=today,
            defaults={
                'organization': request.user.organization,
                'check_in': now,
                'status': 'working'
            }
        )
        
        if not created:
            return Response({"error": "Already checked in today."}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response(self.get_serializer(record).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='start-break')
    def start_break(self, request):
        today = timezone.localdate()
        now = timezone.now()
        
        try:
            record = Attendance.objects.get(user=request.user, date=today)
            if record.status != 'working':
                return Response({"error": "Can only start break while working."}, status=status.HTTP_400_BAD_REQUEST)
                
            record.status = 'on_break'
            record.break_start = now
            record.save()
            return Response(self.get_serializer(record).data)
        except Attendance.DoesNotExist:
            return Response({"error": "Must check in first."}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='end-break')
    def end_break(self, request):
        today = timezone.localdate()
        now = timezone.now()
        
        try:
            record = Attendance.objects.get(user=request.user, date=today)
            if record.status != 'on_break' or not record.break_start:
                return Response({"error": "Not currently on break."}, status=status.HTTP_400_BAD_REQUEST)
                
            duration = int((now - record.break_start).total_seconds())
            record.total_break_seconds += duration
            record.status = 'working'
            record.break_start = None
            record.save()
            return Response(self.get_serializer(record).data)
        except Attendance.DoesNotExist:
            return Response({"error": "Must check in first."}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='check-out')
    def check_out(self, request):
        today = timezone.localdate()
        now = timezone.now()
        
        try:
            record = Attendance.objects.get(user=request.user, date=today)
            if record.status not in ['working', 'on_break']:
                return Response({"error": "Not working/on break or already checked out."}, status=status.HTTP_400_BAD_REQUEST)
                
            # If checking out during break, complete the break first
            if record.status == 'on_break' and record.break_start:
                duration = int((now - record.break_start).total_seconds())
                record.total_break_seconds += duration
                record.break_start = None
                
            record.check_out = now
            record.status = 'checked_out'
            
            # Calculate working seconds
            if record.check_in:
                total_duration = int((now - record.check_in).total_seconds())
                working_duration = total_duration - record.total_break_seconds
                record.total_working_seconds = max(0, working_duration)
                
                # Check for overtime (e.g. over 8 hours = 28800 seconds)
                if record.total_working_seconds > 28800:
                    record.overtime_seconds = record.total_working_seconds - 28800
                    
            record.save()
            return Response(self.get_serializer(record).data)
        except Attendance.DoesNotExist:
            return Response({"error": "Must check in first."}, status=status.HTTP_400_BAD_REQUEST)
