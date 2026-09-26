from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from apps.core.views import TenantModelViewSet
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from django.db import transaction
from django.contrib.auth import get_user_model

User = get_user_model()

class ConversationViewSet(TenantModelViewSet):
    queryset = Conversation.objects.all()
    serializer_class = ConversationSerializer

    def get_queryset(self):
        # Crucial security control: only show conversations the logged-in user is a participant of.
        # This keeps messaging completely private from CEO, HR, and other higher-ups.
        qs = super().get_queryset()
        if not self.request.user.is_authenticated:
            return Conversation.objects.none()
        return qs.filter(participants=self.request.user).distinct()

    @action(detail=False, methods=['post'], url_path='create-group')
    def create_group(self, request):
        """
        Create a group conversation with multiple participants.
        """
        title = request.data.get('title')
        member_ids = request.data.get('member_ids', [])

        if not title or not title.strip():
            return Response({"error": "Group title is required"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            conv = Conversation.objects.create(
                organization=request.user.organization,
                is_group=True,
                title=title.strip()
            )
            conv.participants.add(request.user)

            if member_ids:
                members = User.objects.filter(id__in=member_ids, organization=request.user.organization)
                conv.participants.add(*members)

            # Audit Trail
            from apps.audit.models import AuditLog
            AuditLog.objects.create(
                organization=request.user.organization,
                actor=request.user,
                action='create_group_chat',
                details=f"Group chat '{title}' created by {request.user.username} with {conv.participants.count()} members."
            )

        return Response(ConversationSerializer(conv, context={'request': request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get', 'post'], url_path='messages')
    def messages(self, request, pk=None):
        conversation = self.get_object() # Autofiltered to user participations
        
        if request.method == 'GET':
            messages = conversation.messages.order_by('created_at')
            
            # Mark messages sent by the other participant as read
            conversation.messages.exclude(sender=request.user).update(is_read=True)
            
            serializer = MessageSerializer(messages, many=True)
            return Response(serializer.data)
            
        elif request.method == 'POST':
            content = request.data.get('content')
            if not content:
                return Response({"error": "Content is required"}, status=status.HTTP_400_BAD_REQUEST)
                
            with transaction.atomic():
                msg = Message.objects.create(
                    conversation=conversation,
                    sender=request.user,
                    content=content
                )
                
                # Write to audit trail (only metadata, never message content)
                from apps.audit.models import AuditLog
                AuditLog.objects.create(
                    organization=request.user.organization,
                    actor=request.user,
                    action='send_message',
                    details=f"User {request.user.username} sent message in Conversation {conversation.id}."
                )
                
            return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='start')
    def start_conversation(self, request):
        """
        Get or create a 1-to-1 conversation with another user.
        """
        other_user_id = request.data.get('user_id')
        if not other_user_id:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            other_user = User.objects.get(id=other_user_id, organization=request.user.organization)
        except User.DoesNotExist:
            return Response({"error": "Recipient user not found in your organization."}, status=status.HTTP_404_NOT_FOUND)
            
        if other_user == request.user:
            return Response({"error": "Cannot chat with yourself."}, status=status.HTTP_400_BAD_REQUEST)

        # Look for existing conversation between these two (non-group)
        conv = Conversation.objects.filter(
            organization=request.user.organization,
            is_group=False,
            participants=request.user
        ).filter(
            participants=other_user
        ).first()

        if not conv:
            with transaction.atomic():
                conv = Conversation.objects.create(organization=request.user.organization, is_group=False)
                conv.participants.add(request.user, other_user)
                
                # Write to audit trail
                from apps.audit.models import AuditLog
                AuditLog.objects.create(
                    organization=request.user.organization,
                    actor=request.user,
                    action='create_conversation',
                    details=f"Conversation created between {request.user.username} and {other_user.username}."
                )
                
        return Response(ConversationSerializer(conv, context={'request': request}).data)
