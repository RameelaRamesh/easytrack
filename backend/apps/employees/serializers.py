from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Employee
from apps.accounts.serializers import UserSerializer
from django.db import transaction

User = get_user_model()

class EmployeeSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    username = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    email = serializers.EmailField(write_only=True, required=False, allow_null=True, allow_blank=True)
    first_name = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    last_name = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True, default="")
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, write_only=True, required=False, allow_null=True)
    manager_name = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = (
            'id', 'user_details', 'employee_id', 'department', 'designation',
            'manager', 'manager_name', 'status', 'qa_enabled', 'mobile',
            'base_salary', 'leave_balance', 'created_at', 'updated_at',
            'username', 'email', 'first_name', 'last_name', 'password', 'role',
            'start_date', 'date_of_birth', 'gender', 'address', 'district_suburb', 'state_postcode',
            'employment_type', 'work_timing',
            'highest_qualification', 'specialization', 'college_university', 'graduation_year', 'percentage_cgpa',
            'bank_name', 'branch_name', 'account_holder', 'account_number', 'ifsc_code',
            'doc_passport_photo', 'doc_10th_marksheet', 'doc_approved_id', 'doc_12th_diploma', 'doc_pan_card', 'doc_degree_certificate', 'doc_semester_marksheets',
            'declaration_candidate_name', 'declaration_signature', 'declaration_date'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate_email(self, value):
        if value and value.strip():
            clean_email = value.strip().lower()
            qs = User.objects.filter(email__iexact=clean_email)
            if self.instance and hasattr(self.instance, 'user') and self.instance.user:
                qs = qs.exclude(pk=self.instance.user.pk)
            if qs.exists():
                raise serializers.ValidationError("Email already exists.")
        return value

    def to_internal_value(self, data):
        # Support both flat payload and user_details dictionary payload
        if isinstance(data, dict) and 'user_details' in data and isinstance(data['user_details'], dict):
            ud = data['user_details']
            data = data.copy()
            for key in ['username', 'email', 'first_name', 'last_name', 'password', 'role']:
                if key in ud:
                    data[key] = ud[key]
        return super().to_internal_value(data)


    def get_manager_name(self, obj):
        if obj.manager:
            return obj.manager.get_full_name() or obj.manager.username
        return None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if hasattr(instance, '_generated_otp'):
            data['one_time_password'] = instance._generated_otp
        if hasattr(instance, '_email_sent'):
            data['email_sent'] = instance._email_sent
        if hasattr(instance, '_email_error'):
            data['email_error'] = instance._email_error
        return data


    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get('request')
        if not request or not request.user:
            return fields

        user = request.user
        instance = self.instance

        is_owner = isinstance(instance, Employee) and instance.user == user
        has_full_access = user.role in ['admin', 'ceo', 'hr', 'operations_head'] or getattr(user, 'is_owner', False) or is_owner

        
        if not has_full_access:
            fields.pop('base_salary', None)
            if user.role != 'tl':
                fields.pop('mobile', None)
                
        return fields

    def create(self, validated_data):
        username = validated_data.pop('username', None)
        employee_id = validated_data.get('employee_id', '') or username or ""
        if not username:
            username = employee_id
        validated_data['employee_id'] = employee_id
        email = validated_data.pop('email', None) or ""
        first_name = validated_data.pop('first_name', None) or "Employee"
        last_name = validated_data.pop('last_name', None) or employee_id
        password = validated_data.pop('password', None)
        
        import random, string
        if not password or not password.strip():
            password = "OTP-" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            
        role = validated_data.pop('role', 'employee')
        
        request = self.context.get('request')
        org = validated_data.pop('organization', None) or (request.user.organization if request else None)
        created_by = validated_data.pop('created_by', None)

        with transaction.atomic():
            base_username = username or employee_id
            target_username = base_username
            
            # Check if username already exists in auth_user
            existing_user = User.objects.filter(username__iexact=base_username).first()
            if existing_user:
                if existing_user.organization == org:
                    raise serializers.ValidationError({"username": ["A user with this username/employee ID already exists in your organization."]})
                else:
                    # Multi-tenant isolation: scope auth_user username for different organization
                    org_suffix = str(org.id).replace('-', '')[:6] if (org and hasattr(org, 'id') and org.id) else 'org'
                    target_username = f"{base_username}_{org_suffix}"
                    counter = 1
                    while User.objects.filter(username__iexact=target_username).exists():
                        target_username = f"{base_username}_{org_suffix}_{counter}"
                        counter += 1

            user = User.objects.create_user(
                username=target_username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                password=password,
                role=role,
                organization=org,
                must_change_password=True
            )
            
            employee = Employee.objects.create(
                user=user,
                organization=org,
                created_by=created_by,
                **validated_data
            )
            # Store generated one-time password transiently for UI return
            employee._generated_otp = password

            if email:
                try:
                    import time
                    from email.utils import formataddr
                    from django.core.mail import EmailMessage
                    from django.conf import settings

                    actor = request.user if (request and request.user and request.user.is_authenticated) else None
                    sender_name = actor.get_full_name() or actor.username if actor else "System Administrator"
                    sender_role = actor.get_role_display() if actor else "Administrator"
                    sender_email = actor.email.strip() if (actor and actor.email and '@' in actor.email) else None
                    fallback_from = getattr(settings, 'DEFAULT_FROM_EMAIL', None) or getattr(settings, 'EMAIL_HOST_USER', 'operations@vattara.com')

                    from_address = formataddr((f"{sender_name} ({sender_role})", fallback_from))
                    reply_to_address = sender_email if sender_email else fallback_from
                    org_name = org.name if org else 'EasyTrack'

                    subject = f"Your Access Credentials for {org_name}"
                    body = (
                        f"Hello {user.get_full_name() or user.username},\n\n"
                        f"You have been granted access to {org_name} as {user.get_role_display()}.\n\n"
                        f"Login Details:\n"
                        f"Username: {user.username}\n"
                        f"Password: {password}\n\n"
                        f"Granted By: {sender_name} ({sender_role})\n"
                        f"Sender Contact Email: {reply_to_address}\n\n"
                        f"Please log in and update your password on first login.\n\n"
                        f"Best regards,\n"
                        f"{sender_name}\n"
                        f"{sender_role}, {org_name}"
                    )

                    email_msg = EmailMessage(
                        subject=subject,
                        body=body,
                        from_email=from_address,
                        to=[email],
                        reply_to=[reply_to_address]
                    )

                    sent_count = 0
                    last_err = None
                    for attempt in range(3):
                        try:
                            sent_count = email_msg.send(fail_silently=False)
                            if sent_count > 0:
                                break
                        except Exception as send_err:
                            last_err = send_err
                            time.sleep(1)

                    if sent_count > 0:
                        employee._email_sent = True
                    else:
                        employee._email_sent = False
                        employee._email_error = str(last_err) if last_err else "Email backend returned 0 sent messages."
                except Exception as e:
                    print("Employee creation email error:", e)
                    employee._email_sent = False
                    employee._email_error = str(e)

            return employee

            
    def update(self, instance, validated_data):
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
            
            res = super().update(instance, validated_data)

            try:
                from apps.audit.models import AuditLog
                req = self.context.get('request')
                actor = req.user if (req and req.user.is_authenticated) else user
                AuditLog.objects.create(
                    organization=instance.organization or user.organization,
                    actor=actor,
                    actor_name=actor.get_full_name() or actor.username,
                    actor_role=actor.get_role_display(),
                    action="UPDATE_PROFILE",
                    category="Employees",
                    details=f"Updated profile details for {user.get_full_name() or user.username} (@{user.username})."
                )
            except Exception as e:
                print("Employee update audit log error:", e)

            return res


class EmployeeBasicSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)
    role_display = serializers.CharField(source='user.get_role_display', read_only=True)

    class Meta:
        model = Employee
        fields = ('id', 'user_id', 'employee_id', 'full_name', 'role', 'role_display', 'department', 'designation')
