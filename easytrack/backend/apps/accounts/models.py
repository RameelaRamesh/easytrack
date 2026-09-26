from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('ceo', 'CEO'),
        ('operations_head', 'Operations Head'),
        ('hr', 'HR'),
        ('tl', 'Team Lead'),
        ('employee', 'Employee'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
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
