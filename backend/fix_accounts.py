import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
django.setup()

from apps.accounts.models import User
from apps.organizations.models import Organization
from django.contrib.auth import authenticate

# Ensure organization exists
org = Organization.objects.first()
if not org:
    org = Organization.objects.create(
        name="Vattara Solutions",
        industry="Healthcare",
        country="India",
        timezone="Asia/Kolkata",
        currency="INR"
    )
    print(f"Created organization: {org.name}")

# 1. Update users email to operations@vattara.com (excluding existing accounts vattara and vaishnavi)
User.objects.exclude(username__in=['vattara', 'vaishnavi']).update(email='operations@vattara.com')

# 2. Create or Update distinct new CEO user: ceo / ceo2026
ceo, created = User.objects.get_or_create(username='ceo', defaults={
    'email': 'operations@vattara.com',
    'first_name': 'CEO',
    'last_name': 'Executive',
    'role': 'ceo',
    'organization': org,
    'is_active': True,
    'must_change_password': False
})
ceo.set_password('ceo2026')
ceo.role = 'ceo'
ceo.organization = org
ceo.email = 'operations@vattara.com'
ceo.is_active = True
ceo.must_change_password = False
ceo.save()

# 3. Create or Update HR user: hrmanager / hr2026
for hr_uname in ['hrmanager', 'hr']:
    hr_u, _ = User.objects.get_or_create(username=hr_uname, defaults={
        'email': 'operations@vattara.com',
        'first_name': 'HR',
        'last_name': 'Manager',
        'role': 'hr',
        'organization': org,
        'is_active': True,
        'must_change_password': False
    })
    hr_u.set_password('hr2026')
    hr_u.role = 'hr'
    hr_u.organization = org
    hr_u.email = 'operations@vattara.com'
    hr_u.is_active = True
    hr_u.must_change_password = False
    hr_u.save()

print("==========================================")
print("VERIFYING AUTHENTICATION:")
print("CEO Login ('ceo', 'ceo2026'):", "SUCCESS" if authenticate(username='ceo', password='ceo2026') else "FAILED")
print("HR Login ('hrmanager', 'hr2026'):", "SUCCESS" if authenticate(username='hrmanager', password='hr2026') else "FAILED")
print("==========================================")

print("ALL AVAILABLE USERS IN DATABASE:")
for user in User.objects.all():
    print(f" - Username: {user.username} | Email: {user.email} | Role: {user.role} | Active: {user.is_active} | Org: {user.organization.name if user.organization else None}")
print("==========================================")
