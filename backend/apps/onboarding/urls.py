from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OnboardingChecklistViewSet

router = DefaultRouter()
router.register(r'', OnboardingChecklistViewSet, basename='onboarding')

urlpatterns = [
    path('', include(router.urls)),
]
