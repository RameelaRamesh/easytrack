from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from apps.core.views import TenantModelViewSet
from .models import ProductivityMetric, VolumeStatusLog, ActivityCheckLog
from .serializers import ProductivityMetricSerializer, VolumeStatusLogSerializer, ActivityCheckLogSerializer
from apps.notifications.models import Notification
from apps.escalations.models import Escalation

class ProductivityMetricViewSet(TenantModelViewSet):
    queryset = ProductivityMetric.objects.all()
    serializer_class = ProductivityMetricSerializer

class VolumeStatusLogViewSet(TenantModelViewSet):
    queryset = VolumeStatusLog.objects.all().order_by('-logged_at')
    serializer_class = VolumeStatusLogSerializer

    @action(detail=False, methods=['post'], url_path='toggle')
    def toggle_volume_status(self, request):
        user = request.user
        new_status = request.data.get('status', 'available') # 'available' or 'empty'
        notes = request.data.get('notes', '')

        org = getattr(user, 'organization', None)
        user_display = f"{user.first_name} {user.last_name}".strip() or user.username

        # Close any open empty volume logs if switching to available
        if new_status == 'available':
            VolumeStatusLog.objects.filter(user=user, status='empty', resolved_at__isnull=True).update(resolved_at=timezone.now())
            log_entry = VolumeStatusLog.objects.create(
                user=user,
                organization=org,
                status='available',
                notes=notes,
                created_by=user
            )
            return Response({'status': 'available', 'message': 'Volume status updated to Available.'}, status=status.HTTP_200_OK)
        else:
            # Setting to Empty
            log_entry = VolumeStatusLog.objects.create(
                user=user,
                organization=org,
                status='empty',
                notes=notes,
                created_by=user
            )

            # Broadcast notification to CEO, Admin, TL
            Notification.objects.create(
                organization=org,
                title=f"🔴 Volume Empty Alert: {user_display}",
                desc=f"Employee {user_display} (@{user.username}) reported NO VOLUME available at {timezone.now().strftime('%H:%M:%S')}.",
                type="warning",
                unread=True,
                details={
                    "event": "volume_empty",
                    "user_id": user.id,
                    "user_name": user_display,
                    "target_roles": ["admin", "ceo", "tl", "operations_head"]
                }
            )

            return Response({'status': 'empty', 'message': 'Volume status set to Empty. Higher officials notified.'}, status=status.HTTP_200_OK)

class ActivityCheckLogViewSet(TenantModelViewSet):
    queryset = ActivityCheckLog.objects.all().order_by('-timestamp')
    serializer_class = ActivityCheckLogSerializer

    @action(detail=False, methods=['post'], url_path='record')
    def record_activity_check(self, request):
        user = request.user
        attempt = request.data.get('attempt_number', 1)
        interval = request.data.get('interval_minutes', 2)
        responded = request.data.get('responded', False)
        escalated = request.data.get('escalated', False)
        org = getattr(user, 'organization', None)

        user_display = f"{user.first_name} {user.last_name}".strip() or user.username

        check_log = ActivityCheckLog.objects.create(
            user=user,
            organization=org,
            attempt_number=attempt,
            interval_minutes=interval,
            responded=responded,
            escalated=escalated,
            created_by=user,
            details=request.data
        )

        if escalated or (not responded and attempt >= 3):
            # Trigger Critical Alert to CEO, Admin, TL
            Notification.objects.create(
                organization=org,
                title=f"🚨 CRITICAL ALERT: Unresponsive Employee ({user_display})",
                desc=f"Employee {user_display} (@{user.username}) has failed 3 consecutive activity checks ({interval}-min interval). Session paused.",
                type="critical",
                unread=True,
                details={
                    "event": "employee_unresponsive",
                    "user_id": user.id,
                    "user_name": user_display,
                    "attempts_missed": 3,
                    "target_roles": ["admin", "ceo", "tl", "operations_head"]
                }
            )

            # Create Escalation record
            Escalation.objects.create(
                organization=org,
                name=f"Inactivity Escalation: {user_display}",
                status="Active Escalation",
                created_by=user,
                details={
                    "employee_id": user.id,
                    "employee_name": user_display,
                    "attempts": 3,
                    "interval_minutes": interval,
                    "reason": "Failed 3 consecutive activity verification checks"
                }
            )

        return Response({'status': 'recorded', 'log_id': check_log.id}, status=status.HTTP_201_CREATED)

