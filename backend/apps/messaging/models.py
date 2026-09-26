from django.db import models
from django.conf import settings
from apps.core.models import TenantModel

class Conversation(TenantModel):
    is_group = models.BooleanField(default=False)
    title = models.CharField(max_length=255, blank=True, default='')
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='conversations')
    
    def __str__(self):
        if self.is_group:
            return f"Group: {self.title} ({self.organization.name})"
        return f"Conversation {self.id} ({self.organization.name})"

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.sender.username} at {self.created_at}"
