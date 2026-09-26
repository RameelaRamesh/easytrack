from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QualityReviewViewSet

router = DefaultRouter()
router.register(r'', QualityReviewViewSet, basename='qa')

urlpatterns = [
    path('', include(router.urls)),
]
