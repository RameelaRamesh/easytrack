from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.core.permissions import IsTenantUser, IsCEO
from .models import AuditLog
from .serializers import AuditLogSerializer
from django.db.models import Q

class AuditLogViewSet(viewsets.ModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [IsTenantUser]

    def get_queryset(self):
        if not self.request.user.is_authenticated or not self.request.user.organization:
            return AuditLog.objects.none()
        
        user = self.request.user
        qs = AuditLog.objects.filter(organization=user.organization).order_by('-timestamp')
        
        # Privacy & Role-based Scoping:
        if user.role == 'employee':
            # Employee only sees logs where they are the actor or mentioned in details (e.g. issued access/credentials)
            username = user.username
            fullname = user.get_full_name() or username
            qs = qs.filter(
                Q(actor=user) | 
                Q(details__icontains=username) | 
                Q(details__icontains=fullname)
            )
        elif user.role == 'tl':
            # TL sees logs of themselves or their direct reporting team members
            team_users = [user.id]
            if hasattr(user, 'employee_profile'):
                reports = user.employee_profile.direct_reports.values_list('user_id', flat=True)
                team_users.extend(list(reports))
            qs = qs.filter(
                Q(actor_id__in=team_users) |
                Q(actor=user) |
                Q(details__icontains=user.username)
            )
        # CEO, Operations Head, HR see all organization audit logs

        # Filtering parameters
        search = self.request.query_params.get('search', '').strip()
        role = self.request.query_params.get('role', '').strip()
        category = self.request.query_params.get('category', '').strip()
        start_date = self.request.query_params.get('start_date', '').strip()
        end_date = self.request.query_params.get('end_date', '').strip()

        if search:
            qs = qs.filter(
                Q(action__icontains=search) |
                Q(details__icontains=search) |
                Q(actor_name__icontains=search) |
                Q(actor__first_name__icontains=search) |
                Q(actor__last_name__icontains=search) |
                Q(actor__username__icontains=search) |
                Q(category__icontains=search)
            )

        if role and role.lower() != 'all':
            qs = qs.filter(Q(actor_role__iexact=role) | Q(actor__role__iexact=role))

        if category and category.lower() != 'all':
            qs = qs.filter(category__iexact=category)

        if start_date:
            qs = qs.filter(timestamp__gte=start_date)

        if end_date:
            qs = qs.filter(timestamp__lte=end_date)

        return qs

    @action(detail=True, methods=['post'])
    def revert(self, request, pk=None):
        log = self.get_object()
        if log.is_reverted:
            return Response({'detail': 'Action has already been reverted.'}, status=status.HTTP_400_BAD_REQUEST)
        
        log.is_reverted = True
        log.save()

        # Log the revert action as a new audit log
        AuditLog.objects.create(
            organization=log.organization,
            actor=request.user,
            actor_name=f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username,
            actor_role=getattr(request.user, 'role', 'CEO'),
            action=f"REVERT: {log.action}",
            category=log.category,
            details=f"Reverted audit log action #{log.id} ({log.action}): {log.details}",
            is_revertible=False
        )

        return Response({'status': 'Action reverted successfully'}, status=status.HTTP_200_OK)
