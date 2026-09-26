from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from apps.organizations.models import Organization
from apps.employees.models import Employee
from apps.clients.models import Client
from apps.processes.models import Process
from apps.projects.models import Project
from apps.billing.models import BillingWork
from apps.tasks.models import Task
from apps.attendance.models import Attendance
from apps.leave_management.models import LeaveRequest
from apps.overtime.models import OvertimeRequest
from apps.incentives.models import IncentiveRecord
from apps.payroll.models import SalarySlip
from apps.recruitment.models import JobOpening
from apps.audit.models import AuditLog
from apps.notifications.models import Notification, Announcement
from apps.messaging.models import Message, Conversation

User = get_user_model()

class Command(BaseCommand):
    help = "Purge all dummy and seed data for live testing"

    def handle(self, *args, **options):
        self.stdout.write("Purging all dummy data...")

        with transaction.atomic():
            # Delete transactional data
            AuditLog.objects.all().delete()
            Notification.objects.all().delete()
            Announcement.objects.all().delete()
            Message.objects.all().delete()
            Conversation.objects.all().delete()
            JobOpening.objects.all().delete()
            SalarySlip.objects.all().delete()
            IncentiveRecord.objects.all().delete()
            OvertimeRequest.objects.all().delete()
            LeaveRequest.objects.all().delete()
            Attendance.objects.all().delete()
            Task.objects.all().delete()
            BillingWork.objects.all().delete()
            Project.objects.all().delete()
            Process.objects.all().delete()
            Client.objects.all().delete()

            # Clean Organization
            org, _ = Organization.objects.get_or_create(
                name="EasyTrack Operations",
                defaults={
                    "industry": "Medical Billing",
                    "country": "India",
                    "timezone": "Asia/Kolkata",
                    "currency": "INR",
                    "working_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                    "working_hours": {"start": "09:00", "end": "18:00"}
                }
            )

            # Keep only clean ceo user
            Employee.objects.all().delete()
            User.objects.exclude(username='ceo').delete()

            ceo_user = User.objects.filter(username='ceo').first()
            if not ceo_user:
                ceo_user = User.objects.create_superuser(
                    username='ceo',
                    email='ceo@medicalbilling.com',
                    password='password123',
                    first_name='Chief',
                    last_name='Executive',
                    role='ceo',
                    organization=org
                )
            else:
                ceo_user.set_password('password123')
                ceo_user.role = 'ceo'
                ceo_user.organization = org
                ceo_user.is_superuser = True
                ceo_user.save()

            Employee.objects.create(
                user=ceo_user,
                organization=org,
                employee_id='EMP-001',
                department='Executive',
                designation='Chief Executive Officer',
                base_salary=0,
                status='active'
            )

        self.stdout.write(self.style.SUCCESS("All dummy data purged successfully! Database is clean for live testing."))
