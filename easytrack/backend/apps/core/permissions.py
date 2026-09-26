from rest_framework import permissions

class IsTenantUser(permissions.BasePermission):
    """
    Ensure the user is authenticated and is associated with an organization.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            getattr(request.user, 'organization', None) is not None
        )

class RolePermission(permissions.BasePermission):
    """
    Base permission for role checking.
    """
    allowed_roles = []

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if not getattr(request.user, 'organization', None):
            return False
        
        # Superuser bypass for backend support
        if request.user.is_superuser:
            return True
            
        return request.user.role in self.allowed_roles

class IsCEO(RolePermission):
    allowed_roles = ['ceo']

class IsOperationsHead(RolePermission):
    allowed_roles = ['operations_head', 'ceo'] # Operations head views can also be viewed by CEO

class IsHR(RolePermission):
    allowed_roles = ['hr', 'ceo']

class IsTL(RolePermission):
    allowed_roles = ['tl', 'operations_head', 'ceo']

class IsEmployee(RolePermission):
    allowed_roles = ['employee', 'tl', 'hr', 'operations_head', 'ceo']

class IsQAEnabled(permissions.BasePermission):
    """
    Checks if the employee has QA workspace capability enabled.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Check if the employee profile has qa_enabled = True
        employee = getattr(request.user, 'employee_profile', None)
        if employee and employee.qa_enabled:
            return True
            
        if request.user.role in ['ceo', 'operations_head']:
            return True
            
        return False
