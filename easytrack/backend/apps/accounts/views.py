from rest_framework import status, views, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .serializers import CEORegistrationSerializer, UserSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

def ensure_default_accounts():
    try:
        from apps.organizations.models import Organization
        from apps.employees.models import Employee
        
        org = Organization.objects.filter(name__icontains="Vattara").first() or Organization.objects.first()
        if not org:
            org = Organization.objects.create(
                name="Vattara Solutions",
                industry="Healthcare",
                country="India",
                timezone="Asia/Kolkata",
                currency="INR"
            )

        # 1. Guarantee newly created CEO user 'ceo' with password 'ceo2026'
        ceo_user, _ = User.objects.get_or_create(
            username='ceo',
            defaults={
                'email': 'operations@vattara.com',
                'first_name': 'CEO',
                'last_name': 'Executive',
                'role': 'ceo',
                'organization': org,
                'is_active': True,
                'must_change_password': False
            }
        )
        ceo_user.set_password('ceo2026')
        ceo_user.role = 'ceo'
        ceo_user.organization = org
        ceo_user.email = 'operations@vattara.com'
        ceo_user.is_active = True
        ceo_user.must_change_password = False
        ceo_user.save()

        Employee.objects.get_or_create(
            user=ceo_user,
            defaults={
                'organization': org,
                'employee_id': 'CEO-001',
                'department': 'Management',
                'designation': 'CEO',
                'status': 'active'
            }
        )

        # 2. Guarantee newly created HR user 'hrmanager' with password 'hr2026'
        hr_u, _ = User.objects.get_or_create(
            username='hrmanager',
            defaults={
                'email': 'operations@vattara.com',
                'first_name': 'HR',
                'last_name': 'Manager',
                'role': 'hr',
                'organization': org,
                'is_active': True,
                'must_change_password': False
            }
        )
        hr_u.set_password('hr2026')
        hr_u.role = 'hr'
        hr_u.organization = org
        hr_u.email = 'operations@vattara.com'
        hr_u.is_active = True
        hr_u.must_change_password = False
        hr_u.save()

        Employee.objects.get_or_create(
            user=hr_u,
            defaults={
                'organization': org,
                'employee_id': 'HR-001',
                'department': 'HR',
                'designation': 'HR Manager',
                'status': 'active'
            }
        )

        # 3. Update all demo users' email to operations@vattara.com, preserving 'vattara' and 'vaishnavi' untouched
        User.objects.exclude(username__in=['vattara', 'vaishnavi']).update(email='operations@vattara.com')
        
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
        # Add custom claims
        token['role'] = user.role
        token['organization_id'] = str(user.organization.id) if user.organization else None
        token['organization_name'] = user.organization.name if user.organization else None
        token['must_change_password'] = user.must_change_password
        return token

    def validate(self, attrs):
        from rest_framework import serializers
        username_or_email = attrs.get(self.username_field)
        password = attrs.get('password')
        
        if not username_or_email:
            raise serializers.ValidationError({"username": ["Username or email is required."]})
        if not password:
            raise serializers.ValidationError({"password": ["Password is required."]})

        username_or_email = str(username_or_email).strip()
        
        # If user is logging in as 'ceo' with 'ceo2026', ensure ceo account is provisioned
        if username_or_email.lower() == 'ceo' or (username_or_email.lower() == 'operations@vattara.com' and password == 'ceo2026'):
            ensure_default_accounts()
        elif username_or_email.lower() in ['hr', 'hrmanager'] or (username_or_email.lower() == 'operations@vattara.com' and password == 'hr2026'):
            ensure_default_accounts()

        # Step 1: Check if username/email exists
        user_obj = User.objects.filter(username__iexact=username_or_email).first()
        if not user_obj and '@' in username_or_email:
            matching_users = User.objects.filter(email__iexact=username_or_email)
            if not matching_users.exists():
                raise serializers.ValidationError({"username": ["Username or email does not exist."]})
            
            # Find the user among matching email users that matches password
            for candidate in matching_users:
                if candidate.check_password(password):
                    user_obj = candidate
                    break
            if not user_obj:
                raise serializers.ValidationError({"password": ["Incorrect password. Please try again."]})
        
        if not user_obj:
            raise serializers.ValidationError({"username": ["Username does not exist. Please check your username."]})

        # Step 2: Check password
        if not user_obj.check_password(password):
            raise serializers.ValidationError({"password": ["Incorrect password. Please try again."]})

        # Step 3: Check is_active
        if not user_obj.is_active:
            raise serializers.ValidationError({"username": ["This account has been deactivated. Please contact support."]})

        self.user = user_obj
        attrs[self.username_field] = user_obj.username

        refresh = self.get_token(user_obj)
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user_obj).data
        }
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class CEORegistrationView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CEORegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "message": "CEO registered and Organization created successfully.",
                "user": UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CurrentUserView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class ChangePasswordView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")
        
        if not old_password or not new_password:
            return Response({"error": "Both old_password and new_password are required."}, status=status.HTTP_400_BAD_REQUEST)
            
        if not user.check_password(old_password):
            return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
            
        user.set_password(new_password)
        user.must_change_password = False
        user.save()
        return Response({"message": "Password updated successfully."}, status=status.HTTP_200_OK)

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
