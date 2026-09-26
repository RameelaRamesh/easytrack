from rest_framework import viewsets, permissions
from .permissions import IsTenantUser

class TenantModelViewSet(viewsets.ModelViewSet):
    """
    A base ViewSet for tenant-aware models that enforces:
    - User authentication and tenant association
    - Automatic queryset scoping to the user's organization
    - Automatic fields assignment on creation/updates
    """
    permission_classes = [IsTenantUser]

    def get_queryset(self):
        # Fallback to empty queryset if not authenticated or no organization
        if not self.request.user or not self.request.user.is_authenticated:
            return self.queryset.none()
            
        org = getattr(self.request.user, 'organization', None)
        if not org:
            return self.queryset.none()
            
        # Scope queryset to user's organization
        return self.queryset.filter(organization=org)

    def perform_create(self, serializer):
        # Automatically assign organization and creator
        serializer.save(
            organization=self.request.user.organization,
            created_by=self.request.user
        )

    def perform_update(self, serializer):
        # Automatically assign updater
        serializer.save(updated_by=self.request.user)
