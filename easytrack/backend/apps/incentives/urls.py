from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IncentiveRecordViewSet

router = DefaultRouter()
router.register(r'', IncentiveRecordViewSet, basename='incentives')

urlpatterns = [
    path('', include(router.urls)),
]
