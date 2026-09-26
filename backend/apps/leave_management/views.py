from apps.core.views import TenantModelViewSet
from apps.core.permissions import IsTenantUser, IsHR, IsTL
from .models import LeaveRequest
from .serializers import LeaveRequestSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

class LeaveRequestViewSet(TenantModelViewSet):
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        
        # Scoping:
        # HR / CEO can see all.
        # TL can see their reporting employees' leaves.
        # Employee can only see their own leaves.
        if user.role in ['admin', 'ceo', 'operations_head', 'hr'] or getattr(user, 'is_owner', False):
            return qs
        elif user.role == 'tl':
            return qs.filter(user__employee_profile__manager=user)
        else:
            return qs.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user,
            organization=self.request.user.organization,
            created_by=self.request.user
        )

    @action(detail=True, methods=['post'], url_path='recommend')
    def recommend(self, request, pk=None):
        leave = self.get_object()
        if request.user.role not in ['tl', 'operations_head', 'ceo']:
            return Response({"error": "Only TLs or Operations Heads can recommend leaves."}, status=status.HTTP_403_FORBIDDEN)
            
        leave.status = 'recommended'
        leave.reviewed_by = request.user
        leave.review_comments = request.data.get('comments', '')
        leave.save()
        return Response(self.get_serializer(leave).data)

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        leave = self.get_object()
        if request.user.role not in ['hr', 'ceo']:
            return Response({"error": "Only HR or CEO can approve leaves."}, status=status.HTTP_430_FORBIDDEN)
            
        leave.status = 'approved'
        leave.reviewed_by = request.user
        leave.review_comments = request.data.get('comments', '')
        leave.save()
        
        # Deduct leave balance
        employee = getattr(leave.user, 'employee_profile', None)
        if employee:
            duration = (leave.end_date - leave.start_date).days + 1
            employee.leave_balance = max(0, employee.leave_balance - duration)
            employee.save()
            
        return Response(self.get_serializer(leave).data)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        leave = self.get_object()
        if request.user.role not in ['tl', 'hr', 'operations_head', 'ceo']:
            return Response({"error": "Unauthorized to review leaves."}, status=status.HTTP_403_FORBIDDEN)
            
        leave.status = 'rejected'
        leave.reviewed_by = request.user
        leave.review_comments = request.data.get('comments', '')
        leave.save()
        return Response(self.get_serializer(leave).data)
