from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import models
from apps.core.views import TenantModelViewSet
from apps.core.permissions import IsTenantUser, IsHR, IsCEO
from .models import Employee
from .serializers import EmployeeSerializer, EmployeeBasicSerializer

class EmployeeViewSet(TenantModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        
        # Superuser bypass
        if user.is_superuser:
            return qs

        # Filters
        department = self.request.query_params.get('department')
        status_param = self.request.query_params.get('status')
        manager_id = self.request.query_params.get('manager')
        search_query = self.request.query_params.get('search')

        if department:
            qs = qs.filter(department=department)
        if status_param:
            qs = qs.filter(status=status_param)
        if manager_id:
            qs = qs.filter(manager_id=manager_id)
        if search_query:
            qs = qs.filter(
                models.Q(employee_id__icontains=search_query) |
                models.Q(user__first_name__icontains=search_query) |
                models.Q(user__last_name__icontains=search_query) |
                models.Q(user__username__icontains=search_query)
            )

        # Scoping based on role:
        # Admin / CEO / HR / Operations Head can access employee profiles in their organization.
        # TL and regular employees do not have employee directory access.
        if user.role in ['admin', 'ceo', 'hr', 'operations_head'] or getattr(user, 'is_owner', False):
            if self.request.query_params.get('exclude_ceo') == 'true':
                qs = qs.exclude(user__role__in=['ceo', 'admin'])
            return qs
        else:
            return qs.filter(user=user)

    def get_permissions(self):
        return [IsTenantUser()]

    @action(detail=False, methods=['get'], url_path='search', serializer_class=EmployeeBasicSerializer)
    def search_employees(self, request):
        """
        Public endpoint for search autocomplete (e.g. chat participant lookup).
        Returns minimal, non-sensitive profile details.
        """
        qs = super().get_queryset() # All org employees
        search_query = request.query_params.get('query', '')
        
        if search_query:
            from django.db.models import Q
            qs = qs.filter(
                Q(employee_id__icontains=search_query) |
                Q(user__first_name__icontains=search_query) |
                Q(user__last_name__icontains=search_query)
            )
        
        # Cap results at 20
        serializer = self.get_serializer(qs[:20], many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='me', serializer_class=EmployeeSerializer)
    def my_profile(self, request):
        """
        Retrieve details of the currently logged-in employee profile.
        """
        try:
            employee = Employee.objects.get(user=request.user)
            serializer = self.get_serializer(employee)
            return Response(serializer.data)
        except Employee.DoesNotExist:
            return Response({"error": "No profile exists for this account."}, status=status.HTTP_404_NOT_FOUND)
