from apps.core.views import TenantModelViewSet
from .models import Escalation
from .serializers import EscalationSerializer

class EscalationViewSet(TenantModelViewSet):
    queryset = Escalation.objects.all()
    serializer_class = EscalationSerializer
