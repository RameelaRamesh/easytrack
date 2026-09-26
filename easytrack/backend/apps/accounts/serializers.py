from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.organizations.models import Organization
from django.db import transaction

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    organization_name = serializers.ReadOnlyField(source='organization.name')
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role', 'organization', 'organization_name', 'must_change_password')
        read_only_fields = ('id', 'role', 'organization', 'must_change_password')

class CEORegistrationSerializer(serializers.Serializer):
    # Step 1: User details
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)
    
    # Step 2: Organization details
    org_name = serializers.CharField(max_length=255)
    industry = serializers.CharField(max_length=100, required=False, default='Healthcare')
    country = serializers.CharField(max_length=100, required=False, default='India')
    timezone = serializers.CharField(max_length=100, required=False, default='Asia/Kolkata')
    currency = serializers.CharField(max_length=10, required=False, default='INR')
    
    # Step 3: Setup (optional basic settings)
    departments = serializers.ListField(child=serializers.CharField(max_length=100), required=False, default=list)
    designations = serializers.ListField(child=serializers.CharField(max_length=100), required=False, default=list)
    working_days = serializers.ListField(child=serializers.CharField(max_length=50), required=False, default=list)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_org_name(self, value):
        if Organization.objects.filter(name=value).exists():
            raise serializers.ValidationError("An organization with this name already exists.")
        return value

    def create(self, validated_data):
        with transaction.atomic():
            # Create organization
            org = Organization.objects.create(
                name=validated_data['org_name'],
                industry=validated_data['industry'],
                country=validated_data['country'],
                timezone=validated_data['timezone'],
                currency=validated_data['currency'],
                working_days=validated_data.get('working_days', ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])
            )
            
            # Create user (CEO)
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
                password=validated_data['password'],
                role='ceo',
                organization=org,
                must_change_password=False # For new registrations
            )
            
            # Seed departments/designations if provided
            # We will save these later or associate them if we have tables.
            # For now, we will store them or let the frontend configure them.
            
            return user
