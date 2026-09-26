from rest_framework import serializers
from .models import Escalation

class EscalationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Escalation
        fields = '__all__'
        read_only_fields = ('id', 'organization', 'created_at', 'updated_at', 'created_by', 'updated_by')
