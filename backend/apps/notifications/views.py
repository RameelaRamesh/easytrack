from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.core.views import TenantModelViewSet
from .models import Notification, Announcement
from .serializers import NotificationSerializer, AnnouncementSerializer

class NotificationViewSet(TenantModelViewSet):
    queryset = Notification.objects.all().order_by('-created_at')
    serializer_class = NotificationSerializer

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        qs = self.filter_queryset(self.get_queryset())
        qs.update(unread=False)
        return Response({'status': 'marked all as read'}, status=status.HTTP_200_OK)

class AnnouncementViewSet(TenantModelViewSet):
    queryset = Announcement.objects.all().order_by('-created_at')
    serializer_class = AnnouncementSerializer

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Announcement.objects.none()

        org = getattr(user, 'organization', None)
        user_role = getattr(user, 'role', 'employee')
        user_team = getattr(user, 'team', '') or ''

        base_qs = Announcement.objects.all().order_by('-created_at')
        if org:
            candidate_qs = base_qs.filter(Q(scope='public') | Q(organization=org) | Q(created_by=user))
        else:
            candidate_qs = base_qs.filter(Q(scope='public') | Q(created_by=user))

        matching_ids = []
        for ann in candidate_qs:
            # 1. Public or author
            if ann.scope == 'public' or (ann.created_by_id and ann.created_by_id == user.id):
                matching_ids.append(ann.id)
                continue
            # 2. Organization wide or default All Employees
            if ann.scope in ['organization', 'all'] or ann.target in ['All Employees', 'Organization Wide']:
                matching_ids.append(ann.id)
                continue
            # 3. Employees only
            if ann.scope == 'employees_only' and user_role == 'employee':
                matching_ids.append(ann.id)
                continue
            # 4. Specific roles
            if ann.scope == 'specific_roles':
                roles = ann.target_roles
                if isinstance(roles, str):
                    roles = [r.strip() for r in roles.split(',')]
                if isinstance(roles, list) and user_role in roles:
                    matching_ids.append(ann.id)
                    continue
            # 5. Specific team
            if ann.scope == 'specific_team':
                if ann.target_team and ann.target_team.lower() in user_team.lower():
                    matching_ids.append(ann.id)
                    continue
            # Fallback for old target text
            if ann.target and (user_role.upper() in ann.target.upper() or 'ALL' in ann.target.upper()):
                matching_ids.append(ann.id)

        return Announcement.objects.filter(id__in=matching_ids).order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user
        author_name = f"{user.first_name} {user.last_name}".strip() if (user.first_name or user.last_name) else user.username
        serializer.save(
            organization=getattr(user, 'organization', None),
            created_by=user,
            author=author_name,
            author_role=getattr(user, 'role', '')
        )

