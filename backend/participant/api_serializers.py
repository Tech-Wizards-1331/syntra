from rest_framework import serializers
from .models import Team, TeamMember, Skill, ParticipantProfile
from accounts.models import User

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name']

class ParticipantDiscoverySerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    skills = SkillSerializer(many=True, read_only=True)

    class Meta:
        model = ParticipantProfile
        fields = [
            'id', 
            'user_email', 
            'full_name', 
            'skills', 
            'github_link', 
            'college', 
            'experience', 
            'looking_for_team'
        ]

class TeamMemberSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = TeamMember
        fields = [
            'id', 'team', 'hackathon', 'user', 'user_email', 'user_name',
            'name', 'email', 'member_role', 'joined_at'
        ]
        read_only_fields = ['id', 'hackathon', 'joined_at', 'member_role']

    def validate(self, attrs):
        user = attrs.get('user')
        name = attrs.get('name')
        email = attrs.get('email')

        if not user and not (name and email):
            raise serializers.ValidationError("Either a registered user must be selected, or a name and email must be provided.")
        
        return attrs

class TeamSerializer(serializers.ModelSerializer):
    members = TeamMemberSerializer(many=True, read_only=True)
    leader_email = serializers.EmailField(source='leader.email', read_only=True)

    class Meta:
        model = Team
        fields = [
            'id', 'hackathon', 'name', 'leader', 'leader_email', 
            'invite_token', 'created_at', 'updated_at', 'members'
        ]
        read_only_fields = ['id', 'leader', 'invite_token', 'created_at', 'updated_at']

    def create(self, validated_data):
        user = self.context['request'].user
        hackathon = validated_data['hackathon']
        
        # Set leader
        validated_data['leader'] = user

        team = super().create(validated_data)

        # Automatically add leader as a TeamMember
        TeamMember.objects.create(
            team=team,
            hackathon=hackathon,
            user=user,
            member_role='Leader'
        )
        return team

class JoinTeamSerializer(serializers.Serializer):
    invite_token = serializers.UUIDField(required=True)


class SelectProblemStatementSerializer(serializers.Serializer):
    problem_statement_id = serializers.IntegerField(required=True)


class ParticipantProblemStatementSerializer(serializers.ModelSerializer):
    """Read-only serializer for participants to view problem statements with capacity info."""
    current_teams_count = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)

    class Meta:
        from organizer.models import ProblemStatement
        model = ProblemStatement
        fields = [
            'id',
            'title',
            'description',
            'pdf_file',
            'max_teams_allowed',
            'current_teams_count',
            'is_full',
        ]
        read_only_fields = fields
