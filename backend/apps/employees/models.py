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

    # 1. Personal Details
    start_date = models.DateField(blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    district_suburb = models.CharField(max_length=100, blank=True, null=True)
    state_postcode = models.CharField(max_length=100, blank=True, null=True)

    # 2. Position & Employment Details
    employment_type = models.CharField(max_length=30, default='full_time')
    work_timing = models.CharField(max_length=100, blank=True, null=True)

    # 3. Educational Details
    highest_qualification = models.CharField(max_length=100, blank=True, null=True)
    specialization = models.CharField(max_length=100, blank=True, null=True)
    college_university = models.CharField(max_length=150, blank=True, null=True)
    graduation_year = models.CharField(max_length=20, blank=True, null=True)
    percentage_cgpa = models.CharField(max_length=20, blank=True, null=True)

    # 4. Bank Account Details
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    branch_name = models.CharField(max_length=100, blank=True, null=True)
    account_holder = models.CharField(max_length=100, blank=True, null=True)
    account_number = models.CharField(max_length=50, blank=True, null=True)
    ifsc_code = models.CharField(max_length=30, blank=True, null=True)

    # 5. Documents Submitted
    doc_passport_photo = models.BooleanField(default=False)
    doc_10th_marksheet = models.BooleanField(default=False)
    doc_approved_id = models.BooleanField(default=False)
    doc_12th_diploma = models.BooleanField(default=False)
    doc_pan_card = models.BooleanField(default=False)
    doc_degree_certificate = models.BooleanField(default=False)
    doc_semester_marksheets = models.BooleanField(default=False)

    # 6. Declaration & Signature
    declaration_candidate_name = models.CharField(max_length=150, blank=True, null=True)
    declaration_signature = models.CharField(max_length=150, blank=True, null=True)
    declaration_date = models.DateField(blank=True, null=True)

    class Meta:
        unique_together = ('organization', 'employee_id')

    def __str__(self):
        return f"{self.employee_id} - {self.user.get_full_name() or self.user.username}"

