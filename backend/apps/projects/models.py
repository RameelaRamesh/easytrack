from django.db import models
from apps.core.models import TenantModel

class Project(TenantModel):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    )

    name = models.CharField(max_length=255)
    client = models.ForeignKey('clients.Client', on_delete=models.CASCADE, related_name='projects')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} (Client: {self.client.name})"
