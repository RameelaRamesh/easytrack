from apps.core.views import TenantModelViewSet
from .models import ManagementReport
from .serializers import ManagementReportSerializer

class ManagementReportViewSet(TenantModelViewSet):
    queryset = ManagementReport.objects.all()
    serializer_class = ManagementReportSerializer
