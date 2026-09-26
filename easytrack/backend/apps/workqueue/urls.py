from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkQueueViewSet

router = DefaultRouter()
router.register(r'', WorkQueueViewSet, basename='workqueue')

urlpatterns = [
    path('', include(router.urls)),
]
