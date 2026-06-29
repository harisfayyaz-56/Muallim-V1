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
    """Convert UI weekly grid to DB row dicts."""
    rows = []
    for day_ui, slots in (grid or {}).items():
        day = DAY_UI_TO_DB.get(day_ui)
        if not day:
            continue
        for slot in slots:
            if isinstance(slot, dict):
                start_str = slot.get('start')
                end_str = slot.get('end')
            else:
                # string format: default 1-hour duration for backward compatibility
                start_str = slot
                parts = start_str.split(':')
                h = int(parts[0])
                m = int(parts[1]) if len(parts) > 1 else 0
                end_str = f"{h+1:02d}:{m:02d}" if h+1 < 24 else "23:59"
            
            start_parts = start_str.split(':')
            start = time(int(start_parts[0]), int(start_parts[1]))
            
            end_parts = end_str.split(':')
            end = time(int(end_parts[0]), int(end_parts[1]))
            
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
            grid[day_ui].append({
                'start': av.start_time.strftime('%H:%M'),
                'end': av.end_time.strftime('%H:%M'),
            })
    return grid


def availabilities_to_slots_by_day(availabilities):
    """Convert to lowercase day keys for public API and merge contiguous slots."""
    result = {day: [] for day in WEEKDAYS}
    for av in availabilities:
        if av.is_available:
            result[av.day_of_week].append({
                'start': av.start_time.strftime('%H:%M'),
                'end': av.end_time.strftime('%H:%M'),
            })
    for day in result:
        slots = sorted(result[day], key=lambda s: s['start'])
        if not slots:
            result[day] = []
            continue

        # Merge overlapping/adjacent intervals
        intervals = []
        for s in slots:
            sh, sm = map(int, s['start'].split(':'))
            eh, em = map(int, s['end'].split(':'))
            start_min = sh * 60 + sm
            end_min = eh * 60 + em
            if end_min < start_min:  # wraps to next day
                end_min += 24 * 60
            intervals.append((start_min, end_min))

        intervals.sort(key=lambda x: x[0])
        merged = []
        for start, end in intervals:
            if not merged:
                merged.append((start, end))
            else:
                last_start, last_end = merged[-1]
                if start <= last_end:
                    merged[-1] = (last_start, max(last_end, end))
                else:
                    merged.append((start, end))

        merged_slots = []
        for start, end in merged:
            sh, sm = divmod(start, 60)
            eh, em = divmod(end, 60)
            sh = sh % 24
            eh = eh % 24
            merged_slots.append({
                'start': f"{sh:02d}:{sm:02d}",
                'end': f"{eh:02d}:{em:02d}",
            })
        result[day] = merged_slots
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

    for day_name, slots in slots_by_day.items():
        ref_date = _reference_date_for_weekday(day_name)
        for slot in slots:
            if isinstance(slot, dict):
                start_str = slot['start']
                end_str = slot['end']
            else:
                start_str = slot
                parts = start_str.split(':')
                h = int(parts[0])
                m = int(parts[1]) if len(parts) > 1 else 0
                end_str = f"{h+1:02d}:{m:02d}" if h+1 < 24 else "23:59"
            
            # Convert start time
            parts = start_str.split(':')
            h, m = int(parts[0]), int(parts[1]) if len(parts) > 1 else 0
            dt_teacher = datetime(ref_date.year, ref_date.month, ref_date.day, h, m, tzinfo=teacher_tz)
            dt_viewer = dt_teacher.astimezone(viewer_tz)
            viewer_day = WEEKDAYS[dt_viewer.weekday()]
            
            # Convert end time
            e_parts = end_str.split(':')
            e_h, e_m = int(e_parts[0]), int(e_parts[1]) if len(e_parts) > 1 else 0
            e_dt_teacher = datetime(ref_date.year, ref_date.month, ref_date.day, e_h, e_m, tzinfo=teacher_tz)
            if e_dt_teacher <= dt_teacher:
                e_dt_teacher += timedelta(days=1)
            e_dt_viewer = e_dt_teacher.astimezone(viewer_tz)
            
            result[viewer_day].append({
                'start': dt_viewer.strftime('%H:%M'),
                'end': e_dt_viewer.strftime('%H:%M'),
            })

    # Sort slots by start time
    for day in result:
        result[day] = sorted(result[day], key=lambda s: s['start'])
    return result


