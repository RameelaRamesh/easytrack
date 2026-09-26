from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, LogoutView, CEORegistrationView, CurrentUserView,
    ChangePasswordView, GiveAccessView, PublicStaffUsernamesView,
    CheckUsernameView, CheckOrgView, ForgotPasswordView, TransferOwnershipView
)

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', CEORegistrationView.as_view(), name='ceo_register'),
    path('me/', CurrentUserView.as_view(), name='current_user'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('give-access/', GiveAccessView.as_view(), name='give_access'),
    path('transfer-ownership/', TransferOwnershipView.as_view(), name='transfer_ownership'),
    path('public-usernames/', PublicStaffUsernamesView.as_view(), name='public_staff_usernames'),
    path('check-username/', CheckUsernameView.as_view(), name='check_username'),
    path('check-org/', CheckOrgView.as_view(), name='check_org'),
]

