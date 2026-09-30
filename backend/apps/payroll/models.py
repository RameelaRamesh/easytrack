from django.db import models
from apps.core.models import TenantModel

class SalarySlip(TenantModel):
    STATUS_CHOICES = (
        ('Draft', 'Draft'),
        ('Locked by HR', 'Locked by HR'),
        ('Approved by CEO', 'Approved by CEO'),
        ('Rejected by CEO', 'Rejected by CEO'),
        ('Disbursed', 'Disbursed'),
    )

    employee = models.ForeignKey(
        'employees.Employee',
        on_delete=models.CASCADE,
        related_name='salary_slips',
        null=True,
        blank=True
    )
    name = models.CharField(max_length=255, default="Salary Slip")
    period = models.CharField(max_length=20, default="2026-09")
    base_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    overtime_pay = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    bonus = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="Draft")
    remarks = models.TextField(blank=True, default="")
    details = models.JSONField(default=dict, blank=True)

    def save(self, *args, **kwargs):
        try:
            b = float(self.base_salary or 0)
            o = float(self.overtime_pay or 0)
            bon = float(self.bonus or 0)
            d = float(self.deductions or 0)
            net = b + o + bon - d
            self.net_salary = max(0.0, net)
        except (ValueError, TypeError):
            pass
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.period} ({self.status})"
