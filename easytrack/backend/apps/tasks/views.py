from apps.core.views import TenantModelViewSet
from .models import Task
from .serializers import TaskSerializer

class TaskViewSet(TenantModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        assignee_param = self.request.query_params.get('assignee')
        
        if status_param:
            qs = qs.filter(status=status_param)
        if assignee_param:
            qs = qs.filter(assignee_id=assignee_param)
            
        return qs
