from django.db import models
from django.conf import settings
from apps.core.models import TenantModel

class Attendance(TenantModel):
    STATUS_CHOICES = (
        ('working', 'Working'),
        ('on_break', 'On Break'),
        ('checked_out', 'Checked Out'),
        ('absent', 'Absent'),
        ('leave', 'On Leave'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    date = models.DateField()
    
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='working')
    
    # Break tracking
    break_start = models.DateTimeField(null=True, blank=True)
    total_break_seconds = models.IntegerField(default=0)
    total_working_seconds = models.IntegerField(default=0)
    overtime_seconds = models.IntegerField(default=0)
    
    shift = models.CharField(max_length=100, default='Day Shift')

    class Meta:
        unique_together = ('user', 'date')

    def __str__(self):
        return f"{self.user.username} - {self.date} ({self.status})"
