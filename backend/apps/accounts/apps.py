from django.apps import AppConfig

class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.accounts'

    def ready(self):
        try:
            import sys
            # Avoid running during management commands like makemigrations
            if 'makemigrations' not in sys.argv and 'migrate' not in sys.argv:
                from .views import ensure_default_accounts
                ensure_default_accounts()
        except Exception:
            pass
