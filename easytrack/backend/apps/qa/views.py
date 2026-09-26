from apps.core.views import TenantModelViewSet
from .models import QualityReview
from .serializers import QualityReviewSerializer

class QualityReviewViewSet(TenantModelViewSet):
    queryset = QualityReview.objects.all()
    serializer_class = QualityReviewSerializer
