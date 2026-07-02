from django import forms

from .models import User
from participant.models import ParticipantProfile


INPUT_CLASS = 'w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none'


class SignUpForm(forms.ModelForm):
    password1 = forms.CharField(
        widget=forms.PasswordInput(
            attrs={'class': INPUT_CLASS, 'placeholder': 'Create a strong password'}
        )
    )
    password2 = forms.CharField(
        widget=forms.PasswordInput(
            attrs={'class': INPUT_CLASS, 'placeholder': 'Re-enter your password'}
        )
    )

    class Meta:
        model = User
        fields = ['full_name', 'email']
        widgets = {
            'full_name': forms.TextInput(
                attrs={'class': INPUT_CLASS, 'placeholder': 'Your full name'}
            ),
            'email': forms.EmailInput(
                attrs={'class': INPUT_CLASS, 'placeholder': 'you@example.com'}
            ),
        }

    def clean_email(self):
        email = self.cleaned_data['email'].strip().lower()
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError('An account with this email already exists.')
        return email

    def clean(self):
        cleaned_data = super().clean()
        if cleaned_data.get('password1') != cleaned_data.get('password2'):
            self.add_error('password2', 'Passwords do not match.')
        return cleaned_data


class LoginForm(forms.Form):
    email = forms.EmailField(
        widget=forms.EmailInput(
            attrs={'class': INPUT_CLASS, 'placeholder': 'you@example.com'}
        )
    )
    password = forms.CharField(
        widget=forms.PasswordInput(
            attrs={'class': INPUT_CLASS, 'placeholder': 'Enter your password'}
        )
    )


class ParticipantProfileForm(forms.ModelForm):
    # Extra field: user can type a new skill not in the dropdown
    custom_skill = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Add a custom skill (e.g. React, Solidity)…',
            'id': 'id_custom_skill',
        }),
        label='Add Custom Skill',
    )

    full_name = forms.CharField(
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Your full name',
        }),
        label='Full Name',
    )

    class Meta:
        model = ParticipantProfile
        fields = ['full_name', 'college', 'semester', 'degree', 'skills']
        widgets = {
            'college': forms.TextInput(
                attrs={'class': 'form-control', 'placeholder': 'Your college/university'}
            ),
            'semester': forms.NumberInput(
                attrs={'class': 'form-control', 'placeholder': 'Current semester (e.g. 4)'}
            ),
            'degree': forms.TextInput(
                attrs={'class': 'form-control', 'placeholder': 'e.g. B.Tech CSE'}
            ),
            'skills': forms.CheckboxSelectMultiple(),
        }
        
    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        if self.user and self.user.full_name:
            self.fields['full_name'].initial = self.user.full_name

    def save(self, commit=True):
        """Create the custom skill(s) (if provided) and attach them to the profile."""
        from participant.models import Skill
        instance = super().save(commit=False)
        if commit:
            instance.save()
        # Handle custom skill(s)
        custom_skills_str = self.cleaned_data.get('custom_skill', '').strip()
        if custom_skills_str:
            new_skills = []
            skill_names = [s.strip() for s in custom_skills_str.split(',') if s.strip()]
            for name in skill_names:
                skill, _ = Skill.objects.get_or_create(
                    name__iexact=name,
                    defaults={'name': name}
                )
                new_skills.append(skill)
            if new_skills:
                self.cleaned_data['skills'] = list(self.cleaned_data.get('skills', [])) + new_skills
        if commit:
            self.save_m2m()
        return instance
