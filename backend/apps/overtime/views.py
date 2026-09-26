from apps.core.views import TenantModelViewSet
from .models import OvertimeRequest
from .serializers import OvertimeRequestSerializer

class OvertimeRequestViewSet(TenantModelViewSet):
    queryset = OvertimeRequest.objects.all()
    serializer_class = OvertimeRequestSerializer
