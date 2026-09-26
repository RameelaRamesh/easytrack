from apps.core.views import TenantModelViewSet
from .models import JobOpening
from .serializers import JobOpeningSerializer

class JobOpeningViewSet(TenantModelViewSet):
    queryset = JobOpening.objects.all()
    serializer_class = JobOpeningSerializer