def _duration_allowed(teacher_session_duration, requested_duration):
    return requested_duration in (30, 60)


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
    """Generate bookable slots for a specific calendar date.
    
    Adjacent/overlapping availability rows are dynamically merged into a
    single continuous window, and slots of `duration_minutes` are generated
    aligning to the step boundaries.
    """
    session_duration = getattr(teacher, 'session_duration', '60') or '60'
    if not _duration_allowed(session_duration, duration_minutes):
        return []

    step_minutes = duration_minutes

    teacher_tz_name = get_teacher_timezone(teacher)
    teacher_tz = ZoneInfo(teacher_tz_name)
    viewer_tz = ZoneInfo(viewer_timezone)

    target_weekday_idx = target_date.weekday()
    candidate_indices = [(target_weekday_idx - 1) % 7, target_weekday_idx, (target_weekday_idx + 1) % 7]
    query_weekdays = [WEEKDAYS[idx] for idx in candidate_indices]

    availabilities = teacher.availabilities.filter(day_of_week__in=query_weekdays, is_available=True)

    windows = []
    for av in availabilities:
        av_idx = WEEKDAYS.index(av.day_of_week)
        diff = av_idx - target_weekday_idx
        if diff == -6:
            diff = 1
        elif diff == 6:
            diff = -1

        slot_date_teacher = target_date + timedelta(days=diff)

        av_start_dt = datetime.combine(slot_date_teacher, av.start_time)
        av_end_dt = datetime.combine(slot_date_teacher, av.end_time)
        if av.end_time < av.start_time:
            av_end_dt += timedelta(days=1)
        
        av_dur = int((av_end_dt - av_start_dt).total_seconds() / 60)
        is_dur_matching = False
        if duration_minutes == 60:
            is_dur_matching = (av_dur % 60 == 0)
        elif duration_minutes == 30:
            is_dur_matching = (av_dur % 30 == 0 and av_dur % 60 != 0)
        
        if is_dur_matching:
            windows.append((av_start_dt, av_end_dt))

    # Sort and merge overlapping or adjacent windows
    windows = sorted(windows, key=lambda w: w[0])
    merged_windows = []
    for start, end in windows:
        if not merged_windows:
            merged_windows.append((start, end))
        else:
            last_start, last_end = merged_windows[-1]
            if start <= last_end:
                merged_windows[-1] = (last_start, max(last_end, end))
            else:
                merged_windows.append((start, end))

    slots = []
    seen = set()

    for av_start_dt, av_end_dt in merged_windows:
        # Skip this availability row if it's too short for the requested duration
        av_dur = int((av_end_dt - av_start_dt).total_seconds() / 60)
        if av_dur < duration_minutes:
            continue

        # Generate sub-slots within this single availability window
        current_dt = av_start_dt
        while current_dt + timedelta(minutes=duration_minutes) <= av_end_dt:
            dt_teacher = current_dt.replace(tzinfo=teacher_tz)
            dt_utc = dt_teacher.astimezone(ZoneInfo('UTC'))
            slot_end = dt_utc + timedelta(minutes=duration_minutes)

            if dt_utc >= django_tz.now():
                is_booked = _bookings_overlap(dt_utc, slot_end, active_bookings)
                if not is_booked:
                    dt_viewer = dt_teacher.astimezone(viewer_tz)
                    if dt_viewer.date() == target_date:
                        time_str = dt_viewer.strftime('%H:%M')
                        key = (time_str, dt_utc.isoformat())
                        if key not in seen:
                            seen.add(key)
                            slots.append({
                                'time': time_str,
                                'utc': dt_utc.isoformat(),
                                'available': True,
                            })
            current_dt += timedelta(minutes=step_minutes)

    slots.sort(key=lambda s: s['utc'])
    return slots


