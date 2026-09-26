from django.db import models
from django.conf import settings
from apps.core.models import TenantModel

class BillingWork(TenantModel):
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    )

    work_id = models.CharField(max_length=50, help_text="Synthetic work ID e.g. WORK-101")
    client = models.ForeignKey('clients.Client', on_delete=models.CASCADE, related_name='billing_work')
    process = models.ForeignKey('processes.Process', on_delete=models.CASCADE, related_name='billing_work')
    
    work_type = models.CharField(max_length=100, default='Deliverable Production') # e.g. Data Processing, Deliverable Production, Verification
    custom_fields = models.JSONField(default=dict, blank=True)
    notes = models.TextField(blank=True, null=True)
    
    # Assignments
    assigned_tl = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_work_tl',
        limit_choices_to={'role': 'tl'}
    )
    assigned_employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_work_emp',
        limit_choices_to={'role': 'employee'}
    )
    
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=50, default='New') # e.g. New, Assigned, In Progress, Completed, QA Review, Rework, Approved
    
    sla_deadline = models.DateTimeField(null=True, blank=True)
    target_quantity = models.IntegerField(default=1)
    actual_quantity = models.IntegerField(default=0)
    due_date = models.DateField(null=True, blank=True)
    
    estimated_effort_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    actual_effort_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    progress = models.IntegerField(default=0, help_text="Percentage 0-100")

    class Meta:
        unique_together = ('organization', 'work_id')

    def __str__(self):
        return f"{self.work_id} - {self.work_type} ({self.status})"
