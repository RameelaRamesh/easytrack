from apps.billing.views import BillingWorkViewSet
from apps.billing.models import BillingWork
from apps.billing.serializers import BillingWorkSerializer

class WorkQueueViewSet(BillingWorkViewSet):
    """
    Exposes the active operational queue view for Team Leads and Employees.
    """
    queryset = BillingWork.objects.all()
    serializer_class = BillingWorkSerializer
