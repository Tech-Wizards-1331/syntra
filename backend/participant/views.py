from django.shortcuts import render, redirect, get_object_or_404
from django.views.generic import ListView
from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib import messages
from django.core.cache import cache
from django.db.models import Count, Case, When, F, Value, BooleanField
from organizer.models import Hackathon, ProblemStatement
from .models import Team, TeamMember, ParticipantProfile, TeamRequest
from .forms import TeamRegistrationForm, TeamMemberForm
from .services import generate_team_qr_code

class HackathonListView(LoginRequiredMixin, ListView):
    model = Hackathon
    template_name = 'participant/hackathon_list.html'
    context_object_name = 'hackathons'
    paginate_by = 12  # Limit to 12 per page to keep render times fast

    def get_queryset(self):
        from django.utils import timezone
        return (
            Hackathon.objects
            .filter(status='registration_open', registration_deadline__gt=timezone.now())
            .defer('room_configuration', 'seating_allocation', 'description')
            .order_by('start_date')
        )

class HackathonRegisterWizardView(LoginRequiredMixin, View):
    def get(self, request, pk):
        hackathon = get_object_or_404(Hackathon, pk=pk)
        
        from django.utils import timezone
        if hackathon.status != 'registration_open' or timezone.now() > hackathon.registration_deadline:
            # Discard draft teams
            Team.objects.filter(hackathon=hackathon, is_registered=False).delete()
            messages.error(request, "Registration is closed or deadline has passed for this hackathon.")
            return redirect('hackathon-list')

        # Find if user already has a draft team for this hackathon
        team = Team.objects.filter(leader=request.user, hackathon=hackathon).first()
        
        if team and team.is_registered:
            messages.info(request, "You have already registered a team for this hackathon.")
            return redirect('dashboard')
            
        # Check if user is already a member of a team (draft or registered) for this hackathon
        joined_team_member = TeamMember.objects.filter(
            email=request.user.email,
            team__hackathon=hackathon
        ).select_related('team', 'team__leader').first()
        
        if joined_team_member:
            messages.info(request, f"You are already a member of team '{joined_team_member.team.name}' led by {joined_team_member.team.leader.email} for this hackathon.")
            return redirect('dashboard')
        
        team_form = TeamRegistrationForm(instance=team)
        member_form = TeamMemberForm()
        pending_sent_invites = TeamRequest.objects.none()
        if team:
            pending_sent_invites = TeamRequest.objects.filter(team=team, status='pending').select_related('receiver').order_by('-created_at')

        return render(request, 'participant/hackathon_register.html', {
            'hackathon': hackathon,
            'team_form': team_form,
            'member_form': member_form,
            'team': team,
            'pending_sent_invites': pending_sent_invites,
        })

    def post(self, request, pk):
        hackathon = get_object_or_404(Hackathon, pk=pk)
        
        from django.utils import timezone
        if hackathon.status != 'registration_open' or timezone.now() > hackathon.registration_deadline:
            # Discard draft teams
            Team.objects.filter(hackathon=hackathon, is_registered=False).delete()
            messages.error(request, "Registration is closed or deadline has passed for this hackathon.")
            return redirect('hackathon-list')

        team = Team.objects.filter(leader=request.user, hackathon=hackathon).first()

        if team and team.is_registered:
            messages.info(request, "You have already registered a team for this hackathon.")
            return redirect('dashboard')
            
        # Check if user is already a member of a team (draft or registered) for this hackathon
        joined_team_member = TeamMember.objects.filter(
            email=request.user.email,
            team__hackathon=hackathon
        ).select_related('team', 'team__leader').first()
        
        if joined_team_member:
            messages.info(request, f"You are already a member of team '{joined_team_member.team.name}' led by {joined_team_member.team.leader.email} for this hackathon.")
            return redirect('dashboard')

        if 'save_team' in request.POST:
            team_form = TeamRegistrationForm(request.POST, instance=team)
            if team_form.is_valid():
                team = team_form.save(commit=False)
                team.hackathon = hackathon
                team.leader = request.user
                team.is_registered = False
                team.save()
                messages.success(request, "Team name saved.")
                return redirect('hackathon-register', pk=pk)
        elif 'add_member' in request.POST:
            if not team:
                messages.error(request, "Please save team name first.")
                return redirect('hackathon-register', pk=pk)

            member_id = request.POST.get('member_id')
            if member_id:
                # We are editing an existing member!
                member = get_object_or_404(TeamMember, id=member_id, team=team)
                member_form = TeamMemberForm(request.POST, instance=member)
            else:
                # Enforce team capacity for NEW accepted members.
                if team.occupied_slots >= hackathon.max_team_size:
                    pending_count = team.requests.filter(status='pending').count()
                    if pending_count > 0:
                        messages.error(request, f"Your team is full. Adding a member will delete your {pending_count} pending invite(s).")
                    else:
                        messages.error(request, "Your team is full.")
                    return redirect('hackathon-register', pk=pk)
                member_form = TeamMemberForm(request.POST)

            if member_form.is_valid():
                member = member_form.save(commit=False)
                member.team = team
                try:
                    member.clean() # triggers email uniqueness check
                    member.save()
                    member_form.save_m2m() # for skills

                    # Process additional custom skills entered by user
                    additional_skills = member_form.cleaned_data.get('additional_skills', '').strip()
                    if additional_skills:
                        from .models import Skill
                        skill_names = [s.strip() for s in additional_skills.split(',') if s.strip()]
                        for name in skill_names:
                            skill, _ = Skill.objects.get_or_create(
                                name__iexact=name,
                                defaults={'name': name}
                            )
                            member.skills.add(skill)

                    # If team is now at max capacity, delete all pending invites
                    if team.occupied_slots >= hackathon.max_team_size:
                        deleted_count, _ = TeamRequest.objects.filter(team=team, status='pending').delete()
                        if deleted_count > 0:
                            messages.warning(request, f"Team is now full. {deleted_count} pending invite(s) were deleted.")

                    if member_id:
                        messages.success(request, "Member updated successfully.")
                    else:
                        messages.success(request, "Member added successfully.")
                except Exception as e:
                    messages.error(request, str(e))
                return redirect('hackathon-register', pk=pk)
            else:
                messages.error(request, "Failed to save member. Please check fields.")
        elif 'complete_registration' in request.POST:
            if not team:
                messages.error(request, "Team does not exist.")
                return redirect('hackathon-register', pk=pk)
            
            member_count = team.members.count() + 1 # +1 for leader
            if member_count < hackathon.min_team_size:
                messages.error(request, f"Validation Failed: Minimum team size is {hackathon.min_team_size} (Leader + {hackathon.min_team_size - 1} members). Currently you have {member_count}.")
                return redirect('hackathon-register', pk=pk)
            elif member_count > hackathon.max_team_size:
                messages.error(request, f"Validation Failed: Maximum team size is {hackathon.max_team_size}.")
                return redirect('hackathon-register', pk=pk)
            
            # Additional validation: all members must have required fields
            members = team.members.all()
            for member in members:
                missing = member.get_missing_fields()
                if missing:
                    messages.error(request, f"Validation Failed: Teammate '{member.name}' is missing required fields: {missing}.")
                    return redirect('hackathon-register', pk=pk)
            
            if hackathon.is_paid:
                amount = hackathon.fee_amount
                if hackathon.fee_type == 'participant':
                    amount = hackathon.fee_amount * member_count
                
                from .payment_services import create_razorpay_order
                try:
                    razorpay_order, payment = create_razorpay_order(amount, team, request.user)
                except ValueError as e:
                    messages.error(request, "Payment gateway configuration error. Please contact the organizer.")
                    return redirect('hackathon-register', pk=pk)
                
                return redirect('payment-checkout', pk=payment.id)

            team.is_registered = True
            team.save()
            
            # Generate QR code for the team
            generate_team_qr_code(team)
            
            messages.success(request, "Registration complete!")
            return redirect('dashboard') # participant dashboard
        
        elif 'remove_member' in request.POST:
            member_id = request.POST.get('member_id')
            if team and member_id:
                try:
                    member_id = int(member_id)
                    deleted_count, _ = TeamMember.objects.filter(id=member_id, team=team).delete()
                    if deleted_count > 0:
                        messages.success(request, "Member removed successfully.")
                    else:
                        messages.error(request, "Member not found or already removed.")
                except (ValueError, TypeError):
                    messages.error(request, "Invalid member ID.")
            else:
                messages.error(request, "Cannot remove member. Team or member ID missing.")
            return redirect('hackathon-register', pk=pk)

        return redirect('hackathon-register', pk=pk)


