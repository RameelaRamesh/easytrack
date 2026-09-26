from apps.core.views import TenantModelViewSet
from apps.core.permissions import IsTenantUser, IsOperationsHead
from .models import Client
from .serializers import ClientSerializer

class ClientViewSet(TenantModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        
        # Filter based on role if needed
        # CEO / Operations Head see everything.
        # TL sees their assigned clients.
        # Employee sees their assigned client.
        if user.role in ['ceo', 'operations_head', 'hr']:
            return qs
        elif user.role == 'tl':
            return qs.filter(tl=user)
        else:
            # For employees, filter based on work queue assignments
            return qs.filter(billingwork_records__assigned_employee=user).distinct()

    def get_permissions(self):
        # Only operations head or CEO can create/update clients
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTenantUser(), IsOperationsHead()]
        return [IsTenantUser()]
