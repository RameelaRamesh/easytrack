import datetime
from django.db import models
from apps.core.views import TenantModelViewSet
from apps.core.permissions import IsTenantUser, IsHR, IsTL
from .models import LeaveRequest
from .serializers import LeaveRequestSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

class LeaveRequestViewSet(TenantModelViewSet):
    queryset = LeaveRequest.objects.all().order_by('-created_at')
    serializer_class = LeaveRequestSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        
        # Scoping:
        # HR / CEO / Admin / Operations Head can see all.
        # TL can see their reporting employees' leaves and their own leaves.
        # Employee can only see their own leaves.
        if user.role in ['admin', 'ceo', 'operations_head', 'hr'] or getattr(user, 'is_owner', False):
            return qs
        elif user.role == 'tl':
            return qs.filter(models.Q(user__employee_profile__manager=user) | models.Q(user=user))
        else:
            return qs.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user,
            organization=self.request.user.organization,
            created_by=self.request.user
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.status == 'approved':
            self._sync_approved_leave(instance)

    def _sync_approved_leave(self, leave):
        # Deduct leave balance
        employee = getattr(leave.user, 'employee_profile', None)
        if employee:
            duration = (leave.end_date - leave.start_date).days + 1
            employee.leave_balance = max(0, employee.leave_balance - duration)
            employee.save()

        # Update or create Attendance records for leave dates so higher officials & employee see status='leave'
        try:
            from apps.attendance.models import Attendance
            curr_date = leave.start_date
            while curr_date <= leave.end_date:
                Attendance.objects.update_or_create(
                    user=leave.user,
                    date=curr_date,
                    defaults={
                        'organization': leave.organization,
                        'status': 'leave',
                        'shift': 'On Leave'
                    }
                )
                curr_date += datetime.timedelta(days=1)
        except Exception as e:
            print("Error syncing attendance for approved leave:", e)

    @action(detail=True, methods=['post'], url_path='recommend')
    def recommend(self, request, pk=None):
        leave = self.get_object()
        if request.user.role not in ['tl', 'operations_head', 'ceo', 'admin', 'hr']:
            return Response({"error": "Only TLs, HR, or Operations Heads can recommend leaves."}, status=status.HTTP_403_FORBIDDEN)
            
        leave.status = 'recommended'
        leave.reviewed_by = request.user
        leave.review_comments = request.data.get('comments', '')
        leave.save()
        return Response(self.get_serializer(leave).data)

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        leave = self.get_object()
        if request.user.role not in ['hr', 'ceo', 'admin', 'operations_head']:
            return Response({"error": "Only authorized higher officials can approve leaves."}, status=status.HTTP_403_FORBIDDEN)
            
        leave.status = 'approved'
        leave.reviewed_by = request.user
        leave.review_comments = request.data.get('comments', '')
        leave.save()
        
        self._sync_approved_leave(leave)
            
        return Response(self.get_serializer(leave).data)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        leave = self.get_object()
        if request.user.role not in ['tl', 'hr', 'operations_head', 'ceo', 'admin']:
            return Response({"error": "Unauthorized to review leaves."}, status=status.HTTP_403_FORBIDDEN)
            
        leave.status = 'rejected'
        leave.reviewed_by = request.user
        leave.review_comments = request.data.get('comments', '')
        leave.save()
        return Response(self.get_serializer(leave).data)