class ParticipantHackathonHubView(LoginRequiredMixin, View):
    """
    Per-hackathon hub for a registered participant.
    Shows: hackathon info, team details, PS selection, and seating assignment.
    PS list uses the same cache-aside key as the REST API so cache is shared.
    PS selection is delegated to the REST API via JS fetch (concurrency-safe).
    """

    def _get_team(self, hackathon, user):
        """Return the team where the user is leader OR a member, for this hackathon."""
        team = Team.objects.filter(leader=user, hackathon=hackathon).first()
        if not team:
            member = TeamMember.objects.filter(
                email=user.email, team__hackathon=hackathon, team__is_registered=True
            ).select_related('team').first()
            if member:
                team = member.team
        return team

    def _get_problem_statements(self, hackathon):
        """Cache-aside: same key as REST API so both share the same cache entry."""
        cache_key = f"problem_statements_list_{hackathon.id}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached, True  # (data, from_cache)

        ps_qs = (
            ProblemStatement.objects
            .filter(hackathon=hackathon, is_active=True)
            .annotate(
                current_teams_count=Count('selected_by_teams'),
                is_full=Case(
                    When(current_teams_count__gte=F('max_teams_allowed'), then=Value(True)),
                    default=Value(False),
                    output_field=BooleanField(),
                ),
            )
            .order_by('-created_at')
        )
        # Return queryset directly (template renders it); REST API serializes to JSON
        return ps_qs, False

    def _get_team_seating(self, hackathon, team):
        """Extract this team's seating rows from hackathon.seating_allocation."""
        if not hackathon.seating_allocation or not team:
            return None
        allocation = hackathon.seating_allocation
        if not isinstance(allocation, dict):
            return None
        for entry in allocation.get('teams', []):
            if entry.get('name', '').strip().lower() == team.name.strip().lower():
                return entry
        return None

    def get(self, request, pk):
        hackathon = get_object_or_404(Hackathon, pk=pk)
        team = self._get_team(hackathon, request.user)

        if not team:
            messages.error(request, "You are not registered for this hackathon.")
            return redirect('dashboard')

        ps_data, from_cache = self._get_problem_statements(hackathon)
        team_seating = self._get_team_seating(hackathon, team)
        # prefetch_related for skills avoids N+1 per member
        members = team.members.prefetch_related('skills').exclude(email=team.leader.email)
        is_leader = (team.leader == request.user)
        pending_sent_invites = TeamRequest.objects.none()
        if is_leader:
            pending_sent_invites = (
                TeamRequest.objects
                .filter(team=team, status='pending')
                .select_related('receiver')
                .order_by('-created_at')
            )

        return render(request, 'participant/hackathon_hub.html', {
            'hackathon': hackathon,
            'team': team,
            'members': members,
            'is_leader': is_leader,
            'pending_sent_invites': pending_sent_invites,
            'problem_statements': ps_data,
            'team_seating': team_seating,
        })


