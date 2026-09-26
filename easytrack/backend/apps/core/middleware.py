from django.utils.deprecation import MiddlewareMixin
from .tenant_context import set_current_tenant, clear_current_tenant

class TenantMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if request.user and request.user.is_authenticated:
            # Check if user has an associated organization
            organization = getattr(request.user, 'organization', None)
            request.tenant = organization
            set_current_tenant(organization)
        else:
            request.tenant = None
            set_current_tenant(None)

    def process_response(self, request, response):
        clear_current_tenant()
        return response
