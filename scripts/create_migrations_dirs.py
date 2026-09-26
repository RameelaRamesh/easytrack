import os

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
apps_dir = os.path.join(root_dir, 'backend', 'apps')

# List of all apps
all_apps = [
    'core', 'organizations', 'accounts', 'employees', 'clients', 'processes',
    'projects', 'billing', 'workqueue', 'tasks', 'targets', 'productivity',
    'performance', 'attendance', 'leave_management', 'payroll', 'overtime',
    'incentives', 'qa', 'escalations', 'reports', 'notifications', 'messaging',
    'audit', 'recruitment', 'onboarding', 'training'
]

for app in all_apps:
    migrations_path = os.path.join(apps_dir, app, 'migrations')
    os.makedirs(migrations_path, exist_ok=True)
    init_file = os.path.join(migrations_path, '__init__.py')
    if not os.path.exists(init_file):
        with open(init_file, 'w') as f:
            f.write("# Migrations package\n")

print("Created migrations directories and __init__.py files for all apps.")
