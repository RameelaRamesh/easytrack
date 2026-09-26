from apps.core.views import TenantModelViewSet
from .models import ProductivityMetric
from .serializers import ProductivityMetricSerializer

class ProductivityMetricViewSet(TenantModelViewSet):
    queryset = ProductivityMetric.objects.all()
    serializer_class = ProductivityMetricSerializer
