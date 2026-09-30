from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from apps.core.views import TenantModelViewSet
from .models import Task
from .serializers import TaskSerializer
from apps.notifications.models import Notification

class TaskViewSet(TenantModelViewSet):
    queryset = Task.objects.all().order_by('-created_at')
    serializer_class = TaskSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        assignee_param = self.request.query_params.get('assignee')
        project_param = self.request.query_params.get('project')
        flow_source_param = self.request.query_params.get('flow_source')
        
        if status_param:
            qs = qs.filter(status=status_param)
        if assignee_param:
            qs = qs.filter(assignee_id=assignee_param)
        if project_param:
            qs = qs.filter(project_id=project_param)
        if flow_source_param:
            qs = qs.filter(flow_source=flow_source_param)
            
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        org = getattr(user, 'organization', None)
        
        # Auto-generate key if not given
        key = self.request.data.get('key')
        if not key:
            total_count = Task.objects.count() + 1
            key = f"TSK-{total_count:03d}"
            # Guarantee uniqueness if key already exists
            while Task.objects.filter(key=key).exists():
                total_count += 1
                key = f"TSK-{total_count:03d}"

        initial_history = [{
            'action': 'Created',
            'actor': user.get_full_name() or user.username,
            'timestamp': timezone.now().isoformat(),
            'details': f"Task created with status '{serializer.validated_data.get('status', 'todo')}'."
        }]

        task_instance = serializer.save(
            organization=org,
            reporter=user,
            key=key,
            activity_history=initial_history
        )

        assignee = task_instance.assignee or task_instance.team_lead
        if assignee:
            try:
                Notification.objects.create(
                    organization=org,
                    created_by=user,
                    title=f"Task Assigned: {task_instance.key}",
                    desc=f"You have been assigned task: {task_instance.title}",
                    type="task_assignment",
                    details={
                        "task_id": task_instance.id,
                        "task_key": task_instance.key,
                        "assignee_id": assignee.id,
                        "assignee_role": getattr(assignee, 'role', '')
                    }
                )
            except Exception:
                pass

    def perform_update(self, serializer):
        user = self.request.user
        instance = serializer.instance
        old_status = instance.status
        old_assignee = instance.assignee
        new_status = serializer.validated_data.get('status', old_status)
        new_assignee = serializer.validated_data.get('assignee', old_assignee)

        history = list(instance.activity_history or [])
        if old_status != new_status:
            history.append({
                'action': 'Status Changed',
                'actor': user.get_full_name() or user.username,
                'timestamp': timezone.now().isoformat(),
                'details': f"Status transitioned from '{old_status}' to '{new_status}'."
            })

        updated_task = serializer.save(activity_history=history)

        if new_assignee and new_assignee != old_assignee:
            try:
                org = getattr(user, 'organization', None)
                Notification.objects.create(
                    organization=org,
                    created_by=user,
                    title=f"Task Assigned: {updated_task.key}",
                    desc=f"You have been assigned task: {updated_task.title}",
                    type="task_assignment",
                    details={
                        "task_id": updated_task.id,
                        "task_key": updated_task.key,
                        "assignee_id": new_assignee.id,
                        "assignee_role": getattr(new_assignee, 'role', '')
                    }
                )
            except Exception:
                pass

    @action(detail=True, methods=['post'], url_path='add-comment')
    def add_comment(self, request, pk=None):
        task = self.get_object()
        text = request.data.get('text', '').strip()
        if not text:
            return Response({"error": "Comment text cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        comments = list(task.comments or [])
        user = request.user
        new_comment = {
            'id': len(comments) + 1,
            'author': user.username,
            'author_name': user.get_full_name() or user.username,
            'text': text,
            'timestamp': timezone.now().isoformat()
        }
        comments.append(new_comment)
        task.comments = comments

        history = list(task.activity_history or [])
        history.append({
            'action': 'Comment Added',
            'actor': user.get_full_name() or user.username,
            'timestamp': timezone.now().isoformat(),
            'details': f"Added comment: {text[:50]}..."
        })
        task.activity_history = history
        task.save()

        return Response(TaskSerializer(task).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='request-changes')
    def request_changes(self, request, pk=None):
        task = self.get_object()
        notes = request.data.get('review_notes', '').strip()
        user = request.user

        task.status = 'changes_requested'
        task.review_notes = notes
        
        history = list(task.activity_history or [])
        history.append({
            'action': 'Changes Requested',
            'actor': user.get_full_name() or user.username,
            'timestamp': timezone.now().isoformat(),
            'details': f"Reviewer requested changes. Notes: {notes[:80] if notes else 'None'}"
        })
        task.activity_history = history
        task.save()

        return Response(TaskSerializer(task).data, status=status.HTTP_200_OK)
