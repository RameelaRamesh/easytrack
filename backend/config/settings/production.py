from .base import *

DEBUG = os.getenv('DEBUG', 'False').lower() in ('true', '1', 't')

# Host Security
raw_allowed_hosts = os.getenv('ALLOWED_HOSTS', '*')
if raw_allowed_hosts:
    ALLOWED_HOSTS = [h.strip() for h in raw_allowed_hosts.split(',') if h.strip()]
    if '*' not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append('*')
else:
    ALLOWED_HOSTS = ['*']

# Security Settings
CSRF_COOKIE_SECURE = os.getenv('CSRF_COOKIE_SECURE', 'False').lower() in ('true', '1', 't')
SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'False').lower() in ('true', '1', 't')
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'False').lower() in ('true', '1', 't')
SECURE_HSTS_SECONDS = int(os.getenv('SECURE_HSTS_SECONDS', '31536000'))
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
X_FRAME_OPTIONS = 'DENY'

raw_csrf = os.getenv('CSRF_TRUSTED_ORIGINS', 'https://easytrack.vattarasolutions.com,http://easytrack.vattarasolutions.com,https://vattarasolutions.com,http://vattarasolutions.com,https://vattara.com,http://vattara.com,http://147.93.107.43')
CSRF_TRUSTED_ORIGINS = [org.strip() for org in raw_csrf.split(',') if org.strip()]

# Static Files Storage with WhiteNoise
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Database Configuration
DB_NAME = os.getenv('DB_NAME', 'easytrack_db')
DB_USER = os.getenv('DB_USER', 'easytrack_user')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'easytrack_pass_2026')
DB_HOST = os.getenv('DB_HOST', 'db')
DB_PORT = os.getenv('DB_PORT', '5432')

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': DB_NAME,
        'USER': DB_USER,
        'PASSWORD': DB_PASSWORD,
        'HOST': DB_HOST,
        'PORT': DB_PORT,
    }
}

# CORS Configuration
raw_cors = os.getenv('CORS_ALLOWED_ORIGINS', 'https://easytrack.vattarasolutions.com,http://easytrack.vattarasolutions.com,https://vattarasolutions.com,http://vattarasolutions.com,https://vattara.com,http://vattara.com,http://147.93.107.43,http://localhost:5173')
CORS_ALLOWED_ORIGINS = [org.strip() for org in raw_cors.split(',') if org.strip()]
CORS_ALLOW_CREDENTIALS = True

