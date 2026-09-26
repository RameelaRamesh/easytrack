from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ManagementReportViewSet

router = DefaultRouter()
router.register(r'', ManagementReportViewSet, basename='reports')

urlpatterns = [
    path('', include(router.urls)),
]
