import json
import logging

from django.db.models import Count

from django.views import View
from django.views.generic import TemplateView, CreateView, DetailView, DeleteView, UpdateView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib import messages
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse_lazy, reverse
from .models import Hackathon, OrganizerProfile, ProblemStatement, ScanCategory
from .forms import HackathonForm, ProblemStatementForm
from .services.seating import get_teams_for_allocation, allocate

logger = logging.getLogger(__name__)


class OrganizerMixin(LoginRequiredMixin, UserPassesTestMixin):
    """Common mixin: user must be authenticated with organizer role."""
    def test_func(self):
        return getattr(self.request.user, 'role', None) == 'organizer'





class CreateHackathonView(OrganizerMixin, CreateView):
    model = Hackathon
    form_class = HackathonForm
    template_name = 'organizer/create_hackathon.html'
    success_url = reverse_lazy('dashboard')

    def form_valid(self, form):
        # Guard: ensure the organizer profile exists — if it doesn't,
        # show a clear error instead of a raw 500.
        try:
            organizer_profile = self.request.user.organizer_profile
        except OrganizerProfile.DoesNotExist:
            # Auto-create a minimal profile so the user can proceed.
            organizer_profile = OrganizerProfile.objects.create(
                user=self.request.user,
                organization_name=self.request.user.full_name or self.request.user.email,
            )
            logger.warning(
                'Auto-created OrganizerProfile for user %s — profile was missing.',
                self.request.user.email,
            )
        except AttributeError:
            messages.error(
                self.request,
                'Your organizer profile is not set up. Please contact an administrator.',
            )
            return redirect('dashboard')

        form.instance.organizer = organizer_profile
        messages.success(self.request, f'Hackathon "{form.instance.name}" created successfully!')
        return super().form_valid(form)

    def form_invalid(self, form):
        # Collect all errors into a readable summary for the user.
        error_count = sum(len(errs) for errs in form.errors.values())
        messages.error(
            self.request,
            f'Please fix the {error_count} error(s) below before submitting.',
        )
        return super().form_invalid(form)


class HackathonDetailView(OrganizerMixin, DetailView):
    model = Hackathon
    template_name = 'organizer/hackathon_detail.html'
    context_object_name = 'hackathon'

    def test_func(self):
        if not super().test_func():
            return False
        hackathon = self.get_object()
        return hackathon.organizer.user == self.request.user

    def get_queryset(self):
        """Only fetch hackathons for this organizer, with related organizer profile in one query."""
        return (
            Hackathon.objects
            .select_related('organizer', 'organizer__user')
            .filter(organizer__user=self.request.user)
        )

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Use self.object — already fetched by DetailView, avoids a duplicate DB hit
        hackathon = self.object
        context['problem_statements'] = (
            hackathon.problem_statements
            .annotate(teams_count=Count('selected_by_teams'))
            .order_by('-created_at')
        )
        context['scan_categories'] = (
            hackathon.scan_categories
            .annotate(scan_count=Count('scan_records'))
            .order_by('display_order', 'created_at')
        )
        context['room_configuration_json'] = json.dumps(
            hackathon.room_configuration
        ) if hackathon.room_configuration else '[]'
        context['seating_allocation'] = hackathon.seating_allocation
        return context


class EditHackathonView(OrganizerMixin, UpdateView):
    """Allow organizers to edit all hackathon fields."""
    model = Hackathon
    form_class = HackathonForm
    template_name = 'organizer/edit_hackathon.html'

    def test_func(self):
        if not super().test_func():
            return False
        hackathon = self.get_object()
        return hackathon.organizer.user == self.request.user

    def get_success_url(self):
        return reverse('organizer-hackathon-detail', kwargs={'pk': self.object.pk})

    def form_valid(self, form):
        messages.success(self.request, f'Hackathon "{form.instance.name}" updated successfully!')
        return super().form_valid(form)


class AddProblemStatementView(OrganizerMixin, CreateView):
    model = ProblemStatement
    form_class = ProblemStatementForm
    template_name = 'organizer/add_problem_statement.html'

    def test_func(self):
        if not super().test_func():
            return False
        hackathon = get_object_or_404(Hackathon, pk=self.kwargs['hackathon_id'])
        return hackathon.organizer.user == self.request.user

    def form_valid(self, form):
        hackathon = get_object_or_404(Hackathon, pk=self.kwargs['hackathon_id'])
        form.instance.hackathon = hackathon
        messages.success(self.request, f'Problem statement "{form.instance.title}" added.')
        return super().form_valid(form)

    def get_success_url(self):
        return reverse('organizer-hackathon-detail', kwargs={'pk': self.kwargs['hackathon_id']})

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['hackathon'] = get_object_or_404(Hackathon, pk=self.kwargs['hackathon_id'])
        return context


