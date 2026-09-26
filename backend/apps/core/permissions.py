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

class IsAdmin(RolePermission):
    allowed_roles = ['admin', 'ceo', 'operations_head']

class HasFinanceAccess(permissions.BasePermission):
    """
    Checks if the user has Finance Access permission (CEO / Owner level).
    Admin + Finance Access = CEO / Owner.
    Admin without Finance Access = Operations Head.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser:
            return True
        if request.user.role in ['ceo', 'admin']:
            if hasattr(request.user, 'finance_access'):
                return bool(request.user.finance_access or request.user.role == 'ceo')
            return request.user.role == 'ceo' or request.user.username not in ['ops_head', 'opshead']
        return False

class IsCEO(HasFinanceAccess):
    pass

class IsOperationsHead(IsAdmin):
    pass

class IsHR(RolePermission):
    allowed_roles = ['hr', 'admin', 'ceo']

class IsTL(RolePermission):
    allowed_roles = ['tl', 'admin', 'operations_head', 'ceo']

class IsEmployee(RolePermission):
    allowed_roles = ['employee', 'tl', 'hr', 'admin', 'operations_head', 'ceo']

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
            
        if request.user.role in ['admin', 'ceo', 'operations_head']:
            return True
            
        return False
