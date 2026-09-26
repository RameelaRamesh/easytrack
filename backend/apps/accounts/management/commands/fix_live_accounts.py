from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.organizations.models import Organization
from apps.employees.models import Employee

User = get_user_model()

class Command(BaseCommand):
    help = 'Fixes all existing live user accounts and employee profiles so all users can log in immediately.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Starting live accounts fix..."))

        org = Organization.objects.filter(name__icontains="Vattara").first() or Organization.objects.first()
        if not org:
            org = Organization.objects.create(
                name="Vattara Solutions",
                industry="Information Technology",
                country="India",
                timezone="Asia/Kolkata",
                currency="INR"
            )
            self.stdout.write(self.style.SUCCESS(f"Created organization: {org.name}"))
        else:
            if org.name != "Vattara Solutions":
                org.name = "Vattara Solutions"
                org.save(update_fields=['name'])
                self.stdout.write(self.style.SUCCESS(f"Updated organization name to: {org.name}"))
        
        # Cleanup secondary orgs to prevent unique constraint conflicts
        Organization.objects.exclude(id=org.id).delete()

        users = User.objects.all()
        count = 0
        for user in users:
            modified = False

            # 1. Guarantee account is active
            if not user.is_active:
                user.is_active = True
                modified = True

            # 2. Guarantee user is assigned to organization
            if not user.organization:
                user.organization = org
                modified = True

            # 3. Handle special case for vaishnavi
            if user.username.lower() == 'vaishnavi':
                user.set_password('Vaishnavi@18')
                user.role = 'admin'
                user.is_owner = True
                user.finance_access = True
                user.must_change_password = False
                user.is_active = True
                user.organization = org
                modified = True
                self.stdout.write(self.style.SUCCESS("Reset password and granted Owner/Admin permissions to @vaishnavi."))

            if modified:
                user.save()
                count += 1

            # 4. Guarantee corresponding Employee record exists
            if not hasattr(user, 'employee') or user.employee is None:
                emp_id = f"EMP-{user.id:03d}"
                Employee.objects.get_or_create(
                    user=user,
                    defaults={
                        'organization': user.organization or org,
                        'employee_id': emp_id,
                        'department': 'Management' if user.role in ['admin', 'ceo', 'operations_head'] else 'Operations',
                        'designation': user.get_role_display() if hasattr(user, 'get_role_display') else 'Employee',
                        'status': 'active'
                    }
                )
                self.stdout.write(self.style.SUCCESS(f"Ensured Employee profile for @{user.username}."))

        self.stdout.write(self.style.SUCCESS(f"Successfully fixed {count} live user accounts! Total users: {users.count()}"))
