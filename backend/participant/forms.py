from django import forms
from .models import Team, TeamMember

class TeamRegistrationForm(forms.ModelForm):
    class Meta:
        model = Team
        fields = ['name']

class TeamMemberForm(forms.ModelForm):
    additional_skills = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={'placeholder': 'Enter new skills separated by commas (e.g. Vue, Rust)...'}),
    )

    class Meta:
        model = TeamMember
        fields = ['name', 'email', 'college', 'semester', 'degree', 'skills', 'additional_skills']
        widgets = {
            'skills': forms.CheckboxSelectMultiple()
        }
