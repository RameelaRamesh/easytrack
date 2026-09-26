from django.db import models
from django.conf import settings
from apps.core.models import TenantModel

class Employee(TenantModel):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('terminated', 'Terminated'),
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='employee_profile'
    )
    employee_id = models.CharField(max_length=50, help_text="Unique within organization")
    department = models.CharField(max_length=100, blank=True, null=True)
    designation = models.CharField(max_length=100, blank=True, null=True)
    
    # Reporting hierarchy
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_employees',
        limit_choices_to={'role__in': ['tl', 'operations_head', 'ceo']}
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    qa_enabled = models.BooleanField(default=False)
    
    # Sensitive personal information
    mobile = models.CharField(max_length=20, blank=True, null=True)
    base_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    leave_balance = models.IntegerField(default=15)
    
    class Meta:
        unique_together = ('organization', 'employee_id')

    def __str__(self):
        return f"{self.employee_id} - {self.user.get_full_name() or self.user.username}"
