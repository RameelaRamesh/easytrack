from rest_framework import serializers
from .models import LeaveRequest

class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    reviewer_name = serializers.SerializerMethodField()

    class Meta:
        model = LeaveRequest
        fields = '__all__'
        read_only_fields = ('id', 'organization', 'created_at', 'updated_at', 'created_by', 'updated_by')

    def get_employee_name(self, obj):
        if not obj.user:
            return "Employee"
        full_name = obj.user.get_full_name().strip()
        return full_name if full_name else obj.user.username

    def get_reviewer_name(self, obj):
        if not obj.reviewed_by:
            return ""
        full_name = obj.reviewed_by.get_full_name().strip()
        return full_name if full_name else obj.reviewed_by.username