def validate_booking_slot(teacher, scheduled_date, duration_minutes):
    """Raise ValueError if slot is not bookable.
    
    Validates that the requested slot fits within the merged availability windows.
    """
    if teacher.status != 'approved':
        raise ValueError('Teacher is not available for booking')

    session_duration = getattr(teacher, 'session_duration', '60') or '60'
    if not _duration_allowed(session_duration, duration_minutes):
        raise ValueError(f'Teacher does not offer {duration_minutes}-minute sessions')

    teacher_tz_name = get_teacher_timezone(teacher)
    teacher_tz = ZoneInfo(teacher_tz_name)

    if django_tz.is_naive(scheduled_date):
        scheduled_date = django_tz.make_aware(scheduled_date)

    dt_teacher = scheduled_date.astimezone(teacher_tz)
    
    target_weekday_idx = dt_teacher.weekday()
    candidate_indices = [(target_weekday_idx - 1) % 7, target_weekday_idx, (target_weekday_idx + 1) % 7]
    query_weekdays = [WEEKDAYS[idx] for idx in candidate_indices]

    availabilities = teacher.availabilities.filter(
        day_of_week__in=query_weekdays, is_available=True
    )

    windows = []
    for av in availabilities:
        av_idx = WEEKDAYS.index(av.day_of_week)
        diff = av_idx - target_weekday_idx
        if diff == -6:
            diff = 1
        elif diff == 6:
            diff = -1

        slot_date_teacher = dt_teacher.date() + timedelta(days=diff)

        av_start_dt = datetime.combine(slot_date_teacher, av.start_time)
        av_end_dt = datetime.combine(slot_date_teacher, av.end_time)
        if av.end_time < av.start_time:
            av_end_dt += timedelta(days=1)
        
        av_dur = int((av_end_dt - av_start_dt).total_seconds() / 60)
        is_dur_matching = False
        if duration_minutes == 60:
            is_dur_matching = (av_dur % 60 == 0)
        elif duration_minutes == 30:
            is_dur_matching = (av_dur % 30 == 0 and av_dur % 60 != 0)
        
        if is_dur_matching:
            windows.append((av_start_dt, av_end_dt))

    # Sort and merge overlapping or adjacent windows
    windows = sorted(windows, key=lambda w: w[0])
    merged_windows = []
    for start, end in windows:
        if not merged_windows:
            merged_windows.append((start, end))
        else:
            last_start, last_end = merged_windows[-1]
            if start <= last_end:
                merged_windows[-1] = (last_start, max(last_end, end))
            else:
                merged_windows.append((start, end))

    req_start_naive = dt_teacher.replace(tzinfo=None)
    req_end_naive = (dt_teacher + timedelta(minutes=duration_minutes)).replace(tzinfo=None)

    is_available = False
    for av_start_dt, av_end_dt in merged_windows:
        av_dur = int((av_end_dt - av_start_dt).total_seconds() / 60)
        if av_dur < duration_minutes:
            continue

        if av_start_dt <= req_start_naive and req_end_naive <= av_end_dt:
            # Verify the slot aligns to grid boundaries within this availability window
            minutes_diff = int((req_start_naive - av_start_dt).total_seconds() / 60)
            step_minutes = duration_minutes
            if minutes_diff % step_minutes == 0:
                is_available = True
                break

    if not is_available:
        raise ValueError('Selected time is not within teacher availability')

    slot_end = scheduled_date + timedelta(minutes=duration_minutes)
    active = teacher.bookings.exclude(status__in=['cancelled', 'no_show'])
    if _bookings_overlap(scheduled_date, slot_end, active):
        raise ValueError('This slot has already been booked')
