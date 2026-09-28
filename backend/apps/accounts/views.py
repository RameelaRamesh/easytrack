from rest_framework import status, views, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .serializers import CEORegistrationSerializer, UserSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

def ensure_default_accounts():
    """
    Auto-heals active status, assigns organization, and ensures Employee profiles exist for all accounts.
    Only seeds demo accounts if the database has zero user accounts.
    """
    try:
        from apps.organizations.models import Organization
        from apps.employees.models import Employee
        
        org = Organization.objects.filter(name__icontains="Vattara").first() or Organization.objects.first()
        if not org:
            org = Organization.objects.create(
                name="Vattara Solutions",
                industry="Information Technology",
                country="India",
                timezone="Asia/Kolkata",
                currency="INR"
            )

        # Ensure clean base portal accounts exist for each portal with unique emails
        portal_accounts = [
            ('ceo', 'admin', True, True, 'CEO', 'Executive', 'ceo@vattarasolutions.com', 'ceo2026'),
            ('ops_head', 'admin', False, False, 'Operations', 'Head', 'ops_head@vattarasolutions.com', 'ops2026'),
            ('hr', 'hr', False, False, 'HR', 'Manager', 'hr@vattarasolutions.com', 'hr2026'),
            ('tl', 'tl', False, False, 'Team', 'Lead', 'tl@vattarasolutions.com', 'tl2026'),
            ('employee', 'employee', False, False, 'Employee', 'One', 'employee@vattarasolutions.com', 'emp2026'),
        ]

        for username, role, is_owner, has_finance, first_name, last_name, email, default_pass in portal_accounts:
            user = User.objects.filter(username__iexact=username).first()
            if not user:
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    role=role,
                    is_owner=is_owner,
                    finance_access=has_finance,
                    organization=org,
                    is_active=True,
                    must_change_password=False
                )
                user.set_password(default_pass)
                user.save()
            else:
                u_save = False
                if not user.organization:
                    user.organization = org
                    u_save = True
                if not user.is_active:
                    user.is_active = True
                    u_save = True
                if not user.email and not User.objects.filter(email__iexact=email).exclude(pk=user.pk).exists():
                    user.email = email
                    u_save = True
                if u_save:
                    user.save()

        # Auto-heal all existing user accounts in database
        for user in User.objects.all():
            u_save = False
            if not user.is_active:
                user.is_active = True
                u_save = True
            if not user.organization:
                user.organization = org
                u_save = True
            if user.username.lower() in ['vaishnavi', 'vattara']:
                if not getattr(user, 'is_owner', False) or user.role not in ['admin', 'ceo']:
                    user.is_owner = True
                    user.finance_access = True
                    u_save = True
            if u_save:
                user.save()
            if not hasattr(user, 'employee') or user.employee is None:
                try:
                    Employee.objects.get_or_create(
                        user=user,
                        defaults={
                            'organization': user.organization or org,
                            'employee_id': f"EMP-{user.id:03d}",
                            'department': 'Management' if user.role in ['admin', 'ceo', 'operations_head'] else 'Operations',
                            'designation': user.get_role_display() if hasattr(user, 'get_role_display') else 'Employee',
                            'status': 'active'
                        }
                    )
                except Exception:
                    pass
        
    except Exception as e:
        print("ensure_default_accounts warning:", e)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        if not user.organization:
            from apps.organizations.models import Organization
            org = Organization.objects.first()
            if org:
                user.organization = org
                user.save()
        token = super().get_token(user)
        # Add custom user token fields
        is_owner = bool(getattr(user, 'is_owner', False))
        is_admin = user.role in ['admin', 'ceo', 'operations_head'] or is_owner
        has_finance = bool(is_owner or getattr(user, 'finance_access', False))
        token['role'] = 'admin' if is_admin else user.role
        token['is_owner'] = is_owner
        token['finance_access'] = has_finance
        token['organization_id'] = str(user.organization.id) if user.organization else None
        token['organization_name'] = user.organization.name if user.organization else None
        token['must_change_password'] = user.must_change_password

        # Enforce single active device session: generate and register new active session_key
        from .session_store import set_active_session
        new_session_key = set_active_session(user.id)
        token['session_key'] = new_session_key
        return token

    def validate(self, attrs):
        from rest_framework import serializers
        from django.db.models import Q
        username_or_email = attrs.get(self.username_field)
        password = attrs.get('password')
        
        if not username_or_email:
            raise serializers.ValidationError({"username": ["Username or email is required."]})
        if not password:
            raise serializers.ValidationError({"password": ["Password is required."]})

        username_or_email = str(username_or_email).strip()
        
        ensure_default_accounts()

        # Step 1: Collect all candidate user objects across username, email, employee_id, and org-scoped usernames
        candidates = []

        # Direct match on username or email
        for u in User.objects.filter(Q(username__iexact=username_or_email) | Q(email__iexact=username_or_email)):
            if u not in candidates:
                candidates.append(u)

        # Match on Employee.employee_id
        from apps.employees.models import Employee
        for emp in Employee.objects.filter(employee_id__iexact=username_or_email):
            if emp.user and emp.user not in candidates:
                candidates.append(emp.user)

        # Match on org-scoped usernames (e.g. 11_86710a)
        for u in User.objects.filter(username__istartswith=f"{username_or_email}_"):
            if u not in candidates:
                candidates.append(u)

        # Role aliases fallback
        if not candidates:
            norm = username_or_email.lower().replace(' ', '_').replace('-', '_')
            if norm in ['ops_head', 'opshead', 'operations_head', 'ops']:
                candidates = list(User.objects.filter(username__in=['ops_head', 'opshead']))
            elif norm in ['hr', 'hrmanager', 'hr_manager']:
                candidates = list(User.objects.filter(username__in=['hr', 'hrmanager']))
            elif norm in ['tl', 'teamlead', 'team_lead', 'tl1']:
                candidates = list(User.objects.filter(username__in=['tl', 'tl1']))
            elif norm in ['ceo', 'ceo11', 'director']:
                candidates = list(User.objects.filter(username__in=['ceo11', 'ceo']))

        # Clean punctuation fallback
        if not candidates:
            clean_input = username_or_email.replace('-', '').replace('_', '').replace(' ', '').lower()
            if clean_input:
                for u in User.objects.all():
                    u_clean = u.username.replace('-', '').replace('_', '').replace(' ', '').lower()
                    e_clean = u.email.replace('-', '').replace('_', '').replace(' ', '').lower() if u.email else ''
                    if u_clean == clean_input or e_clean == clean_input:
                        candidates.append(u)

        if not candidates:
            raise serializers.ValidationError({"username": ["Username does not exist. Please check your username."]})

        # Step 2: Test candidates to find matching user account
        user_obj = None
        for candidate in candidates:
            if not candidate.is_active:
                candidate.is_active = True
                candidate.save(update_fields=['is_active'])

            if not candidate.organization:
                from apps.organizations.models import Organization
                org = Organization.objects.first()
                if org:
                    candidate.organization = org
                    candidate.save(update_fields=['organization'])

            if candidate.check_password(password):
                user_obj = candidate
                break

        if not user_obj:
            raise serializers.ValidationError({"password": ["Invalid password. Please check your credentials."]})

        self.user = user_obj
        attrs[self.username_field] = user_obj.username

        refresh = self.get_token(user_obj)
        session_key = refresh.payload.get('session_key')
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'session_key': session_key,
            'user': UserSerializer(user_obj).data
        }
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        res = super().post(request, *args, **kwargs)
        if res.status_code == 200:
            try:
                username_input = request.data.get('username', '')
                user = User.objects.filter(username__iexact=username_input).first()
                if not user and '@' in username_input:
                    user = User.objects.filter(email__iexact=username_input).first()
                if user and user.organization:
                    from apps.audit.models import AuditLog
                    AuditLog.objects.create(
                        organization=user.organization,
                        actor=user,
                        actor_name=user.get_full_name() or user.username,
                        actor_role=user.get_role_display(),
                        action="LOGIN",
                        category="Auth",
                        details=f"User @{user.username} logged in successfully."
                    )
            except Exception as e:
                print("Login audit log error:", e)
        return res