class EditProblemStatementView(OrganizerMixin, UpdateView):
    """Allow organizers to edit an existing problem statement."""
    model = ProblemStatement
    form_class = ProblemStatementForm
    template_name = 'organizer/edit_problem_statement.html'

    def test_func(self):
        if not super().test_func():
            return False
        ps = self.get_object()
        return ps.hackathon.organizer.user == self.request.user

    def get_success_url(self):
        return reverse('organizer-hackathon-detail', kwargs={'pk': self.object.hackathon.pk})

    def form_valid(self, form):
        messages.success(self.request, f'Problem statement "{form.instance.title}" updated.')
        return super().form_valid(form)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['hackathon'] = self.get_object().hackathon
        return context


class DeleteProblemStatementView(OrganizerMixin, DeleteView):
    model = ProblemStatement

    def test_func(self):
        if not super().test_func():
            return False
        ps = self.get_object()
        return ps.hackathon.organizer.user == self.request.user

    def get_success_url(self):
        ps = self.get_object()
        messages.success(self.request, f'Problem statement "{ps.title}" deleted.')
        return reverse('organizer-hackathon-detail', kwargs={'pk': ps.hackathon.pk})

    # Skip confirmation template — POST-only delete
    def get(self, request, *args, **kwargs):
        return self.post(request, *args, **kwargs)


class RunSeatingAllocationView(OrganizerMixin, View):

    def post(self, request, hackathon_id):
        hackathon = get_object_or_404(Hackathon, pk=hackathon_id)
        if hackathon.organizer.user != request.user:
            messages.error(request, 'Permission denied.')
            return redirect('dashboard')

        raw_config = request.POST.get('room_configuration', '').strip()
        if not raw_config:
            messages.error(request, 'Room configuration cannot be empty.')
            return redirect('organizer-hackathon-detail', pk=hackathon_id)

        try:
            rooms_config = json.loads(raw_config)
        except json.JSONDecodeError as e:
            messages.error(request, f'Invalid JSON: {e}')
            return redirect('organizer-hackathon-detail', pk=hackathon_id)

        hackathon.room_configuration = rooms_config
        hackathon.save()

        teams = get_teams_for_allocation(hackathon_id)
        if not teams:
            messages.warning(request, 'No teams found for this hackathon. Room config saved but allocation skipped.')
            return redirect('organizer-hackathon-detail', pk=hackathon_id)

        allocation_result = allocate(teams, rooms_config)
        hackathon.seating_allocation = allocation_result
        hackathon.save()

        messages.success(request, 'Seating allocation completed successfully!')
        return redirect('organizer-hackathon-detail', pk=hackathon_id)


class QRScannerView(OrganizerMixin, View):
    """QR Scanner interface for organizers to scan team QR codes."""

    def test_func(self):
        """Allow organizers and coordinators to access the scanner."""
        user = self.request.user
        if not user.is_authenticated:
            return False
        # Allow organizer role
        if getattr(user, 'role', None) == 'organizer':
            return True
        # Allow coordinators assigned to any hackathon
        if user.is_staff or getattr(user, 'role', None) == 'super_admin':
            return True
        from .models import HackathonCoordinator
        return HackathonCoordinator.objects.filter(user=user, is_active=True).exists()

    def get(self, request, hackathon_id):
        hackathon = get_object_or_404(Hackathon, pk=hackathon_id)

        # Ownership or coordinator check
        is_owner = hackathon.organizer.user == request.user
        from .models import HackathonCoordinator
        is_coordinator = HackathonCoordinator.objects.filter(
            hackathon=hackathon, user=request.user, is_active=True
        ).exists()
        is_admin = request.user.is_staff or getattr(request.user, 'role', None) == 'super_admin'

        if not (is_owner or is_coordinator or is_admin):
            messages.error(request, 'You are not authorized to scan for this hackathon.')
            return redirect('dashboard')

        from .models import ScanCategory
        scan_categories = ScanCategory.objects.filter(
            hackathon=hackathon, is_active=True
        ).order_by('display_order', 'created_at')

        return render(request, 'organizer/qr_scanner.html', {
            'hackathon': hackathon,
            'scan_categories': scan_categories,
        })
