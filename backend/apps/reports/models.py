from django.db import models
from apps.core.models import TenantModel

class ManagementReport(TenantModel):
    name = models.CharField(max_length=255, default="Default ManagementReport")
    status = models.CharField(max_length=50, default="Pending")
    details = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.name} ({self.status})"
