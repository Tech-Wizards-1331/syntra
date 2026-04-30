from rest_framework import serializers
from .models import ProblemStatement


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
