import csv
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from django.db import models, transaction, IntegrityError
from django.db.models import Q, Count
from rest_framework.exceptions import PermissionDenied, ValidationError
from .models import ProblemStatement, Hackathon, ScanCategory, ScanRecord, HackathonCoordinator
from .api_serializers import ProblemStatementSerializer, ScanCategorySerializer, ScannerScanRequestSerializer, ScannerSubmitRequestSerializer
from .permissions import IsScannerAuthorized
from participant.models import Team
from .services.seating import get_teams_for_allocation, allocate



class StandardResultsPagePagination(PageNumberPagination):
    """20 results per page; clients can request up to 100 via ?page_size=N."""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class IsOrganizerPermission(permissions.BasePermission):
    """Only allow users with the 'organizer' role."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'organizer'
        )


class ProblemStatementViewSet(viewsets.ModelViewSet):
    """
    CRUD for problem statements scoped to hackathons owned by the
    authenticated organizer.

    - List / Retrieve: returns problem statements for the organizer's hackathons.
    - Create: requires `hackathon` in request body; validated against ownership.
    - Update / Delete: only the owning organizer can modify.
    """
    serializer_class = ProblemStatementSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizerPermission]
    pagination_class = StandardResultsPagePagination

    def get_queryset(self):
        return ProblemStatement.objects.filter(
            hackathon__organizer__user=self.request.user,
        )

    def perform_create(self, serializer):
        hackathon = serializer.validated_data['hackathon']
        if hackathon.organizer.user != self.request.user:
            raise PermissionDenied(
                "You can only add problem statements to your own hackathons."
            )
        serializer.save()

    def perform_update(self, serializer):
        hackathon = serializer.instance.hackathon
        if hackathon.organizer.user != self.request.user:
            raise PermissionDenied(
                "You can only edit problem statements for your own hackathons."
            )
        serializer.save()

    def perform_destroy(self, instance):
        if instance.hackathon.organizer.user != self.request.user:
            raise PermissionDenied(
                "You can only delete problem statements for your own hackathons."
            )
        instance.delete()


class AllocateSeatsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOrganizerPermission]

    def post(self, request, hackathon_id):
        hackathon = get_object_or_404(Hackathon, id=hackathon_id)
        if hackathon.organizer.user != request.user:
            raise PermissionDenied("You can only allocate seats for your own hackathons.")

        rooms_config = request.data.get('rooms_config')
        if rooms_config is not None:
            hackathon.room_configuration = rooms_config
            hackathon.save()
        else:
            rooms_config = hackathon.room_configuration

        if not rooms_config:
            return Response(
                {"error": "rooms_config must be provided or previously saved."},
                status=status.HTTP_400_BAD_REQUEST
            )

        teams = get_teams_for_allocation(hackathon_id)
        if not teams:
            return Response(
                {"error": "No teams found for this hackathon."},
                status=status.HTTP_400_BAD_REQUEST
            )

        from django.db import transaction

        try:
            allocation_result = allocate(teams, rooms_config)
            with transaction.atomic():
                locked_hackathon = Hackathon.objects.select_for_update().get(id=hackathon_id)
                locked_hackathon.seating_allocation = allocation_result
                locked_hackathon.save(update_fields=['seating_allocation'])
        except Exception as e:
            return Response(
                {"error": f"Failed to allocate seating: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {
                "message": "Seating allocation completed successfully."
            },
            status=status.HTTP_200_OK
        )


class ExportSeatingCSVView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsOrganizerPermission]

    def get(self, request, hackathon_id):
        hackathon = get_object_or_404(Hackathon, id=hackathon_id)
        if hackathon.organizer.user != request.user:
            raise PermissionDenied("You can only export seats for your own hackathons.")

        allocation = hackathon.seating_allocation
        if not allocation or 'room_view' not in allocation:
            return Response(
                {"error": "No seating allocation found for this hackathon."},
                status=status.HTTP_400_BAD_REQUEST
            )

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="seating_export_{hackathon_id}.csv"'

        writer = csv.writer(response)
        writer.writerow(['Room', 'Section', 'Row', 'Bench', 'Team', 'Member'])

        room_view = allocation['room_view']
        for room_no, room_data in room_view.items():
            for row_no, row_data in room_data.get('rows', {}).items():
                section = row_data.get('section', '')
                for bench in row_data.get('benches', []):
                    bench_no = bench.get('bench', '')
                    for assigned in bench.get('assigned', []):
                        writer.writerow([
                            room_no,
                            section,
                            row_no,
                            bench_no,
                            assigned.get('team', ''),
                            assigned.get('member', '')
                        ])

        return response


class ScanCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = ScanCategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsScannerAuthorized]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, 'role', None) == 'super_admin':
            queryset = ScanCategory.objects.all()
        else:
            queryset = ScanCategory.objects.filter(
                Q(hackathon__organizer__user=user) |
                Q(hackathon__coordinators__user=user, hackathon__coordinators__is_active=True)
            ).distinct()
            
        hackathon_id = self.request.query_params.get('hackathon')
        if hackathon_id:
            queryset = queryset.filter(hackathon_id=hackathon_id)
        return queryset.annotate(scan_count=Count('scan_records')).order_by('display_order', 'created_at')

    def perform_create(self, serializer):
        hackathon = serializer.validated_data['hackathon']
        user = self.request.user
        is_authorized = False
        if user.is_staff or getattr(user, 'role', None) == 'super_admin':
            is_authorized = True
        elif getattr(user, 'role', None) == 'organizer' and hackathon.organizer.user == user:
            is_authorized = True
        else:
            is_authorized = hackathon.coordinators.filter(user=user, is_active=True).exists()
            
        if not is_authorized:
            raise PermissionDenied("You can only add categories to hackathons you organize or coordinate.")
        serializer.save()

    def perform_update(self, serializer):
        hackathon = serializer.validated_data.get('hackathon', serializer.instance.hackathon)
        user = self.request.user
        is_authorized = False
        if user.is_staff or getattr(user, 'role', None) == 'super_admin':
            is_authorized = True
        elif getattr(user, 'role', None) == 'organizer' and hackathon.organizer.user == user:
            is_authorized = True
        else:
            is_authorized = hackathon.coordinators.filter(user=user, is_active=True).exists()
            
        if not is_authorized:
            raise PermissionDenied("You can only edit categories for hackathons you organize or coordinate.")
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.scan_records.exists():
            raise ValidationError(
                {"detail": "Cannot delete category as it already has associated scan records."}
            )
        return super().destroy(request, *args, **kwargs)


class ScannerScanView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsScannerAuthorized]

    def post(self, request):
        serializer = ScannerScanRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        qr_token = serializer.validated_data['qr_token']
        scan_category_id = serializer.validated_data['scan_category_id']
        
        # 1. Fetch Team and validate qr_active (with query optimization)
        try:
            team = Team.objects.select_related('hackathon', 'hackathon__organizer__user').get(qr_token=qr_token)
        except Team.DoesNotExist:
            raise ValidationError({"qr_token": "Invalid QR token."})
            
        if not team.is_qr_active:
            raise ValidationError({"qr_token": "This team's QR code is inactive."})
            
        # 2. Fetch ScanCategory
        try:
            scan_category = ScanCategory.objects.select_related('hackathon').get(id=scan_category_id)
        except ScanCategory.DoesNotExist:
            raise ValidationError({"scan_category_id": "Invalid scan category."})
            
        # 3. Verify team and scan category belong to the same hackathon
        if team.hackathon_id != scan_category.hackathon_id:
            raise ValidationError({"detail": "Team and scan category must belong to the same hackathon."})
            
        # 4. Scoped Contextual Authorization Check
        hackathon = team.hackathon
        is_authorized = False
        
        # Super admin / staff bypasses
        if request.user.is_staff or request.user.role == 'super_admin':
            is_authorized = True
        elif request.user.role == 'organizer' and hackathon.organizer.user == request.user:
            is_authorized = True
        else:
            # Check coordinator assigned to this specific hackathon
            is_authorized = HackathonCoordinator.objects.filter(
                hackathon=hackathon,
                user=request.user,
                is_active=True
            ).exists()
            
        if not is_authorized:
            raise PermissionDenied("You are not authorized to scan for this hackathon.")
            
        # 5. Fetch team members using prefetch_related for scan records
        # Optimize query: filter members belonging to this team, prefetch their scan records for this category
        members = team.members.prefetch_related(
            models.Prefetch(
                'scan_records',
                queryset=ScanRecord.objects.filter(scan_category=scan_category),
                to_attr='category_scans'
            )
        )
        
        member_data = []
        for m in members:
            # Check if scanned (already prefetched)
            already_scanned = len(m.category_scans) > 0
            member_data.append({
                "id": m.id,
                "name": m.name,
                "already_scanned": already_scanned
            })
            
        return Response({
            "team_name": team.name,
            "members": member_data
        }, status=status.HTTP_200_OK)


class ScannerSubmitView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsScannerAuthorized]

    def post(self, request):
        serializer = ScannerSubmitRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        qr_token = serializer.validated_data['qr_token']
        scan_category_id = serializer.validated_data['scan_category_id']
        member_ids = serializer.validated_data['member_ids']
        device_id = serializer.validated_data.get('device_id')
        
        # 1. Fetch Team and validate qr_active (with query optimization)
        try:
            team = Team.objects.select_related('hackathon', 'hackathon__organizer__user').get(qr_token=qr_token)
        except Team.DoesNotExist:
            raise ValidationError({"qr_token": "Invalid QR token."})
            
        if not team.is_qr_active:
            raise ValidationError({"qr_token": "This team's QR code is inactive."})
            
        # 2. Fetch ScanCategory
        try:
            scan_category = ScanCategory.objects.select_related('hackathon').get(id=scan_category_id)
        except ScanCategory.DoesNotExist:
            raise ValidationError({"scan_category_id": "Invalid scan category."})
            
        # 3. Verify team and scan category belong to the same hackathon
        if team.hackathon_id != scan_category.hackathon_id:
            raise ValidationError({"detail": "Team and scan category must belong to the same hackathon."})
            
        # 4. Scoped Contextual Authorization Check
        hackathon = team.hackathon
        is_authorized = False
        
        if request.user.is_staff or request.user.role == 'super_admin':
            is_authorized = True
        elif request.user.role == 'organizer' and hackathon.organizer.user == request.user:
            is_authorized = True
        else:
            is_authorized = HackathonCoordinator.objects.filter(
                hackathon=hackathon,
                user=request.user,
                is_active=True
            ).exists()
            
        if not is_authorized:
            raise PermissionDenied("You are not authorized to scan for this hackathon.")
            
        # 5. Validate that all member_ids belong to this team
        team_member_ids = set(team.members.values_list('id', flat=True))
        if not set(member_ids).issubset(team_member_ids):
            raise ValidationError({"member_ids": "One or more members do not belong to the scanned team."})
            
        # 6. Database writes in a transaction block, handling IntegrityError
        try:
            with transaction.atomic():
                scan_records_to_create = []
                for m_id in member_ids:
                    # Double scan check at code level first to give better warning, but DB uniqueness is final guard
                    if ScanRecord.objects.filter(team_member_id=m_id, scan_category=scan_category).exists():
                        raise ValidationError({"detail": "One or more team members have already been scanned for this category."})
                    
                    scan_records_to_create.append(
                        ScanRecord(
                            team_member_id=m_id,
                            scan_category=scan_category,
                            scanned_by=request.user,
                            device_id=device_id
                        )
                    )
                ScanRecord.objects.bulk_create(scan_records_to_create)
        except IntegrityError:
            # Handles concurrent duplicate scans from other requests reaching the DB bulk_create at the same time
            raise ValidationError({"detail": "One or more team members have already been scanned for this category."})
            
        return Response({
            "status": "success",
            "message": f"Scanned {len(member_ids)} members successfully"
        }, status=status.HTTP_200_OK)

