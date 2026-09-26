from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/auth/', include('apps.accounts.urls')),
    path('api/organizations/', include('apps.organizations.urls')),
    path('api/employees/', include('apps.employees.urls')),
    path('api/clients/', include('apps.clients.urls')),
    path('api/processes/', include('apps.processes.urls')),
    path('api/projects/', include('apps.projects.urls')),
    path('api/billing/', include('apps.billing.urls')),
    path('api/workqueue/', include('apps.workqueue.urls')),
    path('api/tasks/', include('apps.tasks.urls')),
    path('api/targets/', include('apps.targets.urls')),
    path('api/productivity/', include('apps.productivity.urls')),
    path('api/performance/', include('apps.performance.urls')),
    path('api/attendance/', include('apps.attendance.urls')),
    path('api/leave/', include('apps.leave_management.urls')),
    path('api/overtime/', include('apps.overtime.urls')),
    path('api/incentives/', include('apps.incentives.urls')),
    path('api/payroll/', include('apps.payroll.urls')),
    path('api/qa/', include('apps.qa.urls')),
    path('api/escalations/', include('apps.escalations.urls')),
    path('api/reports/', include('apps.reports.urls')),
    path('api/messages/', include('apps.messaging.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/announcements/', include('apps.notifications.announcement_urls')),
    path('api/audit/', include('apps.audit.urls')),
    path('api/recruitment/', include('apps.recruitment.urls')),
    path('api/onboarding/', include('apps.onboarding.urls')),
    path('api/training/', include('apps.training.urls')),
]
