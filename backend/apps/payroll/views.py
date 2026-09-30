from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from apps.core.views import TenantModelViewSet
from apps.employees.models import Employee
from .models import SalarySlip
from .serializers import SalarySlipSerializer

class SalarySlipViewSet(TenantModelViewSet):
    queryset = SalarySlip.objects.all()
    serializer_class = SalarySlipSerializer

    def get_queryset(self):
        user = self.request.user
        period = self.request.query_params.get('period')

        if not user or not user.is_authenticated:
            return SalarySlip.objects.none()

        org = getattr(user, 'organization', None)
        if getattr(user, 'role', '') in ['ceo', 'admin'] or getattr(user, 'is_superuser', False):
            qs = SalarySlip.objects.all()
            if org and SalarySlip.objects.filter(organization=org).exists():
                qs = qs.filter(organization=org)
        else:
            if org:
                qs = SalarySlip.objects.filter(organization=org)
            else:
                qs = SalarySlip.objects.all()

        if period:
            qs = qs.filter(period=period)
        return qs.order_by('-created_at')

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        user_role = getattr(request.user, 'role', '')

        data = request.data.copy()
        
        # Security: HR is not allowed to edit base_salary. Only CEO/Admin can set/edit base_salary.
        if user_role not in ['ceo', 'admin'] and 'base_salary' in data:
            data.pop('base_salary', None)

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # If CEO/Admin edited base_salary, sync it back to the Employee model profile
        if user_role in ['ceo', 'admin'] and 'base_salary' in request.data and instance.employee:
            new_base = request.data['base_salary']
            try:
                emp = instance.employee
                emp.base_salary = new_base
                emp.save(update_fields=['base_salary'])
            except Exception as e:
                print("Failed to sync base_salary to Employee profile:", e)

        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def generate_payroll(self, request):
        """HR action: Generate payroll records for active employees for a given period."""
        period = request.data.get('period', '2026-09')
        
        org = getattr(request.user, 'organization', None)
        emp_qs = Employee.objects.all()
        if org:
            emp_qs = emp_qs.filter(organization=org)
        
        emp_qs = emp_qs.filter(status='active').exclude(user__role='ceo')

        created_or_updated = []
        for emp in emp_qs:
            slip, created = SalarySlip.objects.get_or_create(
                organization=emp.organization,
                employee=emp,
                period=period,
                defaults={
                    'name': f"Payslip - {emp.employee_id} ({period})",
                    'base_salary': emp.base_salary or 0.00,
                    'status': 'Draft',
                    'created_by': request.user,
                    'updated_by': request.user
                }
            )
            if not created:
                slip.base_salary = emp.base_salary or 0.00
                if slip.status in ['Draft', 'Rejected by CEO']:
                    slip.status = 'Draft'
                slip.save()
            created_or_updated.append(slip)

        serializer = self.get_serializer(created_or_updated, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def lock_payment(self, request):
        """HR action: Lock payment and submit payroll batch to CEO for approval."""
        period = request.data.get('period', '2026-09')
        qs = self.get_queryset().filter(period=period).exclude(status__in=['Approved by CEO', 'Disbursed'])
        updated_count = qs.update(status='Locked by HR', updated_by=request.user)
        return Response({'message': f'{updated_count} payroll records locked by HR and sent to CEO.', 'period': period}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def submit_to_ceo(self, request):
        """Alias for lock_payment."""
        return self.lock_payment(request)

    @action(detail=False, methods=['post'])
    def approve(self, request):
        """CEO action: Approve payroll batch for a period."""
        if request.user.role not in ['ceo', 'admin']:
            return Response({'detail': 'Only CEO / Admin can approve payroll batches.'}, status=status.HTTP_403_FORBIDDEN)
        
        period = request.data.get('period', '2026-09')
        remarks = request.data.get('remarks', 'Approved by CEO')
        
        qs = self.get_queryset().filter(period=period).exclude(status='Disbursed')
        updated_count = qs.update(status='Approved by CEO', remarks=remarks, updated_by=request.user)

        return Response({'message': f'Payroll batch for {period} approved by CEO successfully.', 'updated_count': updated_count}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def reject(self, request):
        """CEO action: Reject payroll batch for a period."""
        if request.user.role not in ['ceo', 'admin']:
            return Response({'detail': 'Only CEO / Admin can reject payroll batches.'}, status=status.HTTP_403_FORBIDDEN)

        period = request.data.get('period', '2026-09')
        remarks = request.data.get('remarks', 'Rejected by CEO')
        
        qs = self.get_queryset().filter(period=period)
        updated_count = qs.update(status='Rejected by CEO', remarks=remarks, updated_by=request.user)
        return Response({'message': f'Payroll batch for {period} rejected by CEO.', 'remarks': remarks, 'updated_count': updated_count}, status=status.HTTP_200_OK)
