from apps.core.views import TenantModelViewSet
from .models import OperationalTarget
from .serializers import OperationalTargetSerializer

class OperationalTargetViewSet(TenantModelViewSet):
    queryset = OperationalTarget.objects.all()
    serializer_class = OperationalTargetSerializer
