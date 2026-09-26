from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from apps.core.views import TenantModelViewSet
from .models import Attendance
from .serializers import AttendanceSerializer
from django.utils import timezone
import datetime

class AttendanceViewSet(TenantModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        
        # Auto-close any unclosed attendance records from past dates
        today = timezone.localdate()
        past_unclosed = Attendance.objects.filter(date__lt=today, status__in=['working', 'on_break'])
        for rec in past_unclosed:
            rec.status = 'checked_out'
            if rec.check_in and not rec.check_out:
                rec.check_out = rec.check_in + datetime.timedelta(hours=8, minutes=30)
                dur = int((rec.check_out - rec.check_in).total_seconds())
                rec.total_working_seconds = max(0, dur - rec.total_break_seconds)
            rec.save()

        # If explicit self=true param is passed, filter to request.user only
        if self.request.query_params.get('self') == 'true':
            return qs.filter(user=user)

        # TLs can see their reporting team's attendance. Employees only see their own.
        if user.role in ['admin', 'ceo', 'operations_head', 'hr'] or getattr(user, 'is_owner', False):
            return qs
        elif user.role == 'tl':
            return qs.filter(user__employee_profile__manager=user)
        else:
            return qs.filter(user=user)

    @action(detail=False, methods=['post', 'patch'], url_path='verify-record')
    def verify_record(self, request):
        record_id = request.data.get('id')
        user_id = request.data.get('user_id')
        user_username = request.data.get('user_username')
        date_str = request.data.get('date') or timezone.localdate().isoformat()
        verification_status = request.data.get('verification_status')

        if not verification_status:
            return Response({"error": "verification_status is required"}, status=status.HTTP_400_BAD_REQUEST)

        emp_id = None
        try:
            emp_id = request.user.employee_profile.employee_id
        except Exception:
            emp_id = request.user.username
        
        if not emp_id:
            emp_id = f"@{request.user.username.upper()}"
        elif not emp_id.startswith('@'):
            emp_id = f"@{emp_id}"

        actor_name = request.user.get_full_name() or request.user.username
        now = timezone.now()

        record = None
        if record_id:
            try:
                record = Attendance.objects.get(id=record_id)
            except Attendance.DoesNotExist:
                pass
        
        if not record and (user_id or user_username):
            from django.contrib.auth import get_user_model
            from apps.employees.models import Employee
            User = get_user_model()
            target_user = None

            # 1. Try finding User directly by user_id
            if user_id:
                try:
                    target_user = User.objects.get(id=user_id)
                except Exception:
                    pass

            # 2. Try finding User via Employee.id
            if not target_user and user_id:
                try:
                    target_user = Employee.objects.get(id=user_id).user
                except Exception:
                    pass

            # 3. Try finding User via Employee.employee_id using user_id
            if not target_user and user_id:
                try:
                    target_user = Employee.objects.get(employee_id=str(user_id)).user
                except Exception:
                    pass

            # 4. Try finding User by username
            if not target_user and user_username:
                try:
                    target_user = User.objects.get(username=user_username)
                except Exception:
                    pass

            # 5. Try finding User via Employee.employee_id using user_username
            if not target_user and user_username:
                try:
                    target_user = Employee.objects.get(employee_id=str(user_username)).user
                except Exception:
                    pass

            # 6. Try finding User by email
            if not target_user and user_username:
                try:
                    target_user = User.objects.get(email=user_username)
                except Exception:
                    pass

            if target_user:
                record, _ = Attendance.objects.get_or_create(
                    user=target_user,
                    date=date_str,
                    defaults={
                        'organization': request.user.organization,
                        'status': 'not_checked_in',
                        'shift': 'Day Shift'
                    }
                )

        if not record:
            return Response({"error": "Record or user not found"}, status=status.HTTP_400_BAD_REQUEST)

        record.verification_status = verification_status
        record.verified_by_id = emp_id
        record.verified_by_name = actor_name
        record.verified_at = now
        record.save()

        try:
            from apps.audit.models import AuditLog
            AuditLog.objects.create(
                organization=request.user.organization,
                actor=request.user,
                actor_name=actor_name,
                actor_role=request.user.role,
                action="VERIFY_ATTENDANCE",
                category="Attendance",
                details=f"{actor_name} ({emp_id}) verified attendance status to '{verification_status}' for {record.user.username} on {record.date}."
            )
        except Exception as e:
            print("Audit log error:", e)

        return Response(self.get_serializer(record).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='today')
    def today_status(self, request):
        today = timezone.localdate()
        try:
            record = Attendance.objects.get(user=request.user, date=today)
            serializer = self.get_serializer(record)
            return Response(serializer.data)
        except Attendance.DoesNotExist:
            return Response({"status": "not_checked_in"})

    @action(detail=False, methods=['post'], url_path='check-in')
    def check_in(self, request):
        today = timezone.localdate()
        now = timezone.now()
        
        record, created = Attendance.objects.get_or_create(
            user=request.user,
            date=today,
            defaults={
                'organization': request.user.organization,
                'check_in': now,
                'status': 'working',
            }
        )
        
        if not created:
            if not record.check_in:
                # Pre-verified by HR before check-in: start working now
                record.check_in = now
                record.status = 'working'
                record.save()
            elif record.status == 'checked_out':
                record.status = 'working'
                record.check_out = None
                if not record.check_in:
                    record.check_in = now
                record.save()
            else:
                return Response({"error": "Already checked in today."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            from apps.audit.models import AuditLog
            actor_name = request.user.get_full_name() or request.user.username
            AuditLog.objects.create(
                organization=request.user.organization,
                actor=request.user,
                actor_name=actor_name,
                actor_role=request.user.role,
                action="CHECK_IN",
                category="Attendance",
                details=f"Staff member {actor_name} checked in at {now.strftime('%H:%M:%S')}."
            )
        except Exception as e:
            print("Check-in audit log error:", e)

        return Response(self.get_serializer(record).data, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='start-break')
    def start_break(self, request):
        today = timezone.localdate()
        now = timezone.now()
        
        try:
            record = Attendance.objects.get(user=request.user, date=today)
            record.status = 'on_break'
            record.break_start = now
            record.save()

            try:
                from apps.audit.models import AuditLog
                actor_name = request.user.get_full_name() or request.user.username
                AuditLog.objects.create(
                    organization=request.user.organization,
                    actor=request.user,
                    actor_name=actor_name,
                    actor_role=request.user.role,
                    action="START_BREAK",
                    category="Attendance",
                    details=f"Staff member {actor_name} went on break at {now.strftime('%H:%M:%S')}."
                )
            except Exception as e:
                print("Start break audit log error:", e)

            return Response(self.get_serializer(record).data)
        except Attendance.DoesNotExist:
            record = Attendance.objects.create(
                user=request.user,
                organization=request.user.organization,
                date=today,
                check_in=now,
                break_start=now,
                status='on_break'
            )
            return Response(self.get_serializer(record).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='break-start')
    def break_start(self, request):
        return self.start_break(request)

    @action(detail=False, methods=['post'], url_path='end-break')
    def end_break(self, request):
        today = timezone.localdate()
        now = timezone.now()
        
        try:
            record = Attendance.objects.get(user=request.user, date=today)
            if record.break_start:
                duration = int((now - record.break_start).total_seconds())
                record.total_break_seconds += max(0, duration)
            record.status = 'working'
            record.break_start = None
            record.save()

            try:
                from apps.audit.models import AuditLog
                actor_name = request.user.get_full_name() or request.user.username
                AuditLog.objects.create(
                    organization=request.user.organization,
                    actor=request.user,
                    actor_name=actor_name,
                    actor_role=request.user.role,
                    action="END_BREAK",
                    category="Attendance",
                    details=f"Staff member {actor_name} returned from break at {now.strftime('%H:%M:%S')}."
                )
            except Exception as e:
                print("End break audit log error:", e)

            return Response(self.get_serializer(record).data)
        except Attendance.DoesNotExist:
            record = Attendance.objects.create(
                user=request.user,
                organization=request.user.organization,
                date=today,
                check_in=now,
                status='working'
            )
            return Response(self.get_serializer(record).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='break-end')
    def break_end(self, request):
        return self.end_break(request)

    @action(detail=False, methods=['post'], url_path='check-out')
    def check_out(self, request):
        today = timezone.localdate()
        now = timezone.now()
        
        try:
            record = Attendance.objects.get(user=request.user, date=today)
            if record.status not in ['working', 'on_break']:
                return Response({"error": "Not working/on break or already checked out."}, status=status.HTTP_400_BAD_REQUEST)
                
            # If checking out during break, complete the break first
            if record.status == 'on_break' and record.break_start:
                duration = int((now - record.break_start).total_seconds())
                record.total_break_seconds += duration
                record.break_start = None
                
            record.check_out = now
            record.status = 'checked_out'
            
            # Calculate working seconds
            if record.check_in:
                total_duration = int((now - record.check_in).total_seconds())
                working_duration = total_duration - record.total_break_seconds
                record.total_working_seconds = max(0, working_duration)
                
                # Check for overtime (over 8 hours = 28800 seconds)
                if record.total_working_seconds > 28800:
                    record.overtime_seconds = record.total_working_seconds - 28800
                else:
                    record.overtime_seconds = 0
                    
            record.save()

            try:
                from apps.audit.models import AuditLog
                actor_name = request.user.get_full_name() or request.user.username
                AuditLog.objects.create(
                    organization=request.user.organization,
                    actor=request.user,
                    actor_name=actor_name,
                    actor_role=request.user.role,
                    action="CHECK_OUT",
                    category="Attendance",
                    details=f"Staff member {actor_name} checked out at {now.strftime('%H:%M:%S')}."
                )
            except Exception as e:
                print("Check-out audit log error:", e)

            return Response(self.get_serializer(record).data)
        except Attendance.DoesNotExist:
            return Response({"error": "Must check in first."}, status=status.HTTP_400_BAD_REQUEST)
