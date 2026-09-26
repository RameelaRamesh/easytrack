from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EscalationViewSet

router = DefaultRouter()
router.register(r'', EscalationViewSet, basename='escalations')

urlpatterns = [
    path('', include(router.urls)),
]
