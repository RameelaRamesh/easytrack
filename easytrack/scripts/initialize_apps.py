import os
import sys

# Define root easytrack path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
apps_dir = os.path.join(root_dir, 'backend', 'apps')

# List of all apps to initialize
all_apps = [
    'recruitment', 'onboarding', 'training', 'attendance', 'leave_management',
    'payroll', 'overtime', 'incentives', 'clients', 'processes', 'projects',
    'billing', 'workqueue', 'tasks', 'targets', 'productivity', 'performance',
    'qa', 'escalations', 'reports', 'notifications', 'messaging', 'audit'
]

# Boilerplate code generators
def create_app_files(app_name):
    app_path = os.path.join(apps_dir, app_name)
    os.makedirs(app_path, exist_ok=True)
    
    # __init__.py
    with open(os.path.join(app_path, '__init__.py'), 'w') as f:
        f.write(f"# {app_name} package\n")
        
    # apps.py
    class_name = "".join([x.capitalize() for x in app_name.split('_')])
    with open(os.path.join(app_path, 'apps.py'), 'w') as f:
        f.write(f"from django.apps import AppConfig\n\n")
        f.write(f"class {class_name}Config(AppConfig):\n")
        f.write(f"    default_auto_field = 'django.db.models.BigAutoField'\n")
        f.write(f"    name = 'apps.{app_name}'\n")

    # models.py, serializers.py, views.py, urls.py will be generated specifically if not major apps

# Initialize standard structures
for app in all_apps:
    create_app_files(app)
    
print("All app directories and configurations generated successfully.")
