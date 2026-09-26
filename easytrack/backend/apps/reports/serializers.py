from rest_framework import serializers
from .models import ManagementReport

class ManagementReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = ManagementReport
        fields = '__all__'
        read_only_fields = ('id', 'organization', 'created_at', 'updated_at', 'created_by', 'updated_by')
