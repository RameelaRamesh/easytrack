from django.db import models
from django.conf import settings
from apps.core.models import TenantModel

class ProductivityMetric(TenantModel):
    name = models.CharField(max_length=255, default="Default ProductivityMetric")
    status = models.CharField(max_length=50, default="Pending")
    details = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.name} ({self.status})"

class VolumeStatusLog(TenantModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='volume_logs', null=True, blank=True)
    status = models.CharField(max_length=50, default='available') # available, empty
    logged_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')

    def __str__(self):
        return f"{self.user} - Volume {self.status}"

class ActivityCheckLog(TenantModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='activity_checks', null=True, blank=True)
    attempt_number = models.IntegerField(default=1) # 1, 2, 3
    interval_minutes = models.IntegerField(default=2) # 2, 3, 5
    responded = models.BooleanField(default=False)
    escalated = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.user} - Check #{self.attempt_number} ({'Responded' if self.responded else 'Missed'})"

