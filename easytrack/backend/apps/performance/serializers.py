from rest_framework import serializers
from .models import PerformanceEvaluation

class PerformanceEvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerformanceEvaluation
        fields = '__all__'
        read_only_fields = ('id', 'organization', 'created_at', 'updated_at', 'created_by', 'updated_by')
