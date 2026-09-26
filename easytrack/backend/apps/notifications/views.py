from apps.core.views import TenantModelViewSet
from .models import Notification
from .serializers import NotificationSerializer

class NotificationViewSet(TenantModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
