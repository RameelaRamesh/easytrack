from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OperationalTargetViewSet

router = DefaultRouter()
router.register(r'', OperationalTargetViewSet, basename='targets')

urlpatterns = [
    path('', include(router.urls)),
]
