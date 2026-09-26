import os

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
apps_dir = os.path.join(root_dir, 'backend', 'apps')

# Register admin for each app based on their models
admin_registrations = [
    ('organizations', 'Organization', 'from .models import Organization'),
    ('accounts', 'User', 'from django.contrib.auth.admin import UserAdmin\nfrom .models import User'),
    ('employees', 'Employee', 'from .models import Employee'),
    ('clients', 'Client', 'from .models import Client'),
    ('processes', 'Process', 'from .models import Process'),
    ('projects', 'Project', 'from .models import Project'),
    ('billing', 'BillingWork', 'from .models import BillingWork'),
    ('tasks', 'Task', 'from .models import Task'),
    ('attendance', 'Attendance', 'from .models import Attendance'),
    ('leave_management', 'LeaveRequest', 'from .models import LeaveRequest'),
    ('messaging', 'Conversation', 'from .models import Conversation'),
    ('audit', 'AuditLog', 'from .models import AuditLog'),
    ('recruitment', 'JobOpening', 'from .models import JobOpening'),
    ('onboarding', 'OnboardingChecklist', 'from .models import OnboardingChecklist'),
    ('training', 'TrainingProgram', 'from .models import TrainingProgram'),
    ('payroll', 'SalarySlip', 'from .models import SalarySlip'),
    ('overtime', 'OvertimeRequest', 'from .models import OvertimeRequest'),
    ('incentives', 'IncentiveRecord', 'from .models import IncentiveRecord'),
    ('targets', 'OperationalTarget', 'from .models import OperationalTarget'),
    ('productivity', 'ProductivityMetric', 'from .models import ProductivityMetric'),
    ('performance', 'PerformanceEvaluation', 'from .models import PerformanceEvaluation'),
    ('qa', 'QualityReview', 'from .models import QualityReview'),
    ('escalations', 'Escalation', 'from .models import Escalation'),
    ('reports', 'ManagementReport', 'from .models import ManagementReport'),
    ('notifications', 'Notification', 'from .models import Notification'),
]

# Write register script
for app_name, model_name, import_stmt in admin_registrations:
    app_path = os.path.join(apps_dir, app_name)
    
    if app_name == 'accounts':
        admin_content = f"""from django.contrib import admin
{import_stmt}

admin.site.register(User, UserAdmin)
"""
    else:
        admin_content = f"""from django.contrib import admin
{import_stmt}

admin.site.register({model_name})
"""
    
    with open(os.path.join(app_path, 'admin.py'), 'w') as f:
        f.write(admin_content)

# For apps/core, create empty admin.py
with open(os.path.join(apps_dir, 'core', 'admin.py'), 'w') as f:
    f.write("# Register core models here\n")

print("Admin registrations successfully generated.")
