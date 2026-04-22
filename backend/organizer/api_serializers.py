from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Hackathon, HackathonCoordinator, ProblemStatement

User = get_user_model()


class HackathonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hackathon
        fields = '__all__'
        read_only_fields = ('organizer', 'created_at', 'updated_at')

    def validate(self, attrs):
        """Enforce logical date ordering and team size constraints."""
        # For PATCH requests, merge incoming attrs with existing instance values
        if self.instance:
            reg_start = attrs.get('registration_start', self.instance.registration_start)
            reg_end   = attrs.get('registration_deadline', self.instance.registration_deadline)
            evt_start = attrs.get('start_date', self.instance.start_date)
            evt_end   = attrs.get('end_date', self.instance.end_date)
            min_team  = attrs.get('min_team_size', self.instance.min_team_size)
            max_team  = attrs.get('max_team_size', self.instance.max_team_size)
        else:
            reg_start = attrs.get('registration_start')
            reg_end   = attrs.get('registration_deadline')
            evt_start = attrs.get('start_date')
            evt_end   = attrs.get('end_date')
            min_team  = attrs.get('min_team_size', 1)
            max_team  = attrs.get('max_team_size', 4)

        errors = {}

        if reg_start and reg_end and reg_start >= reg_end:
            errors['registration_start'] = 'Registration open date must be before the registration close date.'

        if reg_end and evt_start and reg_end > evt_start:
            errors['registration_deadline'] = 'Registration close date must not be after the event start date.'

        if evt_start and evt_end and evt_start >= evt_end:
            errors['start_date'] = 'Event start date must be before the event end date.'

        if reg_start and evt_start and reg_start >= evt_start:
            errors['registration_start'] = errors.get('registration_start', '') + ' Registration open date must be before the event start date.'

        if min_team is not None and max_team is not None and min_team > max_team:
            errors['min_team_size'] = 'Min team size cannot be greater than max team size.'

        if errors:
            raise serializers.ValidationError(errors)

        return attrs


class HackathonCoordinatorSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = HackathonCoordinator
        fields = ['id', 'user', 'user_email', 'hackathon', 'created_at']
        read_only_fields = ('created_at', 'hackathon')


class ProblemStatementSerializer(serializers.ModelSerializer):
    pdf_file_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ProblemStatement
        fields = [
            'id', 'hackathon', 'title', 'description',
            'pdf_file', 'pdf_file_url', 'max_team_allowed',
            'is_active', 'created_at',
        ]
        read_only_fields = ('hackathon', 'created_at')

    def get_pdf_file_url(self, obj):
        request = self.context.get('request')
        if obj.pdf_file and request:
            return request.build_absolute_uri(obj.pdf_file.url)
        return None

    def validate_pdf_file(self, value):
        """Serializer-level PDF validation (defense-in-depth)."""
        import os
        ext = os.path.splitext(value.name)[1].lower()
        if ext != '.pdf':
            raise serializers.ValidationError('Only PDF files are allowed.')
        # 10 MB limit
        max_size = 10 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError('PDF file size must not exceed 10 MB.')
        return value
