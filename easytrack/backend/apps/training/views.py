from apps.core.views import TenantModelViewSet
from .models import TrainingProgram
from .serializers import TrainingProgramSerializer

class TrainingProgramViewSet(TenantModelViewSet):
    queryset = TrainingProgram.objects.all()
    serializer_class = TrainingProgramSerializer
