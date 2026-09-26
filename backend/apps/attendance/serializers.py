from rest_framework import serializers
from .models import Attendance

class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    employee_id = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    designation = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = '__all__'
        read_only_fields = ('id', 'organization', 'created_at', 'updated_at', 'created_by', 'updated_by')

    def get_employee_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_employee_id(self, obj):
        try:
            return obj.user.employee_profile.employee_id
        except Exception:
            return obj.user.username

    def get_department(self, obj):
        try:
            return obj.user.employee_profile.department or 'Operations'
        except Exception:
            return 'Operations'

    def get_designation(self, obj):
        try:
            return obj.user.employee_profile.designation or 'Staff'
        except Exception:
            return 'Staff'

    def get_role(self, obj):
        return obj.user.role
