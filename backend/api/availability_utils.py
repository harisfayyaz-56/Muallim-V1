"""Utilities for teacher weekly availability and slot generation."""
from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

from django.utils import timezone as django_tz

DAY_UI_TO_DB = {
    'Mon': 'monday', 'Tue': 'tuesday', 'Wed': 'wednesday',
    'Thu': 'thursday', 'Fri': 'friday', 'Sat': 'saturday', 'Sun': 'sunday',
}
DAY_DB_TO_UI = {v: k for k, v in DAY_UI_TO_DB.items()}
WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']


def get_teacher_timezone(teacher):
    profile = getattr(teacher.user, 'profile', None)
    return profile.timezone if profile else 'Asia/Dubai'


def grid_to_availability_rows(grid):
    """Convert UI weekly grid to DB row dicts (1-hour blocks)."""
    rows = []
    for day_ui, times in (grid or {}).items():
        day = DAY_UI_TO_DB.get(day_ui)
        if not day:
            continue
        for t in sorted(set(times)):
            parts = t.split(':')
            h = int(parts[0])
            m = int(parts[1]) if len(parts) > 1 else 0
            start = time(h, m)
            end_h = h + 1
            end = time(end_h, m) if end_h < 24 else time(23, 59, 59)
            rows.append({
                'day_of_week': day,
                'start_time': start,
                'end_time': end,
                'is_available': True,
            })
    return rows


def availabilities_to_grid(availabilities):
    """Convert TeacherAvailability queryset to UI grid."""
    grid = {day: [] for day in DAY_UI_TO_DB}
    for av in availabilities:
        if not av.is_available:
            continue
        day_ui = DAY_DB_TO_UI.get(av.day_of_week)
        if day_ui:
            grid[day_ui].append(av.start_time.strftime('%H:%M'))
    for day in grid:
        grid[day].sort()
    return grid


def availabilities_to_slots_by_day(availabilities):
    """Convert to lowercase day keys for public API."""
    result = {day: [] for day in WEEKDAYS}
    for av in availabilities:
        if av.is_available:
            result[av.day_of_week].append(av.start_time.strftime('%H:%M'))
    for day in result:
        result[day].sort()
    return result


def _reference_date_for_weekday(day_name):
    """Return the next occurrence of day_name (or today if match)."""
    from datetime import date
    today = date.today()
    target_idx = WEEKDAYS.index(day_name)
    days_ahead = (target_idx - today.weekday()) % 7
    return today + timedelta(days=days_ahead)


def convert_weekly_slots_to_timezone(slots_by_day, teacher_tz_name, viewer_tz_name):
    """Convert weekly recurring slots from teacher TZ to viewer TZ."""
    if teacher_tz_name == viewer_tz_name:
        return slots_by_day

    teacher_tz = ZoneInfo(teacher_tz_name)
    viewer_tz = ZoneInfo(viewer_tz_name)
    result = {day: [] for day in WEEKDAYS}

    for day_name, times in slots_by_day.items():
        ref_date = _reference_date_for_weekday(day_name)
        for t in times:
            parts = t.split(':')
            h, m = int(parts[0]), int(parts[1]) if len(parts) > 1 else 0
            dt_teacher = datetime(ref_date.year, ref_date.month, ref_date.day, h, m, tzinfo=teacher_tz)
            dt_viewer = dt_teacher.astimezone(viewer_tz)
            viewer_day = WEEKDAYS[dt_viewer.weekday()]
            result[viewer_day].append(dt_viewer.strftime('%H:%M'))

    for day in result:
        result[day] = sorted(set(result[day]))
    return result


def _duration_allowed(teacher_session_duration, requested_duration):
    if teacher_session_duration == 'both':
        return requested_duration in (30, 60)
    return str(requested_duration) == teacher_session_duration


def _get_candidate_starts(hour, session_duration, requested_duration):
    """Return (hour, minute) start times for a given hour block."""
    if not _duration_allowed(session_duration, requested_duration):
        return []
    if requested_duration == 30:
        return [(hour, 0), (hour, 30)]
    return [(hour, 0)]


