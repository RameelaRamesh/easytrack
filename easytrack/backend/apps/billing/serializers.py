from rest_framework import serializers
from .models import BillingWork

class BillingWorkSerializer(serializers.ModelSerializer):
    client_name = serializers.ReadOnlyField(source='client.name')
    process_name = serializers.ReadOnlyField(source='process.name')
    tl_name = serializers.ReadOnlyField(source='assigned_tl.get_full_name')
    employee_name = serializers.ReadOnlyField(source='assigned_employee.get_full_name')

    class Meta:
        model = BillingWork
        fields = '__all__'
        read_only_fields = ('id', 'organization', 'created_at', 'updated_at', 'created_by', 'updated_by')
