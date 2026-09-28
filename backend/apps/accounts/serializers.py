from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.organizations.models import Organization
from apps.employees.models import Employee
from django.db import transaction

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    organization_name = serializers.ReadOnlyField(source='organization.name')
    finance_access = serializers.SerializerMethodField()
    display_role = serializers.SerializerMethodField()
    is_owner = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_owner', 'finance_access', 'display_role', 'organization', 'organization_name', 'must_change_password')
        read_only_fields = ('id', 'organization', 'must_change_password', 'is_owner')

    def get_finance_access(self, obj):
        if getattr(obj, 'is_owner', False):
            return True
        if hasattr(obj, 'finance_access') and obj.finance_access is not None:
            return bool(obj.finance_access)
        return False

    def get_display_role(self, obj):
        if getattr(obj, 'is_owner', False):
            return 'Owner & Admin'
        if obj.role in ['admin', 'ceo', 'operations_head']:
            has_finance = self.get_finance_access(obj)
            return 'Admin (Finance Access)' if has_finance else 'Admin'
        if obj.role == 'tl':
            return 'Manager / Team Lead'
        if obj.role == 'hr':
            return 'HR'
        return 'Employee'

class CEORegistrationSerializer(serializers.Serializer):
    # Step 1: User details - collect only user name, email, password
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(max_length=150, required=False, default='', allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, default='', allow_blank=True)
    
    # Step 2: Organization details - do not ask for industry
    org_name = serializers.CharField(max_length=255)
    industry = serializers.CharField(max_length=100, required=False, default='Professional Services')
    country = serializers.CharField(max_length=100, required=False, default='India')
    timezone = serializers.CharField(max_length=100, required=False, default='Asia/Kolkata')
    currency = serializers.CharField(max_length=10, required=False, default='INR')
    
    # Financial management & ownership transfer options
    manage_finance = serializers.BooleanField(required=False, default=True)
    assign_owner = serializers.DictField(required=False, allow_null=True, default=None)

    # Configurable setup
    departments = serializers.ListField(child=serializers.CharField(max_length=100), required=False, default=list)
    designations = serializers.ListField(child=serializers.CharField(max_length=100), required=False, default=list)
    working_days = serializers.ListField(child=serializers.CharField(max_length=50), required=False, default=list)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_email(self, value):
        if value and value.strip():
            clean_email = value.strip().lower()
            if User.objects.filter(email__iexact=clean_email).exists():
                raise serializers.ValidationError("Email already exists.")
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
                industry=validated_data.get('industry', 'Professional Services'),
                country=validated_data.get('country', 'India'),
                timezone=validated_data.get('timezone', 'Asia/Kolkata'),
                currency=validated_data.get('currency', 'INR'),
                working_days=validated_data.get('working_days', ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]),
                departments=validated_data.get('departments') or ["Operations", "Quality Assurance", "Human Resources", "Management", "Finance", "Information Technology"],
                designations=validated_data.get('designations') or ["Operations Associate", "Senior Operations Associate", "Team Lead", "Quality Analyst", "HR Executive", "Operations Manager", "Administrator"],
                task_types=validated_data.get('task_types') or ["Data Processing", "Verification & Audit", "Deliverable Production", "Quality Review", "Client Follow-up", "Documentation"],
                workflows=validated_data.get('workflows') or ["Standard SLA", "Expedited Delivery", "Quality Audit", "Exception Resolution"],
                custom_fields=validated_data.get('custom_fields', {}),
                performance_metrics=validated_data.get('performance_metrics', {
                    "efficiency_target": 95,
                    "accuracy_target": 98.5,
                    "daily_volume_target": 100,
                    "sla_compliance_target": 98
                })
            )
            
            manage_finance = validated_data.get('manage_finance', True)
            assign_owner = validated_data.get('assign_owner')
            
            # If the creator indicates they will NOT manage billing/finance settings and designates another owner:
            # new Owner receives Owner + Admin + Finance Access, and original creator remains Admin without Finance Access.
            is_creator_owner = True
            creator_finance = True
            if not manage_finance and assign_owner:
                is_creator_owner = False
                creator_finance = False

            first_name = validated_data.get('first_name', '')
            last_name = validated_data.get('last_name', '')
            if not first_name:
                first_name = validated_data['username'].capitalize()

            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                first_name=first_name,
                last_name=last_name,
                password=validated_data['password'],
                role='admin',
                is_owner=is_creator_owner,
                finance_access=creator_finance,
                organization=org,
                must_change_password=False
            )
            if user.is_owner != is_creator_owner or user.finance_access != creator_finance:
                user.is_owner = is_creator_owner
                user.finance_access = creator_finance
                user.save(update_fields=['is_owner', 'finance_access'])
            
            Employee.objects.get_or_create(
                user=user,
                organization=org,
                defaults={
                    'employee_id': 'EMP-001' if not is_creator_owner else 'OWNER-001',
                    'department': 'Management',
                    'designation': 'Organization Owner & Administrator' if is_creator_owner else 'Administrator',
                    'status': 'active'
                }
            )

            # If assigning a different user as the new Owner
            if not manage_finance and assign_owner and isinstance(assign_owner, dict):
                new_owner_username = assign_owner.get('username') or assign_owner.get('email', '').split('@')[0]
                new_owner_email = assign_owner.get('email', '')
                new_owner_password = assign_owner.get('password') or 'OwnerPass2026!'
                new_owner_name = assign_owner.get('name') or assign_owner.get('first_name', 'New')
                new_owner_last = assign_owner.get('last_name', 'Owner')

                if new_owner_username and new_owner_email:
                    new_owner_user = User.objects.create_user(
                        username=new_owner_username,
                        email=new_owner_email,
                        first_name=new_owner_name,
                        last_name=new_owner_last,
                        password=new_owner_password,
                        role='admin',
                        is_owner=True,
                        finance_access=True,
                        organization=org,
                        must_change_password=False
                    )
                    Employee.objects.get_or_create(
                        user=new_owner_user,
                        organization=org,
                        defaults={
                            'employee_id': 'OWNER-001',
                            'department': 'Executive Management',
                            'designation': 'Owner & Finance Director',
                            'status': 'active'
                        }
                    )

            return user

OrganizationRegistrationSerializer = CEORegistrationSerializer



