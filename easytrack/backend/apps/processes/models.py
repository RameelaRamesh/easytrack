from django.db import models
from apps.core.models import TenantModel

class Process(TenantModel):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    )

    process_id = models.CharField(max_length=50)
    name = models.CharField(max_length=255)
    client = models.ForeignKey('clients.Client', on_delete=models.CASCADE, related_name='processes')
    
    # Process properties
    sop = models.TextField(blank=True, null=True, help_text="SOP text or versioned document reference")
    sla = models.JSONField(default=dict, blank=True, help_text="SLA terms for this process")
    target = models.IntegerField(default=100, help_text="Daily target quantity per employee")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    class Meta:
        unique_together = ('organization', 'process_id')

    def __str__(self):
        return f"{self.client.name} - {self.name} ({self.process_id})"
