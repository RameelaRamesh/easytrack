from apps.core.views import TenantModelViewSet
from .models import PerformanceEvaluation
from .serializers import PerformanceEvaluationSerializer

class PerformanceEvaluationViewSet(TenantModelViewSet):
    queryset = PerformanceEvaluation.objects.all()
    serializer_class = PerformanceEvaluationSerializer