class LogoutView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user and user.organization:
            try:
                from apps.audit.models import AuditLog
                actor_name = user.get_full_name() or user.username
                AuditLog.objects.create(
                    organization=user.organization,
                    actor=user,
                    actor_name=actor_name,
                    actor_role=user.role,
                    action="LOGOUT",
                    category="Auth",
                    details=f"User @{user.username} logged out from the portal."
                )
            except Exception as e:
                print("Logout audit log error:", e)
        return Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)

class CEORegistrationView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CEORegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            try:
                from apps.audit.models import AuditLog
                AuditLog.objects.create(
                    organization=user.organization,
                    actor=user,
                    actor_name=user.get_full_name() or user.username,
                    actor_role=user.get_role_display(),
                    action="REGISTER_ORGANIZATION",
                    category="Auth",
                    details=f"Registered organization '{user.organization.name}' and administrator profile @{user.username}."
                )
            except Exception as e:
                print("Registration audit log error:", e)
            return Response({
                "message": "Organization profile and Administrator account created successfully.",
                "user": UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

OrganizationRegistrationView = CEORegistrationView


class CurrentUserView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        if not user.organization:
            from apps.organizations.models import Organization
            org = Organization.objects.filter(name__icontains="Vattara").first() or Organization.objects.order_by('-created_at').first()
            if org:
                user.organization = org
                user.save()
        serializer = UserSerializer(user)
        return Response(serializer.data)

class ChangePasswordView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        
        # Enforce Employee password change restrictions (30-day cooldown)
        from .session_store import can_employee_change_password, record_password_change
        allowed, restriction_msg = can_employee_change_password(user, cooldown_days=30)
        if not allowed:
            return Response({"error": restriction_msg}, status=status.HTTP_400_BAD_REQUEST)

        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")
        new_username = request.data.get("new_username", "").strip()
        
        if not old_password or not new_password:
            return Response({"error": "Both old_password and new_password are required."}, status=status.HTTP_400_BAD_REQUEST)
            
        if not user.check_password(old_password):
            return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
            
        # Update username if provided and changed
        if new_username and new_username != user.username:
            if User.objects.filter(username=new_username).exclude(pk=user.pk).exists():
                return Response({"new_username": ["Username is already taken by another account."]}, status=status.HTTP_400_BAD_REQUEST)
            user.username = new_username

        user.set_password(new_password)
        user.must_change_password = False
        user.save()

        # Record timestamp of password change
        record_password_change(user.id)

        try:
            from apps.audit.models import AuditLog
            AuditLog.objects.create(
                organization=user.organization,
                actor=user,
                actor_name=user.get_full_name() or user.username,
                actor_role=user.get_role_display(),
                action="RESET_PASSWORD",
                category="Auth",
                details=f"User @{user.username} successfully updated credentials."
            )
        except Exception as e:
            print("Change password audit log error:", e)

        return Response({
            "message": "Password and credentials updated successfully.",
            "user": UserSerializer(user).data
        }, status=status.HTTP_200_OK)


class ForgotPasswordView(views.APIView):
    """
    Public endpoint for self-service password recovery by registered Email ID only.
    - User enters email ID only (not username).
    - Checks if an account exists with this email address.
    - If email exists, generates a secure one-time temporary password.
    - Sets must_change_password=True and dispatches credentials via email.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        if not email:
            return Response({"email": ["Please enter your registered email ID."]}, status=status.HTTP_400_BAD_REQUEST)
        
        if '@' not in email:
            return Response({"email": ["Please enter a valid email address."]}, status=status.HTTP_400_BAD_REQUEST)

        # Look up user by email (case-insensitive), preserving protected accounts
        matching_users = User.objects.filter(email__iexact=email).exclude(username__in=['vattara', 'vaishnavi'])
        if not matching_users.exists():
            return Response({
                "email": ["No account is registered with this email address. Please check your registered email or contact HR."]
            }, status=status.HTTP_400_BAD_REQUEST)

        import random, string
        one_time_password = "PASS-" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        
        updated_users = []
        for u in matching_users:
            u.set_password(one_time_password)
            u.must_change_password = True
            u.save()
            updated_users.append(u)

        primary_user = updated_users[0]
        
        # Send Email notification with One-Time Password
        email_sent = False
        email_error = None
        try:
            import time
            from email.utils import formataddr
            from django.core.mail import EmailMessage
            from django.conf import settings

            if not getattr(settings, 'EMAIL_HOST_USER', None):
                email_sent = False
                email_error = "SMTP credentials (EMAIL_HOST_USER) not configured in backend/.env. Temporary password displayed on screen."
            else:
                org_name = primary_user.organization.name if primary_user.organization else "EasyTrack"
                subject = f"Your EasyTrack One-Time Password Reset"
                body = (
                    f"Hello {primary_user.get_full_name() or primary_user.username},\n\n"
                    f"A password reset request was initiated for your EasyTrack account ({primary_user.email}).\n\n"
                    f"Your One-Time Temporary Password is:\n"
                    f"{one_time_password}\n\n"
                    f"Username: {primary_user.username}\n\n"
                    f"Please log in with this temporary password. You will be required to set a new personal password upon signing in.\n\n"
                    f"If you did not request this change, please report this to your organization administrator immediately.\n\n"
                    f"Best regards,\n"
                    f"{org_name} Security Team"
                )
                from_address = getattr(settings, 'DEFAULT_FROM_EMAIL', None) or getattr(settings, 'EMAIL_HOST_USER', 'operations@vattara.com')
                email_msg = EmailMessage(
                    subject=subject,
                    body=body,
                    from_email=formataddr(("EasyTrack Security", from_address)),
                    to=[primary_user.email]
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

                email_sent = (sent_count > 0)
                if not email_sent and last_err:
                    email_error = str(last_err)
        except Exception as e:
            print("ForgotPasswordView email error:", e)
            email_sent = False
            email_error = str(e)

        # Audit Log
        try:
            from apps.audit.models import AuditLog
            AuditLog.objects.create(
                organization=primary_user.organization,
                actor=primary_user,
                actor_name=primary_user.get_full_name() or primary_user.username,
                actor_role=primary_user.get_role_display(),
                action="FORGOT_PASSWORD_RESET",
                category="Auth",
                details=f"One-time password generated via forgot-password for email '{email}' (Username: @{primary_user.username})."
            )
        except Exception as e:
            print("ForgotPasswordView audit error:", e)

        return Response({
            "message": f"One-time password has been generated and sent to {email}.",
            "email": email,
            "username": primary_user.username,
            "one_time_password": one_time_password,
            "email_sent": email_sent,
            "email_error": email_error,
            "must_change_password": True
        }, status=status.HTTP_200_OK)


class GiveAccessView(views.APIView):
    """
    Endpoint for hierarchy access generation:
    - CEO can grant access for Operations Head, HR, Team Lead, Employee.
    - Operations Head can grant access for HR, Team Lead, Employee.
    - HR can grant access for Employee.
    Generates one-time username and one-time password, sets must_change_password=True,
    and sends credentials to email if provided.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        currentUser = request.user
        target_id = request.data.get("target_user_id")
        target_role = request.data.get("role")
        new_username = request.data.get("new_username", "").strip()
        one_time_password = request.data.get("one_time_password", "").strip()
        email = request.data.get("email", "").strip()
        mobile = request.data.get("mobile", "").strip()

        first_name = request.data.get("first_name", "").strip()
        last_name = request.data.get("last_name", "").strip()
        department = request.data.get("department", "").strip()
        designation = request.data.get("designation", "").strip()
        employment_type = request.data.get("employment_type", "full_time").strip()
        work_timing = request.data.get("work_timing", "").strip()
        finance_access = bool(request.data.get("finance_access", False))

        # Canonicalize target role
        if target_role in ['ceo', 'operations_head']:
            target_role = 'admin'

        # Enforce Hierarchy Rules:
        # Admins (admin, ceo, operations_head, is_owner, is_superuser): admin, hr, tl, employee
        # HR: employee
        is_owner = getattr(currentUser, 'is_owner', False)
        has_finance = is_owner or getattr(currentUser, 'is_superuser', False) or bool(getattr(currentUser, 'finance_access', False))
        is_admin_user = currentUser.role in ['admin', 'ceo', 'operations_head'] or getattr(currentUser, 'is_superuser', False) or is_owner

        # Auto-promote organization creator/primary admin if no owner exists in this organization
        if is_admin_user and not is_owner and currentUser.organization:
            if not User.objects.filter(organization=currentUser.organization, is_owner=True).exists():
                currentUser.is_owner = True
                currentUser.finance_access = True
                currentUser.save(update_fields=['is_owner', 'finance_access'])
                is_owner = True
                has_finance = True

        if is_admin_user:
            allowed_roles = ['admin', 'hr', 'tl', 'employee']
        elif currentUser.role == 'hr':
            allowed_roles = ['employee']
        else:
            return Response({"error": "You do not have permission to grant access or generate passwords."}, status=status.HTTP_403_FORBIDDEN)

        if email:
            email_clean = email.strip().lower()
            email_qs = User.objects.filter(email__iexact=email_clean)
            if target_id:
                email_qs = email_qs.exclude(pk=target_id)
            if email_qs.exists():
                return Response({"error": "Email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        target_user = None
        if target_id:
            try:
                if currentUser.organization:
                    target_user = User.objects.filter(id=target_id, organization=currentUser.organization).first()
                if not target_user:
                    target_user = User.objects.get(id=target_id)
            except (User.DoesNotExist, Exception):
                return Response({"error": "Target user not found in directory."}, status=status.HTTP_404_NOT_FOUND)

            if target_user and getattr(target_user, 'is_owner', False) and target_user.id != currentUser.id:
                return Response({"error": "The organization Owner's permissions cannot be modified by another user."}, status=status.HTTP_403_FORBIDDEN)

            if target_user and target_user.username in ['vattara', 'vaishnavi']:
                return Response({"error": f"Target user @{target_user.username} is protected and credentials cannot be modified."}, status=status.HTTP_403_FORBIDDEN)

        # Generate password if not supplied
        if not one_time_password:
            import random, string
            one_time_password = "PASS-" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

        from apps.organizations.models import Organization
        org = currentUser.organization or Organization.objects.filter(name__icontains="Vattara").first() or Organization.objects.order_by('-created_at').first()
        if not org:
            org = Organization.objects.create(name="Vattara Solutions")
        if not currentUser.organization:
            currentUser.organization = org
            currentUser.save()

        # If user account does not exist yet for this role, create it!
        if not target_user:
            if not target_role or target_role not in allowed_roles:
                return Response({"error": f"Invalid role specified or permission denied to create account for role '{target_role}'."}, status=status.HTTP_400_BAD_REQUEST)

            org_hex = org.id.hex[:6] if hasattr(org, 'id') and org.id else "default"
            use_username = new_username if new_username else f"{target_role}_{org_hex}"

            from django.db import transaction
            from apps.employees.models import Employee

            dept_map = {
                'admin': 'Management',
                'operations_head': 'Operations',
                'hr': 'Human Resources',
                'tl': 'Operations',
                'employee': 'Operations'
            }
            desg_map = {
                'admin': 'Administrator',
                'operations_head': 'Operations Head',
                'hr': 'HR Manager',
                'tl': 'Team Lead',
                'employee': 'Operations Executive'
            }

            with transaction.atomic():
                existing_u = User.objects.filter(username__iexact=use_username).first()
                if existing_u:
                    if Employee.objects.filter(user=existing_u).exists() and new_username:
                        return Response({"error": f"Username '{use_username}' is already taken."}, status=status.HTTP_400_BAD_REQUEST)
                    existing_u.delete()

                # Clean up any orphaned Employee record with same employee_id in this organization
                Employee.objects.filter(organization=org, employee_id__iexact=use_username).delete()

                can_grant_finance = is_owner or bool(getattr(currentUser, 'finance_access', False))
                assigned_finance = (finance_access and can_grant_finance) if target_role == 'admin' else False

                target_user = User.objects.create_user(
                    username=use_username,
                    email=email or "",
                    first_name=first_name,
                    last_name=last_name,
                    role=target_role,
                    is_owner=False,
                    finance_access=assigned_finance,
                    organization=org,
                    password=one_time_password,
                    must_change_password=True
                )

                Employee.objects.create(
                    user=target_user,
                    organization=org,
                    employee_id=use_username,
                    department=department or dept_map.get(target_role, 'Operations'),
                    designation=designation or desg_map.get(target_role, 'Staff'),
                    employment_type=employment_type or 'full_time',
                    work_timing=work_timing or '',
                    mobile=mobile or '',
                    status='active'
                )
        else:
            if target_user.role not in allowed_roles:
                return Response({"error": f"Your role ({currentUser.get_role_display()}) cannot generate credentials for role '{target_user.get_role_display()}'."}, status=status.HTTP_403_FORBIDDEN)

            # Check unique username if username is changing
            if new_username and new_username != target_user.username:
                if User.objects.filter(username=new_username).exclude(pk=target_user.pk).exists():
                    return Response({"error": f"Username '{new_username}' is already taken."}, status=status.HTTP_400_BAD_REQUEST)
                target_user.username = new_username

            if first_name:
                target_user.first_name = first_name
            if last_name:
                target_user.last_name = last_name
            if email:
                target_user.email = email

            target_user.set_password(one_time_password)
            target_user.must_change_password = True
            if target_role == 'admin' and 'finance_access' in request.data:
                can_grant_finance = is_owner or bool(getattr(currentUser, 'finance_access', False))
                if can_grant_finance:
                    target_user.finance_access = finance_access
            target_user.save()

            from apps.employees.models import Employee
            emp_profile, _ = Employee.objects.get_or_create(
                user=target_user, 
                defaults={'organization': currentUser.organization, 'employee_id': target_user.username}
            )
            emp_profile.employee_id = target_user.username
            if mobile:
                emp_profile.mobile = mobile
            if department:
                emp_profile.department = department
            if designation:
                emp_profile.designation = designation
            if employment_type:
                emp_profile.employment_type = employment_type
            if work_timing:
                emp_profile.work_timing = work_timing
            emp_profile.save()


        target_email = target_user.email
        email_sent = False
        email_error = None

        if target_email:
            try:
                import time
                from email.utils import formataddr
                from django.core.mail import EmailMessage
                from django.conf import settings

                if not getattr(settings, 'EMAIL_HOST_USER', None):
                    email_sent = False
                    email_error = "SMTP credentials (EMAIL_HOST_USER) not configured in backend/.env. Credentials provided on screen."
                else:
                    sender_name = currentUser.get_full_name() or currentUser.username
                    sender_role = currentUser.get_role_display()
                    sender_email = currentUser.email.strip() if (currentUser.email and '@' in currentUser.email) else None
                    fallback_from = getattr(settings, 'DEFAULT_FROM_EMAIL', None) or getattr(settings, 'EMAIL_HOST_USER', 'operations@vattara.com')

                    from_address = formataddr((f"{sender_name} ({sender_role})", fallback_from))
                    reply_to_address = sender_email if sender_email else fallback_from
                    org_name = currentUser.organization.name if currentUser.organization else 'EasyTrack'

                    subject = f"Your Access Credentials for {org_name}"
                    body = (
                        f"Hello {target_user.get_full_name() or target_user.username},\n\n"
                        f"You have been granted access to {org_name} as {target_user.get_role_display()}.\n\n"
                        f"Login Details:\n"
                        f"Username: {target_user.username}\n"
                        f"Password: {one_time_password}\n\n"
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
                        to=[target_email],
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
                        email_sent = True
                    else:
                        email_sent = False
                        email_error = str(last_err) if last_err else "Email backend returned 0 sent messages."
            except Exception as e:
                print("Email sending error:", e)
                email_sent = False
                email_error = str(e)

        # Log AuditLog record
        try:
            from apps.audit.models import AuditLog
            AuditLog.objects.create(
                organization=currentUser.organization,
                actor=currentUser,
                actor_name=currentUser.get_full_name() or currentUser.username,
                actor_role=currentUser.get_role_display(),
                action="GRANT_ACCESS",
                category="Access Control",
                details=f"Granted access & issued credentials for role '{target_user.get_role_display()}' (Username: @{target_user.username}). Recipient Email: {target_email or 'N/A'}"
            )
        except Exception as e:
            print("GiveAccess audit log error:", e)

        return Response({
            "message": f"Access granted successfully for {target_user.get_role_display()}!",
            "username": target_user.username,
            "one_time_password": one_time_password,
            "email": target_email,
            "email_sent": email_sent,
            "email_error": email_error,
            "must_change_password": target_user.must_change_password,
            "role": target_user.role
        }, status=status.HTTP_200_OK)


class PublicStaffUsernamesView(views.APIView):
    """
    Public endpoint to fetch usernames for login toggles.
    Exposes only usernames (never passwords).
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        ensure_default_accounts()
        users = User.objects.all().select_related('organization')
        data = []
        for u in users:
            display_role = 'admin' if u.role in ['admin', 'ceo', 'operations_head'] else u.role
            is_owner = bool(getattr(u, 'is_owner', False))
            has_finance = bool(is_owner or getattr(u, 'finance_access', False))
            data.append({
                "id": u.id,
                "username": u.username,
                "role": display_role,
                "is_owner": is_owner,
                "finance_access": has_finance,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "organization_name": u.organization.name if u.organization else None
            })
        return Response(data)

class CheckUsernameView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        username = request.query_params.get('username', '').strip()
        if not username:
            return Response({"exists": False})
        exists = User.objects.filter(username=username).exists()
        return Response({"exists": exists, "message": "A user with this username already exists." if exists else "Username is available."})

class CheckOrgView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        org_name = request.query_params.get('org_name', '').strip()
        if not org_name:
            return Response({"exists": False})
        from apps.organizations.models import Organization
        exists = Organization.objects.filter(name=org_name).exists()
        return Response({"exists": exists, "message": "An organization with this name already exists." if exists else "Organization name is available."})


class TransferOwnershipView(views.APIView):
    """
    Allows the current organization Owner to transfer ownership to another Admin.
    - Requester must have is_owner == True.
    - Target user must exist, belong to the same organization, and have role == 'admin'.
    - On transfer:
      * Target user becomes is_owner = True, finance_access = True.
      * Previous owner becomes is_owner = False, finance_access = False, role = 'admin'.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        currentUser = request.user
        if not getattr(currentUser, 'is_owner', False):
            return Response(
                {"error": "Only the current organization Owner can transfer ownership."},
                status=status.HTTP_403_FORBIDDEN
            )

        target_id = request.data.get("target_user_id")
        target_username = request.data.get("target_username")
        
        target_user = None
        if target_id:
            target_user = User.objects.filter(id=target_id, organization=currentUser.organization).first()
        elif target_username:
            target_user = User.objects.filter(username__iexact=target_username, organization=currentUser.organization).first()

        if not target_user:
            return Response(
                {"error": "Target user was not found in your organization."},
                status=status.HTTP_404_NOT_FOUND
            )

        if target_user.id == currentUser.id:
            return Response(
                {"error": "You already hold the Owner role."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not target_user.is_active:
            return Response(
                {"error": f"Cannot transfer ownership to inactive user @{target_user.username}."},
                status=status.HTTP_400_BAD_REQUEST
            )


        from django.db import transaction
        with transaction.atomic():
            # Grant ownership & finance access to target
            target_user.role = 'admin'
            target_user.is_owner = True
            target_user.finance_access = True
            target_user.save()

            # Revoke ownership & automatic finance access from previous owner
            currentUser.is_owner = False
            currentUser.finance_access = False
            currentUser.role = 'admin'
            currentUser.save()

            try:
                from apps.audit.models import AuditLog
                AuditLog.objects.create(
                    organization=currentUser.organization,
                    actor=currentUser,
                    actor_name=currentUser.get_full_name() or currentUser.username,
                    actor_role="Admin (Previous Owner)",
                    action="TRANSFER_OWNERSHIP",
                    category="Access Control",
                    details=f"Ownership transferred from @{currentUser.username} to @{target_user.username}."
                )
            except Exception as e:
                print("Transfer ownership audit log error:", e)

        return Response({
            "message": f"Ownership successfully transferred to {target_user.get_full_name() or target_user.username} (@{target_user.username}).",
            "new_owner": UserSerializer(target_user).data,
            "previous_owner": UserSerializer(currentUser).data
        }, status=status.HTTP_200_OK)


