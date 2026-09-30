from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductivityMetricViewSet, VolumeStatusLogViewSet, ActivityCheckLogViewSet

router = DefaultRouter()
router.register(r'volume-status', VolumeStatusLogViewSet, basename='volume-status')
router.register(r'activity-check', ActivityCheckLogViewSet, basename='activity-check')
router.register(r'', ProductivityMetricViewSet, basename='productivity')

urlpatterns = [
    path('', include(router.urls)),
]

