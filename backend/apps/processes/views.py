from apps.core.views import TenantModelViewSet
from apps.core.permissions import IsTenantUser, IsOperationsHead
from .models import Process
from .serializers import ProcessSerializer

class ProcessViewSet(TenantModelViewSet):
    queryset = Process.objects.all()
    serializer_class = ProcessSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        client_id = self.request.query_params.get('client')
        if client_id:
            qs = qs.filter(client_id=client_id)
        return qs

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTenantUser(), IsOperationsHead()]
        return [IsTenantUser()]
