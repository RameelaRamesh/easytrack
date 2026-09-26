from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Organization
from .serializers import OrganizationSerializer
from apps.core.permissions import IsTenantUser, IsCEO

class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsTenantUser]

    def get_queryset(self):
        # Users can only see their own organization
        if not self.request.user.is_authenticated or not self.request.user.organization:
            return Organization.objects.none()
        return Organization.objects.filter(id=self.request.user.organization.id)

    def get_permissions(self):
        # Only CEO can modify organization details
        if self.action in ['update', 'partial_update', 'destroy', 'org_settings']:
            return [IsTenantUser(), IsCEO()]
        return [IsTenantUser()]

    @action(detail=False, methods=['get', 'put', 'patch'], url_path='settings')
    def org_settings(self, request):
        """
        Endpoint to retrieve and update organization specific configurations/settings.
        """
        org = request.user.organization
        if not org:
            return Response({"error": "No organization associated with this account."}, status=status.HTTP_404_NOT_FOUND)
            
        if request.method == 'GET':
            serializer = self.get_serializer(org)
            return Response(serializer.data)
            
        serializer = self.get_serializer(org, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
