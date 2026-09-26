from rest_framework import serializers
from .models import SalarySlip

class SalarySlipSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalarySlip
        fields = '__all__'
        read_only_fields = ('id', 'organization', 'created_at', 'updated_at', 'created_by', 'updated_by')
