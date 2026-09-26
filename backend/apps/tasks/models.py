from django.db import models
from django.conf import settings
from apps.core.models import TenantModel

class Task(TenantModel):
    STATUS_CHOICES = (
        ('todo', 'To Do'),
        ('backlog', 'To Do'),
        ('assigned', 'Assigned'),
        ('in_progress', 'In Progress'),
        ('review', 'Review'),
        ('changes_requested', 'Changes Requested'),
        ('completed', 'Completed'),
        ('on_hold', 'On Hold'),
    )

    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    )

    FLOW_SOURCE_CHOICES = (
        ('management', 'Management/Manager → Team Lead → Employee'),
        ('client_requirement', 'Client Requirement/Meeting → Team Lead → Employee'),
    )

    key = models.CharField(max_length=50, help_text="ET-101 style task key")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    flow_source = models.CharField(max_length=50, choices=FLOW_SOURCE_CHOICES, default='management')
    
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
    team_lead = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tl_tasks'
    )
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tasks'
    )
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tasks'
    )
    team = models.CharField(max_length=100, blank=True, null=True)
    
    due_date = models.DateField(null=True, blank=True)
    sla_hours = models.IntegerField(default=24)
    parent_task = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subtasks')

    # Rich collaboration, reviews and history
    comments = models.JSONField(default=list, blank=True)
    attachments = models.JSONField(default=list, blank=True)
    activity_history = models.JSONField(default=list, blank=True)
    review_notes = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('organization', 'key')

    def __str__(self):
        return f"{self.key}: {self.title} ({self.status})"
