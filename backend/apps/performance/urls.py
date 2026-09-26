from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PerformanceEvaluationViewSet

router = DefaultRouter()
router.register(r'', PerformanceEvaluationViewSet, basename='performance')

urlpatterns = [
    path('', include(router.urls)),
]
