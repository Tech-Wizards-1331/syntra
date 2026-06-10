from rest_framework import serializers
from .models import ProblemStatement, ScanCategory


class ProblemStatementSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProblemStatement
        fields = [
            'id',
            'hackathon',
            'title',
            'description',
            'pdf_file',
            'max_teams_allowed',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ScanCategorySerializer(serializers.ModelSerializer):
    scan_count = serializers.SerializerMethodField()

    class Meta:
        model = ScanCategory
        fields = ['id', 'hackathon', 'name', 'is_active', 'display_order', 'created_at', 'scan_count']
        read_only_fields = ['id', 'created_at']

    def get_scan_count(self, obj):
        return getattr(obj, 'scan_count', None) or obj.scan_records.count()


class ScannerScanRequestSerializer(serializers.Serializer):
    qr_token = serializers.UUIDField(required=True)
    scan_category_id = serializers.IntegerField(required=True)


class ScannerSubmitRequestSerializer(serializers.Serializer):
    qr_token = serializers.UUIDField(required=True)
    scan_category_id = serializers.IntegerField(required=True)
    member_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False,
        required=True
    )
    device_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)

