from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomTokenObtainPairView, CEORegistrationView, CurrentUserView, ChangePasswordView, CheckUsernameView, CheckOrgView

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', CEORegistrationView.as_view(), name='ceo_register'),
    path('me/', CurrentUserView.as_view(), name='current_user'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('check-username/', CheckUsernameView.as_view(), name='check_username'),
    path('check-org/', CheckOrgView.as_view(), name='check_org'),
]
