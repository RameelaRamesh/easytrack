from apps.core.views import TenantModelViewSet
from .models import IncentiveRecord
from .serializers import IncentiveRecordSerializer

class IncentiveRecordViewSet(TenantModelViewSet):
    queryset = IncentiveRecord.objects.all()
    serializer_class = IncentiveRecordSerializer
