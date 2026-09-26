import os
import json
import uuid
import datetime
from django.conf import settings

STORE_FILE_PATH = os.path.join(getattr(settings, 'BASE_DIR', os.getcwd()), 'session_security_store.json')

_memory_cache = {
    'sessions': {},
    'password_changes': {}
}

def _load_store():
    global _memory_cache
    if os.path.exists(STORE_FILE_PATH):
        try:
            with open(STORE_FILE_PATH, 'r', encoding='utf-8') as f:
                data = json.load(f)
                _memory_cache['sessions'] = data.get('sessions', {})
                _memory_cache['password_changes'] = data.get('password_changes', {})
        except Exception as e:
            print("session_store: load error:", e)

def _save_store():
    try:
        with open(STORE_FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(_memory_cache, f, indent=2)
    except Exception as e:
        print("session_store: save error:", e)

# Initial load
_load_store()

def generate_session_key() -> str:
    """Generate a unique session identifier."""
    return uuid.uuid4().hex

def get_active_session(user_id: int | str) -> str | None:
    """Get the currently active session key for a user."""
    _load_store()
    sess = _memory_cache['sessions'].get(str(user_id))
    if isinstance(sess, dict):
        return sess.get('session_key')
    return sess

def set_active_session(user_id: int | str, session_key: str | None = None) -> str:
    """
    Set a new active session key for the user, invalidating any previous session.
    Returns the new active session key.
    """
    if not session_key:
        session_key = generate_session_key()
    
    _memory_cache['sessions'][str(user_id)] = {
        'session_key': session_key,
        'updated_at': datetime.datetime.utcnow().isoformat()
    }
    _save_store()
    return session_key

def invalidate_session(user_id: int | str) -> None:
    """Terminate the active session for a user."""
    if str(user_id) in _memory_cache['sessions']:
        del _memory_cache['sessions'][str(user_id)]
        _save_store()

def is_session_valid(user_id: int | str, session_key: str) -> bool:
    """
    Validate whether the provided session_key is the current active session.
    Returns False if an active session exists and does not match the provided key.
    """
    if not session_key:
        return False
    
    active_key = get_active_session(user_id)
    if not active_key:
        # If no active session recorded yet, record this one as active
        set_active_session(user_id, session_key)
        return True
    
    return active_key == session_key

def record_password_change(user_id: int | str) -> None:
    """Record timestamp of when the user changed their password."""
    _memory_cache['password_changes'][str(user_id)] = datetime.datetime.utcnow().isoformat()
    _save_store()

def get_last_password_change(user_id: int | str) -> datetime.datetime | None:
    """Get the datetime of the last password change."""
    _load_store()
    ts_str = _memory_cache['password_changes'].get(str(user_id))
    if not ts_str:
        return None
    try:
        return datetime.datetime.fromisoformat(ts_str)
    except Exception:
        return None

def can_employee_change_password(user, cooldown_days: int = 30) -> tuple[bool, str]:
    """
    Check if the user is permitted to change their password.
    For employees:
    - If must_change_password is True (first login or forced reset), always allowed.
    - Otherwise, employee must wait at least cooldown_days (default 30 days) between changes.
    - All other roles (CEO, Ops Head, HR, TL) have normal self-service change permissions.
    """
    if getattr(user, 'role', '') != 'employee':
        return (True, "")
    
    # If the user was flagged to change password (e.g. initial login or admin reset), allow
    if getattr(user, 'must_change_password', False):
        return (True, "")
    
    last_change = get_last_password_change(user.id)
    if not last_change:
        return (True, "")
    
    delta = datetime.datetime.utcnow() - last_change
    if delta.days < cooldown_days:
        days_left = cooldown_days - delta.days
        return (
            False,
            f"Employees are restricted to updating their password once every {cooldown_days} days. "
            f"You have {days_left} day{'s' if days_left > 1 else ''} remaining before you can change it again. "
            f"If you require an immediate password change, please contact your HR Manager or Team Lead."
        )
    
    return (True, "")
