import os

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pages_dir = os.path.join(root_dir, 'frontend', 'src', 'pages')

files_to_update = [
    os.path.join(pages_dir, 'settings', 'SettingsPage.tsx'),
    os.path.join(pages_dir, 'employees', 'EmployeesPage.tsx'),
    os.path.join(pages_dir, 'clients', 'ClientsPage.tsx'),
    os.path.join(pages_dir, 'projects', 'ProjectsPage.tsx'),
    os.path.join(pages_dir, 'billing', 'BillingPage.tsx'),
    os.path.join(pages_dir, 'audit', 'AuditPage.tsx'),
    os.path.join(pages_dir, 'processes', 'ProcessesPage.tsx'),
    os.path.join(pages_dir, 'tasks', 'TasksPage.tsx'),
    os.path.join(pages_dir, 'attendance', 'AttendancePage.tsx'),
    os.path.join(pages_dir, 'leave', 'LeavePage.tsx'),
    os.path.join(pages_dir, 'payroll', 'PayrollPage.tsx'),
    os.path.join(pages_dir, 'qa', 'QAPage.tsx'),
    os.path.join(pages_dir, 'escalations', 'EscalationsPage.tsx'),
    os.path.join(pages_dir, 'ceo', 'Dashboard.tsx'),
    os.path.join(pages_dir, 'employee', 'Dashboard.tsx'),
    os.path.join(pages_dir, 'chat', 'ChatPage.tsx'),
]

replacements = [
    # Backgrounds
    ('bg-teal-600', 'bg-brand-primary'),
    ('bg-teal-500', 'bg-brand-primary'),
    ('bg-indigo-600', 'bg-brand-primary'),
    ('bg-emerald-600', 'bg-brand-primary'),
    ('hover:bg-teal-700', 'bg-brand-primary-hover'),
    ('hover:bg-indigo-700', 'bg-brand-primary-hover'),
    ('hover:bg-emerald-700', 'bg-brand-primary-hover'),
    
    # Texts
    ('text-teal-600', 'text-brand-primary'),
    ('text-teal-650', 'text-brand-primary'),
    ('text-indigo-600', 'text-brand-primary'),
    ('text-indigo-650', 'text-brand-primary'),
    ('text-slate-650', 'text-brand-primary'),
    ('text-teal-400', 'text-brand-primary'),
    
    # Lights
    ('bg-teal-50', 'bg-brand-primary-light'),
    ('bg-indigo-50', 'bg-brand-primary-light'),
    ('bg-emerald-50', 'bg-brand-primary-light'),
    ('bg-sky-50', 'bg-brand-primary-light'),
    ('bg-amber-50', 'bg-brand-primary-light'),
]

for filepath in files_to_update:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original = content
        for target, replacement in replacements:
            content = content.replace(target, replacement)
            
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated: {os.path.basename(filepath)}")

print("All page components successfully updated to dynamic brand colors.")
