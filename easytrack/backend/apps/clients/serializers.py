from rest_framework import serializers
from .models import Client

class ClientSerializer(serializers.ModelSerializer):
    ops_head_name = serializers.ReadOnlyField(source='ops_head.get_full_name')
    tl_name = serializers.ReadOnlyField(source='tl.get_full_name')

    class Meta:
        model = Client
        fields = '__all__'
        read_only_fields = ('id', 'organization', 'created_at', 'updated_at', 'created_by', 'updated_by')
