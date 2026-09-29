from rest_framework import serializers
from .models import Task

class TaskSerializer(serializers.ModelSerializer):
    assignee_name = serializers.SerializerMethodField()
    reporter_name = serializers.SerializerMethodField()
    team_lead_name = serializers.SerializerMethodField()
    project_name = serializers.ReadOnlyField(source='project.name')
    client_name = serializers.ReadOnlyField(source='client.name')

    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ('id', 'key', 'organization', 'created_at', 'updated_at', 'created_by', 'updated_by')

    def get_assignee_name(self, obj):
        if obj.assignee:
            return obj.assignee.get_full_name() or obj.assignee.username
        return None

    def get_reporter_name(self, obj):
        if obj.reporter:
            return obj.reporter.get_full_name() or obj.reporter.username
        return None

    def get_team_lead_name(self, obj):
        if obj.team_lead:
            return obj.team_lead.get_full_name() or obj.team_lead.username
        return None
