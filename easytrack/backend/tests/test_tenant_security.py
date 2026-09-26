from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.organizations.models import Organization
from apps.employees.models import Employee
from apps.clients.models import Client
from apps.messaging.models import Conversation
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

class TenantSecurityTestCase(APITestCase):
    def setUp(self):
        # 1. Create Organization A & users
        self.org_a = Organization.objects.create(name="Org A")
        self.ceo_a = User.objects.create_user(username="ceo_a", password="password123", role="ceo", organization=self.org_a)
        self.emp_a1 = User.objects.create_user(username="emp_a1", password="password123", role="employee", organization=self.org_a)
        self.emp_a2 = User.objects.create_user(username="emp_a2", password="password123", role="employee", organization=self.org_a)
        
        # Create profiles
        Employee.objects.create(user=self.ceo_a, organization=self.org_a, employee_id="CEO-A")
        Employee.objects.create(user=self.emp_a1, organization=self.org_a, employee_id="EMP-A1")
        Employee.objects.create(user=self.emp_a2, organization=self.org_a, employee_id="EMP-A2")

        # 2. Create Organization B & users
        self.org_b = Organization.objects.create(name="Org B")
        self.ceo_b = User.objects.create_user(username="ceo_b", password="password123", role="ceo", organization=self.org_b)
        self.emp_b1 = User.objects.create_user(username="emp_b1", password="password123", role="employee", organization=self.org_b)
        
        # Create profiles
        Employee.objects.create(user=self.ceo_b, organization=self.org_b, employee_id="CEO-B")
        Employee.objects.create(user=self.emp_b1, organization=self.org_b, employee_id="EMP-B1")

        # 3. Create client belonging to Org B
        self.client_b = Client.objects.create(
            organization=self.org_b,
            client_id="CLIENT-B",
            name="Beacon Health B"
        )

        # 4. Create chat conversation in Org A (between emp_a1 and emp_a2)
        self.conv_a = Conversation.objects.create(organization=self.org_a)
        self.conv_a.participants.add(self.emp_a1, self.emp_a2)

    def authenticate(self, user):
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_cross_tenant_client_access_fails(self):
        """
        User A (from Org A) attempts to access Client from Org B.
        Should return 404 Not Found (or 403 Forbidden).
        """
        self.authenticate(self.ceo_a)
        url = f'/api/clients/{self.client_b.id}/'
        response = self.client.get(url)
        # Should be 404 because queryset is filtered by tenant
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_cross_tenant_client_list_fails(self):
        """
        CEO A lists clients; should only see Org A clients, not Org B clients.
        """
        self.authenticate(self.ceo_a)
        # Create a client in Org A
        client_a = Client.objects.create(organization=self.org_a, client_id="CLIENT-A", name="Apex Health A")
        
        url = '/api/clients/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        ids = [str(item['id']) for item in response.data if 'id' in item]
        # client_a should be present
        self.assertIn(str(client_a.id), ids)
        # client_b should NOT be present
        self.assertNotIn(str(self.client_b.id), ids)

    def test_role_based_permissions(self):
        """
        Employee attempts to access CEO settings; should return 403 Forbidden.
        """
        self.authenticate(self.emp_a1)
        url = '/api/organizations/settings/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_chat_privacy_is_enforced(self):
        """
        User C (CEO A) attempts to access private chat conversation of User A1 and A2.
        Should return 404 (or 403) because CEO is not a participant in the message.
        """
        self.authenticate(self.ceo_a)
        url = f'/api/messages/conversations/{self.conv_a.id}/messages/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
