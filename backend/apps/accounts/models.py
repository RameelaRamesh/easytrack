from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('tl', 'Manager / Team Lead'),
        ('hr', 'HR'),
        ('employee', 'Employee'),
        ('ceo', 'CEO'),  # legacy alias for Admin + Finance Access
        ('operations_head', 'Operations Head'),  # legacy alias for Admin without Finance Access
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
    is_owner = models.BooleanField(default=False)
    finance_access = models.BooleanField(default=False)
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='users'
    )
    
    # Track password change requirement
    must_change_password = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'auth_user'

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
