from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BillingWorkViewSet

router = DefaultRouter()
router.register(r'', BillingWorkViewSet, basename='billingwork')

urlpatterns = [
    path('', include(router.urls)),
]
