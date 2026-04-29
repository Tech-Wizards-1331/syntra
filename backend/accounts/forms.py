from django import forms

from .models import User


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
        if User.objects.filter(email__iexact=email).exists():
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



