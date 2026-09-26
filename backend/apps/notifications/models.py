from django.db import models
from apps.core.models import TenantModel

class Notification(TenantModel):
    title = models.CharField(max_length=255, default="Notification")
    desc = models.TextField(blank=True, default="")
    type = models.CharField(max_length=50, default="info") # info, warning, critical, success
    unread = models.BooleanField(default=True)
    details = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.title} ({'Unread' if self.unread else 'Read'})"

class Announcement(TenantModel):
    title = models.CharField(max_length=255)
    summary = models.TextField()
    author = models.CharField(max_length=255, default="HR Management")
    author_role = models.CharField(max_length=50, blank=True, default="")
    scope = models.CharField(max_length=50, default="organization") # public, organization, employees_only, specific_roles, specific_team
    target = models.CharField(max_length=255, default="All Employees")
    target_roles = models.JSONField(default=list, blank=True)
    target_team = models.CharField(max_length=255, blank=True, default="")

    def __str__(self):
        return f"{self.title} - {self.author} ({self.scope})"

