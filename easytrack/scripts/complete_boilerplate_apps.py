import os

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
apps_dir = os.path.join(root_dir, 'backend', 'apps')

remaining_apps = [
    ('recruitment', 'JobOpening'),
    ('onboarding', 'OnboardingChecklist'),
    ('training', 'TrainingProgram'),
    ('payroll', 'SalarySlip'),
    ('overtime', 'OvertimeRequest'),
    ('incentives', 'IncentiveRecord'),
    ('targets', 'OperationalTarget'),
    ('productivity', 'ProductivityMetric'),
    ('performance', 'PerformanceEvaluation'),
    ('qa', 'QualityReview'),
    ('escalations', 'Escalation'),
    ('reports', 'ManagementReport'),
    ('notifications', 'Notification')
]

for app_name, model_name in remaining_apps:
    app_path = os.path.join(apps_dir, app_name)
    
    # 1. models.py
    model_content = f"""from django.db import models
from apps.core.models import TenantModel

class {model_name}(TenantModel):
    name = models.CharField(max_length=255, default="Default {model_name}")
    status = models.CharField(max_length=50, default="Pending")
    details = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{{self.name}} ({{self.status}})"
"""
    with open(os.path.join(app_path, 'models.py'), 'w') as f:
        f.write(model_content)

    # 2. serializers.py
    serializer_content = f"""from rest_framework import serializers
from .models import {model_name}

class {model_name}Serializer(serializers.ModelSerializer):
    class Meta:
        model = {model_name}
        fields = '__all__'
        read_only_fields = ('id', 'organization', 'created_at', 'updated_at', 'created_by', 'updated_by')
"""
    with open(os.path.join(app_path, 'serializers.py'), 'w') as f:
        f.write(serializer_content)

    # 3. views.py
    view_content = f"""from apps.core.views import TenantModelViewSet
from .models import {model_name}
from .serializers import {model_name}Serializer

class {model_name}ViewSet(TenantModelViewSet):
    queryset = {model_name}.objects.all()
    serializer_class = {model_name}Serializer
"""
    with open(os.path.join(app_path, 'views.py'), 'w') as f:
        f.write(view_content)

    # 4. urls.py
    url_content = f"""from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import {model_name}ViewSet

router = DefaultRouter()
router.register(r'', {model_name}ViewSet, basename='{app_name}')

urlpatterns = [
    path('', include(router.urls)),
]
"""
    with open(os.path.join(app_path, 'urls.py'), 'w') as f:
        f.write(url_content)

print("Boilerplate files successfully written for remaining apps.")
