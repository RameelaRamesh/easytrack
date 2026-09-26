from django.db import models
import uuid

class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    logo = models.ImageField(upload_to='org_logos/', null=True, blank=True)
    industry = models.CharField(max_length=100, default='Healthcare')
    country = models.CharField(max_length=100, default='India')
    address = models.TextField(blank=True, null=True)
    contact = models.CharField(max_length=100, blank=True, null=True)
    timezone = models.CharField(max_length=100, default='Asia/Kolkata')
    currency = models.CharField(max_length=10, default='INR')
    
    # Settings / Policies
    working_days = models.JSONField(default=list, blank=True) # e.g. ["Monday", "Tuesday", ...]
    working_hours = models.JSONField(default=dict, blank=True) # e.g. {"start": "09:00", "end": "18:00"}
    holiday_policy = models.TextField(blank=True, null=True)
    attendance_rules = models.JSONField(default=dict, blank=True)
    leave_rules = models.JSONField(default=dict, blank=True)
    incentive_rules = models.JSONField(default=dict, blank=True)
    overtime_rules = models.JSONField(default=dict, blank=True)
    notification_settings = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
