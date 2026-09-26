from rest_framework import serializers
from .models import Task

class TaskSerializer(serializers.ModelSerializer):
    assignee_name = serializers.ReadOnlyField(source='assignee.get_full_name')
    reporter_name = serializers.ReadOnlyField(source='reporter.get_full_name')

    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ('id', 'organization', 'created_at', 'updated_at', 'created_by', 'updated_by')
