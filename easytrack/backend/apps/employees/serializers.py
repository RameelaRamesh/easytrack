from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Employee
from apps.accounts.serializers import UserSerializer
from django.db import transaction

User = get_user_model()

class EmployeeSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    username = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, required=False)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, write_only=True)
    manager_name = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = (
            'id', 'user_details', 'employee_id', 'department', 'designation',
            'manager', 'manager_name', 'status', 'qa_enabled', 'mobile',
            'base_salary', 'leave_balance', 'created_at', 'updated_at',
            'username', 'email', 'first_name', 'last_name', 'password', 'role'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_manager_name(self, obj):
        if obj.manager:
            return obj.manager.get_full_name() or obj.manager.username
        return None

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get('request')
        if not request or not request.user:
            return fields

        user = request.user
        instance = self.instance

        # Determine if we need to filter sensitive fields
        # CEO and HR can see everything.
        # An employee can see their own sensitive fields.
        is_owner = instance and instance.user == user
        has_full_access = user.role in ['ceo', 'hr'] or is_owner
        
        if not has_full_access:
            # Exclude base_salary for non-HR/CEO
            fields.pop('base_salary', None)
            
            # Exclude mobile if it is not the user's profile and they are not a TL (TL can see team contact)
            if user.role != 'tl':
                fields.pop('mobile', None)
                
        return fields

    def create(self, validated_data):
        # Extract user fields
        username = validated_data.pop('username')
        email = validated_data.pop('email')
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        password = validated_data.pop('password', 'easytrack2026') # Default fallback
        role = validated_data.pop('role')
        
        request = self.context.get('request')
        org = request.user.organization if request else None

        with transaction.atomic():
            # Create the associated User
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                password=password,
                role=role,
                organization=org
            )
            
            # Create Employee profile
            employee = Employee.objects.create(
                user=user,
                organization=org,
                **validated_data
            )
            return employee
            
    def update(self, instance, validated_data):
        # Extract user fields if they are updated
        username = validated_data.pop('username', None)
        email = validated_data.pop('email', None)
        first_name = validated_data.pop('first_name', None)
        last_name = validated_data.pop('last_name', None)
        role = validated_data.pop('role', None)
        
        with transaction.atomic():
            user = instance.user
            if username:
                user.username = username
            if email:
                user.email = email
            if first_name:
                user.first_name = first_name
            if last_name:
                user.last_name = last_name
            if role:
                user.role = role
            user.save()
            
            return super().update(instance, validated_data)
class EmployeeBasicSerializer(serializers.ModelSerializer):
    """
    Minimal serializer for chat search or dropdown lists.
    No sensitive info is exposed.
    """
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)
    role_display = serializers.CharField(source='user.get_role_display', read_only=True)

    class Meta:
        model = Employee
        fields = ('id', 'employee_id', 'full_name', 'role', 'role_display', 'department', 'designation')
