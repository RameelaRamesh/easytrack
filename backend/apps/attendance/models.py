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
    
    # HR / Ops Verification Fields
    verification_status = models.CharField(max_length=30, null=True, blank=True)
    verified_by_id = models.CharField(max_length=100, null=True, blank=True)
    verified_by_name = models.CharField(max_length=150, null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    # Break tracking
    break_start = models.DateTimeField(null=True, blank=True)
    total_break_seconds = models.IntegerField(default=0)
    total_working_seconds = models.IntegerField(default=0)
    overtime_seconds = models.IntegerField(default=0)
    
    shift = models.CharField(max_length=100, default='Day Shift')

    class Meta:
        unique_together = ('user', 'date')

    def save(self, *args, **kwargs):
        if self.check_in and self.check_out:
            total_dur = int((self.check_out - self.check_in).total_seconds())
            calc_working = max(0, total_dur - (self.total_break_seconds or 0))
            if self.total_working_seconds == 0 or self.total_working_seconds is None:
                self.total_working_seconds = calc_working
            if self.total_working_seconds > 28800:
                self.overtime_seconds = self.total_working_seconds - 28800
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.date} ({self.status})"
