from django.db import models
from django.conf import settings

class AuditLog(models.Model):
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='audit_logs'
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_actions'
    )
    actor_name = models.CharField(max_length=255, blank=True, null=True)
    actor_role = models.CharField(max_length=100, default="System")
    action = models.CharField(max_length=100) # e.g. LOGIN, UPDATE_PROFILE, REVERT_ACTION, etc.
    category = models.CharField(max_length=100, default="System") # e.g. Auth, Payroll, Employees, Billing, Escalations, System
    details = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    is_revertible = models.BooleanField(default=False)
    is_reverted = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        actor_str = self.actor_name or (self.actor.username if self.actor else "System")
        return f"[{self.category}] {actor_str} - {self.action} at {self.timestamp}"
