from django.db import models
from django.conf import settings
from apps.core.models import TenantModel

class Task(TenantModel):
    STATUS_CHOICES = (
        ('backlog', 'Backlog'),
        ('assigned', 'Assigned'),
        ('in_progress', 'In Progress'),
        ('review', 'Review'),
        ('completed', 'Completed'),
        ('on_hold', 'On Hold'),
    )

    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    )

    key = models.CharField(max_length=50, help_text="ET-101 style task key")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='backlog')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks'
    )
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reported_tasks'
    )
    
    due_date = models.DateField(null=True, blank=True)
    sla_hours = models.IntegerField(default=24)
    parent_task = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subtasks')

    class Meta:
        unique_together = ('organization', 'key')

    def __str__(self):
        return f"{self.key}: {self.title} ({self.status})"
