from django.db import models
from django.conf import settings
from apps.core.models import TenantModel

class LeaveRequest(TenantModel):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('recommended', 'Recommended'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    )

    LEAVE_TYPES = (
        ('sick', 'Sick Leave'),
        ('casual', 'Casual Leave'),
        ('earned', 'Earned Leave'),
        ('lop', 'Loss of Pay'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='leave_requests'
    )
    start_date = models.DateField()
    end_date = models.DateField()
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPES, default='casual')
    reason = models.TextField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_leaves'
    )
    review_comments = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} - {self.start_date} to {self.end_date} ({self.status})"
