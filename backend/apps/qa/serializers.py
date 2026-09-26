from rest_framework import serializers
from .models import QualityReview

class QualityReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = QualityReview
        fields = '__all__'
        read_only_fields = ('id', 'organization', 'created_at', 'updated_at', 'created_by', 'updated_by')
