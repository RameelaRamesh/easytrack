from django.db import models
from django.conf import settings
from apps.core.models import TenantModel

class Client(TenantModel):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('onboarding', 'Onboarding'),
    )

    client_id = models.CharField(max_length=50, help_text="Unique client code")
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='onboarding')
    
    # Responsibilities
    ops_head = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_clients_ops',
        limit_choices_to={'role__in': ['operations_head', 'ceo']}
    )
    tl = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_clients_tl',
        limit_choices_to={'role': 'tl'}
    )
    
    # Settings & SLA
    sla = models.JSONField(default=dict, blank=True, help_text="SLA criteria e.g. {'tat_hours': 24, 'accuracy_target': 98.5}")
    working_hours = models.JSONField(default=dict, blank=True, help_text="Working hours config e.g. {'start': '08:00', 'end': '17:00'}")
    escalation_rules = models.JSONField(default=dict, blank=True)
    
    start_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('organization', 'client_id')

    def __str__(self):
        return f"{self.name} ({self.client_id})"
