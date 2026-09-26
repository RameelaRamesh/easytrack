from apps.core.views import TenantModelViewSet
from .models import OnboardingChecklist
from .serializers import OnboardingChecklistSerializer

class OnboardingChecklistViewSet(TenantModelViewSet):
    queryset = OnboardingChecklist.objects.all()
    serializer_class = OnboardingChecklistSerializer