def _bookings_overlap(slot_start, slot_end, bookings):
    for booking in bookings:
        b_start = booking.scheduled_date
        if django_tz.is_naive(b_start):
            b_start = django_tz.make_aware(b_start)
        b_end = b_start + timedelta(minutes=booking.duration_minutes)
        if slot_start < b_end and slot_end > b_start:
            return True
    return False


def generate_slots_for_date(teacher, target_date, duration_minutes, viewer_timezone, active_bookings):
    """Generate bookable slots for a specific calendar date."""
    teacher_tz_name = get_teacher_timezone(teacher)
    teacher_tz = ZoneInfo(teacher_tz_name)
    viewer_tz = ZoneInfo(viewer_timezone)
    session_duration = getattr(teacher, 'session_duration', 'both') or 'both'

    target_weekday_idx = target_date.weekday()
    candidate_indices = [(target_weekday_idx - 1) % 7, target_weekday_idx, (target_weekday_idx + 1) % 7]
    query_weekdays = [WEEKDAYS[idx] for idx in candidate_indices]

    availabilities = teacher.availabilities.filter(day_of_week__in=query_weekdays, is_available=True)

    slots = []
    seen = set()

    for av in availabilities:
        av_idx = WEEKDAYS.index(av.day_of_week)
        diff = av_idx - target_weekday_idx
        if diff == -6:
            diff = 1
        elif diff == 6:
            diff = -1
        
        slot_date_teacher = target_date + timedelta(days=diff)

        for h, m in _get_candidate_starts(av.start_time.hour, session_duration, duration_minutes):
            dt_teacher = datetime(slot_date_teacher.year, slot_date_teacher.month, slot_date_teacher.day, h, m, tzinfo=teacher_tz)
            dt_utc = dt_teacher.astimezone(ZoneInfo('UTC'))
            slot_end = dt_utc + timedelta(minutes=duration_minutes)

            if dt_utc < django_tz.now():
                continue

            is_booked = _bookings_overlap(dt_utc, slot_end, active_bookings)
            if is_booked:
                continue

            dt_viewer = dt_teacher.astimezone(viewer_tz)
            if dt_viewer.date() != target_date:
                continue

            time_str = dt_viewer.strftime('%H:%M')
            key = (time_str, dt_utc.isoformat())
            if key in seen:
                continue
            seen.add(key)

            slots.append({
                'time': time_str,
                'utc': dt_utc.isoformat(),
                'available': True,
            })

    slots.sort(key=lambda s: s['utc'])
    return slots


def validate_booking_slot(teacher, scheduled_date, duration_minutes):
    """Raise ValueError if slot is not bookable."""
    if teacher.status != 'approved':
        raise ValueError('Teacher is not available for booking')

    session_duration = getattr(teacher, 'session_duration', 'both') or 'both'
    if not _duration_allowed(session_duration, duration_minutes):
        raise ValueError(f'Teacher does not offer {duration_minutes}-minute sessions')

    teacher_tz_name = get_teacher_timezone(teacher)
    teacher_tz = ZoneInfo(teacher_tz_name)

    if django_tz.is_naive(scheduled_date):
        scheduled_date = django_tz.make_aware(scheduled_date)

    dt_teacher = scheduled_date.astimezone(teacher_tz)
    day_of_week = WEEKDAYS[dt_teacher.weekday()]
    start_time = dt_teacher.time().replace(second=0, microsecond=0)

    availabilities = teacher.availabilities.filter(
        day_of_week=day_of_week, is_available=True, start_time__hour=start_time.hour
    )
    if not availabilities.exists():
        raise ValueError('Selected time is not within teacher availability')

    if duration_minutes == 30 and start_time.minute not in (0, 30):
        raise ValueError('Invalid 30-minute slot time')
    if duration_minutes == 60 and start_time.minute != 0:
        raise ValueError('Invalid 60-minute slot time')

    slot_end = scheduled_date + timedelta(minutes=duration_minutes)
    active = teacher.bookings.exclude(status__in=['cancelled', 'no_show'])
    if _bookings_overlap(scheduled_date, slot_end, active):
        raise ValueError('This slot has already been booked')