class ParticipantTeamPassView(LoginRequiredMixin, View):
    """
    Dedicated mobile-optimized Team Pass page showing the team's QR code.
    Accessible by team leaders and team members.
    """

    def _get_team(self, hackathon, user):
        """Return the team where the user is leader OR a member."""
        team = Team.objects.filter(leader=user, hackathon=hackathon, is_registered=True).first()
        if not team:
            member = TeamMember.objects.filter(
                email=user.email, team__hackathon=hackathon, team__is_registered=True
            ).select_related('team').first()
            if member:
                team = member.team
        return team

    def get(self, request, pk):
        hackathon = get_object_or_404(Hackathon, pk=pk)
        team = self._get_team(hackathon, request.user)

        if not team:
            messages.error(request, "You are not registered for this hackathon.")
            return redirect('dashboard')

        # Ensure QR code exists (generate if missing)
        if not team.qr_token or not team.qr_code:
            generate_team_qr_code(team)
            team.refresh_from_db()

        members = team.members.prefetch_related('skills').exclude(email=team.leader.email)

        return render(request, 'participant/team_pass.html', {
            'hackathon': hackathon,
            'team': team,
            'members': members,
        })

from .models import Payment
from .payment_services import verify_razorpay_signature
from django.conf import settings

class PaymentCheckoutView(LoginRequiredMixin, View):
    def get(self, request, pk):
        payment = get_object_or_404(Payment, pk=pk, user=request.user, status='pending')
        context = {
            'payment': payment,
            'razorpay_key_id': settings.RAZORPAY_KEY_ID,
        }
        return render(request, 'participant/payment_checkout.html', context)

class PaymentVerifyView(LoginRequiredMixin, View):
    def post(self, request, pk):
        payment = get_object_or_404(Payment, pk=pk, user=request.user, status='pending')
        
        razorpay_payment_id = request.POST.get('razorpay_payment_id')
        razorpay_order_id = request.POST.get('razorpay_order_id')
        razorpay_signature = request.POST.get('razorpay_signature')
        
        if verify_razorpay_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
            payment.status = 'successful'
            payment.razorpay_payment_id = razorpay_payment_id
            payment.razorpay_signature = razorpay_signature
            payment.save()
            
            team = payment.team
            team.is_registered = True
            team.save()
            
            generate_team_qr_code(team)
            
            messages.success(request, "Payment successful! Registration complete!")
            return redirect('dashboard')
        else:
            payment.status = 'failed'
            payment.save()
            messages.error(request, "Payment verification failed. Please try again.")
            return redirect('hackathon-register', pk=payment.team.hackathon.id)
