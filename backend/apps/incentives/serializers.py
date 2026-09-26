from rest_framework import serializers
from .models import IncentiveRecord

class IncentiveRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncentiveRecord
        fields = '__all__'
        read_only_fields = ('id', 'organization', 'created_at', 'updated_at', 'created_by', 'updated_by')
