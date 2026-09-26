from rest_framework import viewsets, permissions
from apps.core.permissions import IsTenantUser, IsCEO
from .models import AuditLog
from .serializers import AuditLogSerializer

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [IsTenantUser, IsCEO]

    def get_queryset(self):
        # CEO can see audit logs for their organization
        if not self.request.user.is_authenticated or not self.request.user.organization:
            return AuditLog.objects.none()
        return self.queryset.filter(organization=self.request.user.organization)
