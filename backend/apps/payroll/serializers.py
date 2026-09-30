from rest_framework import serializers
from .models import SalarySlip
from apps.employees.serializers import EmployeeSerializer

class SalarySlipSerializer(serializers.ModelSerializer):
    employee_details = EmployeeSerializer(source='employee', read_only=True)
    employee_id_str = serializers.CharField(source='employee.employee_id', read_only=True)
    employee_name = serializers.SerializerMethodField()
    employee_designation = serializers.CharField(source='employee.designation', read_only=True)
    employee_department = serializers.CharField(source='employee.department', read_only=True)

    class Meta:
        model = SalarySlip
        fields = (
            'id', 'employee', 'employee_details', 'employee_id_str', 'employee_name',
            'employee_designation', 'employee_department', 'name', 'period',
            'base_salary', 'overtime_pay', 'bonus', 'deductions', 'net_salary',
            'status', 'remarks', 'details', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'organization', 'created_at', 'updated_at', 'created_by', 'updated_by')

    def get_employee_name(self, obj):
        if obj.employee and obj.employee.user:
            full_name = obj.employee.user.get_full_name()
            if full_name and full_name.strip():
                return full_name
            return obj.employee.user.username
        return obj.name or "Employee"
