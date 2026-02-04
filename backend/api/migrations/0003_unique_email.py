from django.db import migrations
from django.db.models import Count


def ensure_unique_emails(apps, schema_editor):
    User = apps.get_model("auth", "User")
    duplicates = (
        User.objects.exclude(email="")
        .values("email")
        .order_by()
        .annotate(count_id=Count("id"))
        .filter(count_id__gt=1)
    )
    if duplicates.exists():
        dupe_list = ", ".join([item["email"] for item in duplicates[:5]])
        raise RuntimeError(
            "Duplicate emails found; cannot enforce uniqueness. "
            f"Examples: {dupe_list}"
        )


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0002_products_quotes_chat"),
    ]

    operations = [
        migrations.RunPython(ensure_unique_emails, reverse_code=migrations.RunPython.noop),
        migrations.RunSQL(
            sql="CREATE UNIQUE INDEX IF NOT EXISTS unique_auth_user_email ON auth_user (email);",
            reverse_sql="DROP INDEX IF EXISTS unique_auth_user_email;",
        ),
    ]
