from apps.core.views import TenantModelViewSet
from .models import SalarySlip
from .serializers import SalarySlipSerializer

class SalarySlipViewSet(TenantModelViewSet):
    queryset = SalarySlip.objects.all()
    serializer_class = SalarySlipSerializer
