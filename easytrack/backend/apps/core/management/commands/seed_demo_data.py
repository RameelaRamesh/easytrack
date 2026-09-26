from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.organizations.models import Organization
from apps.employees.models import Employee
from apps.clients.models import Client
from apps.processes.models import Process
from apps.projects.models import Project
from apps.billing.models import BillingWork
from apps.tasks.models import Task
from apps.messaging.models import Conversation, Message
from django.db import transaction
import os

User = get_user_model()

class Command(BaseCommand):
    help = "Seed initial development and demo data for EasyTrack"

    def handle(self, *args, **options):
        self.stdout.write("Seeding demo data...")
        
        # Load credentials from env or fallback to defaults
        ceo_username = os.getenv('DEMO_CEO_USERNAME', 'ceo')
        ceo_password = os.getenv('DEMO_CEO_PASSWORD', 'ceo2026')
        
        with transaction.atomic():
            # 1. Create Organization
            org, _ = Organization.objects.get_or_create(
                name="Medical Billing",
                defaults={
                    "industry": "Healthcare",
                    "country": "India",
                    "timezone": "Asia/Kolkata",
                    "currency": "INR",
                    "working_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                    "working_hours": {"start": "09:00", "end": "18:00"},
                    "attendance_rules": {"late_allowed_mins": 15},
                    "leave_rules": {"sick_leave_limit": 10, "casual_leave_limit": 10},
                    "incentive_rules": {
                        "brackets": [
                            {"min_pct": 100, "max_pct": 109, "payout": 200},
                            {"min_pct": 110, "max_pct": 119, "payout": 350},
                            {"min_pct": 120, "max_pct": 999, "payout": 500}
                        ]
                    },
                    "overtime_rules": {"hourly_rate": 150}
                }
            )
            
            # Create Django Superuser if it doesn't exist
            if not User.objects.filter(username='admin').exists():
                User.objects.create_superuser('admin', 'operations@vattara.com', 'admin2026')
                self.stdout.write("Created Django superuser 'admin'.")
            
            # 2. Create CEO
            if not User.objects.filter(username=ceo_username).exists():
                ceo_user = User.objects.create_user(
                    username=ceo_username,
                    email="operations@vattara.com",
                    first_name="Ramesh",
                    last_name="Kumar",
                    password=ceo_password,
                    role="ceo",
                    organization=org,
                    must_change_password=False # For development/demo seeding, do not force change password
                )
                Employee.objects.get_or_create(
                    user=ceo_user,
                    organization=org,
                    employee_id="CEO-001",
                    department="Management",
                    designation="CEO",
                    status="active"
                )
                self.stdout.write(f"Created CEO user '{ceo_username}' (change password on login).")
            else:
                ceo_user = User.objects.get(username=ceo_username)
                ceo_user.email = "operations@vattara.com"
                ceo_user.save()
                
            # 3. Create Operations Head
            ops_user, _ = User.objects.get_or_create(
                username="opshead",
                defaults={
                    "email": "operations@vattara.com",
                    "first_name": "Sanjay",
                    "last_name": "Sharma",
                    "role": "operations_head",
                    "organization": org
                }
            )
            ops_user.email = "operations@vattara.com"
            if _:
                ops_user.set_password("ops2026")
            ops_user.save()
            Employee.objects.get_or_create(
                user=ops_user,
                organization=org,
                employee_id="OPS-001",
                department="Operations",
                designation="Operations Head",
                status="active"
            )

            # 4. Create HR
            hr_user, _ = User.objects.get_or_create(
                username="hrmanager",
                defaults={
                    "email": "operations@vattara.com",
                    "first_name": "Ananya",
                    "last_name": "Sen",
                    "role": "hr",
                    "organization": org
                }
            )
            hr_user.email = "operations@vattara.com"
            if _:
                hr_user.set_password("hr2026")
            hr_user.save()
            Employee.objects.get_or_create(
                user=hr_user,
                organization=org,
                employee_id="HR-001",
                department="HR",
                designation="HR Manager",
                status="active"
            )

            # 5. Create Team Leads (TLs)
            tl1_user, _ = User.objects.get_or_create(
                username="tl1",
                defaults={
                    "email": "operations@vattara.com",
                    "first_name": "Vikram",
                    "last_name": "Rathore",
                    "role": "tl",
                    "organization": org
                }
            )
            tl1_user.email = "operations@vattara.com"
            if _:
                tl1_user.set_password("tl2026")
            tl1_user.save()
            Employee.objects.get_or_create(
                user=tl1_user,
                organization=org,
                employee_id="TL-001",
                department="Operations",
                designation="Team Lead",
                status="active"
            )

            tl2_user, _ = User.objects.get_or_create(
                username="tl2",
                defaults={
                    "email": "operations@vattara.com",
                    "first_name": "Meera",
                    "last_name": "Joshi",
                    "role": "tl",
                    "organization": org
                }
            )
            tl2_user.email = "operations@vattara.com"
            if _:
                tl2_user.set_password("tl2026")
            tl2_user.save()
            Employee.objects.get_or_create(
                user=tl2_user,
                organization=org,
                employee_id="TL-002",
                department="Operations",
                designation="Team Lead",
                status="active"
            )

            # 6. Create 16 Employees
            employees = []
            for i in range(1, 17):
                username = f"emp{i}"
                emp_user, created = User.objects.get_or_create(
                    username=username,
                    defaults={
                        "email": "operations@vattara.com",
                        "first_name": f"Employee",
                        "last_name": f"{i}",
                        "role": "employee",
                        "organization": org
                    }
                )
                emp_user.email = "operations@vattara.com"
                if created:
                    emp_user.set_password("emp2026")
                emp_user.save()
                
                # Assign tl1 to odd, tl2 to even
                assigned_tl = tl1_user if i % 2 != 0 else tl2_user
                
                # QA enabled for first two employees
                qa_enabled = True if i <= 2 else False
                
                emp_profile, _ = Employee.objects.get_or_create(
                    user=emp_user,
                    organization=org,
                    employee_id=f"EMP-2026-{i:03d}",
                    department="Billing Operations",
                    designation="Billing Executive",
                    manager=assigned_tl,
                    status="active",
                    qa_enabled=qa_enabled,
                    base_salary=25000 + (i * 1000),
                    mobile=f"+9198765432{i:02d}"
                )
                employees.append(emp_user)

            # 7. Create Clients
            client_apex, _ = Client.objects.get_or_create(
                organization=org,
                client_id="APEX",
                defaults={
                    "name": "Apex Health Partners",
                    "status": "active",
                    "ops_head": ops_user,
                    "tl": tl1_user,
                    "sla": {"tat_hours": 24, "accuracy_target": 98.5},
                    "working_hours": {"start": "09:00", "end": "18:00"}
                }
            )

            client_beacon, _ = Client.objects.get_or_create(
                organization=org,
                client_id="BEACON",
                defaults={
                    "name": "Beacon Medical Group",
                    "status": "active",
                    "ops_head": ops_user,
                    "tl": tl2_user,
                    "sla": {"tat_hours": 48, "accuracy_target": 97.0},
                    "working_hours": {"start": "08:00", "end": "17:00"}
                }
            )

            # 8. Create Processes
            proc_ev, _ = Process.objects.get_or_create(
                organization=org,
                process_id="APEX-EV",
                defaults={
                    "name": "Eligibility Verification",
                    "client": client_apex,
                    "sop": "1. Fetch patient details.\n2. Query insurance portal.\n3. Log eligibility status.",
                    "target": 50,
                    "status": "active"
                }
            )

            proc_dm, _ = Process.objects.get_or_create(
                organization=org,
                process_id="BEACON-DM",
                defaults={
                    "name": "Denial Management",
                    "client": client_beacon,
                    "sop": "1. Retrieve claims denial code.\n2. Categorize error.\n3. Re-submit or appeal.",
                    "target": 30,
                    "status": "active"
                }
            )

            # 9. Create Projects
            project_apex, _ = Project.objects.get_or_create(
                organization=org,
                name="Apex Claims Project",
                defaults={
                    "client": client_apex,
                    "status": "active",
                    "description": "Standard claims processing and eligibility checking."
                }
            )

            project_beacon, _ = Project.objects.get_or_create(
                organization=org,
                name="Beacon Payment Posting Project",
                defaults={
                    "client": client_beacon,
                    "status": "active",
                    "description": "Processing daily medical payment posting and denial handling."
                }
            )

            # 10. Create Billing Work Items
            BillingWork.objects.get_or_create(
                organization=org,
                work_id="WORK-101",
                defaults={
                    "client": client_apex,
                    "process": proc_ev,
                    "work_type": "Claim Processing",
                    "assigned_tl": tl1_user,
                    "assigned_employee": employees[2], # emp3
                    "priority": "high",
                    "status": "In Progress",
                    "target_quantity": 50,
                    "actual_quantity": 25,
                    "progress": 50
                }
            )

            BillingWork.objects.get_or_create(
                organization=org,
                work_id="WORK-102",
                defaults={
                    "client": client_beacon,
                    "process": proc_dm,
                    "work_type": "Denial Management",
                    "assigned_tl": tl2_user,
                    "assigned_employee": employees[3], # emp4
                    "priority": "medium",
                    "status": "New",
                    "target_quantity": 30,
                    "actual_quantity": 0,
                    "progress": 0
                }
            )

            # 11. Create Jira-style Tasks
            Task.objects.get_or_create(
                organization=org,
                key="ET-101",
                defaults={
                    "title": "Review SOP for Denial Management",
                    "description": "Operations head needs to verify the new rules added for Beacon Medical appeals.",
                    "status": "in_progress",
                    "priority": "high",
                    "assignee": ops_user,
                    "reporter": ceo_user
                }
            )

            Task.objects.get_or_create(
                organization=org,
                key="ET-102",
                defaults={
                    "title": "Update Apex Credentialing details",
                    "description": "Add new clinic listings to database.",
                    "status": "backlog",
                    "priority": "medium",
                    "assignee": tl1_user,
                    "reporter": ops_user
                }
            )

            # 12. Create Private Messaging
            # Conversation between emp3 and tl1
            conv1, c1_created = Conversation.objects.get_or_create(organization=org)
            if c1_created:
                conv1.participants.add(employees[2], tl1_user)
                Message.objects.create(
                    conversation=conv1,
                    sender=employees[2],
                    content="Hello Vikram, I have completed 25 claims for APEX eligibility verification today."
                )
                Message.objects.create(
                    conversation=conv1,
                    sender=tl1_user,
                    content="Great job! Keep it up. Ensure accuracy is maintained."
                )

            # Conversation between tl1 and hrmanager
            conv2, c2_created = Conversation.objects.get_or_create(organization=org)
            if c2_created:
                conv2.participants.add(tl1_user, hr_user)
                Message.objects.create(
                    conversation=conv2,
                    sender=tl1_user,
                    content="Hi Ananya, is the training program schedule for new recruits finalized?"
                )
                Message.objects.create(
                    conversation=conv2,
                    sender=hr_user,
                    content="Yes Vikram, it is scheduled for Monday. I will send you the invite."
                )

        self.stdout.write(self.style.SUCCESS("Successfully seeded demo data!"))
