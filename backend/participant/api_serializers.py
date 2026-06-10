from rest_framework import serializers
from .models import Team, TeamMember, Skill, ParticipantProfile, TeamRequest
from accounts.models import User

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name']

class ParticipantDiscoverySerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    skills = SkillSerializer(many=True, read_only=True)

    class Meta:
        model = ParticipantProfile
        fields = [
            'id', 
            'user_id',
            'user_email', 
            'full_name', 
            'skills', 
            'college', 
            'degree',
            'semester',
        ]

class ParticipantProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParticipantProfile
        fields = ['visibility']

class TeamMemberSerializer(serializers.ModelSerializer):
    skills = SkillSerializer(many=True, read_only=True)
    skill_ids = serializers.PrimaryKeyRelatedField(
        queryset=Skill.objects.all(),
        many=True,
        write_only=True,
        required=False,
    )

    class Meta:
        model = TeamMember
        fields = [
            'id',
            'team',
            'name',
            'email',
            'college',
            'semester',
            'degree',
            'skills',
            'skill_ids',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'skills']

    def create(self, validated_data):
        skill_ids = validated_data.pop('skill_ids', [])
        member = super().create(validated_data)
        if skill_ids:
            member.skills.set(skill_ids)
        return member

    def update(self, instance, validated_data):
        skill_ids = validated_data.pop('skill_ids', None)
        member = super().update(instance, validated_data)
        if skill_ids is not None:
            member.skills.set(skill_ids)
        return member

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

        # Set leader
        validated_data['leader'] = user
        return super().create(validated_data)

class JoinTeamSerializer(serializers.Serializer):
    invite_token = serializers.UUIDField(required=True)

class TeamRequestSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.name', read_only=True)
    hackathon_name = serializers.CharField(source='team.hackathon.name', read_only=True)
    hackathon_id = serializers.IntegerField(source='team.hackathon.id', read_only=True)

    class Meta:
        model = TeamRequest
        fields = ['id', 'team', 'team_name', 'hackathon_name', 'hackathon_id', 'receiver', 'status', 'created_at']
        read_only_fields = ['id', 'status', 'created_at']
        validators = []  # Bypass DRF default unique constraint checks to handle custom resending

    def validate(self, attrs):
        team = attrs['team']
        receiver = attrs['receiver']
        
        # Check if a pending or accepted request already exists
        if TeamRequest.objects.filter(team=team, receiver=receiver, status='pending').exists():
            raise serializers.ValidationError("A pending request already exists for this user.")
        if TeamRequest.objects.filter(team=team, receiver=receiver, status='accepted').exists():
            raise serializers.ValidationError("This user has already accepted your team invite.")
            
        # Delete any previously declined requests first to clear the unique constraint on resend
        TeamRequest.objects.filter(team=team, receiver=receiver, status='declined').delete()
        
        return attrs


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
