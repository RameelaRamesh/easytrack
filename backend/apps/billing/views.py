from apps.core.views import TenantModelViewSet
from apps.core.permissions import IsTenantUser
from .models import BillingWork
from .serializers import BillingWorkSerializer

class BillingWorkViewSet(TenantModelViewSet):
    queryset = BillingWork.objects.all()
    serializer_class = BillingWorkSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        
        # Scoping based on roles:
        # CEO / Operations Head can view all.
        # TL can see work assigned to their team or where they are assigned as TL.
        # Employee can only see work assigned directly to them.
        if user.role in ['admin', 'ceo', 'operations_head', 'hr'] or getattr(user, 'is_owner', False):
            pass
        elif user.role == 'tl':
            qs = qs.filter(assigned_tl=user)
        else:
            qs = qs.filter(assigned_employee=user)
            
        # Filters
        client_id = self.request.query_params.get('client')
        process_id = self.request.query_params.get('process')
        status = self.request.query_params.get('status')
        priority = self.request.query_params.get('priority')
        
        if client_id:
            qs = qs.filter(client_id=client_id)
        if process_id:
            qs = qs.filter(process_id=process_id)
        if status:
            qs = qs.filter(status=status)
        if priority:
            qs = qs.filter(priority=priority)
            
        return qs
