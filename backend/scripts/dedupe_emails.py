import argparse
import os
import sys

import django


def setup_django():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if base_dir not in sys.path:
        sys.path.insert(0, base_dir)
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "skillset.settings")
    django.setup()


def normalize_email(email):
    return (email or "").strip().lower()


def generate_unique_email(base_email, existing_set):
    if "@" not in base_email:
        return None
    local, domain = base_email.split("@", 1)
    suffix = 1
    while True:
        candidate = f"{local}+{suffix}@{domain}"
        if candidate not in existing_set:
            return candidate
        suffix += 1


def main():
    parser = argparse.ArgumentParser(description="Deduplicate auth_user emails.")
    parser.add_argument("--apply", action="store_true", help="Apply changes (default: dry run).")
    args = parser.parse_args()

    setup_django()

    from django.contrib.auth import get_user_model
    from django.db.models import Count

    User = get_user_model()
    users = User.objects.exclude(email="").order_by("email", "id")

    email_counts = (
        users.values("email")
        .annotate(count_id=Count("id"))
        .filter(count_id__gt=1)
    )

    if not email_counts.exists():
        print("No duplicate emails found.")
        return

    existing_emails = set(User.objects.exclude(email="").values_list("email", flat=True))

    updates = []
    for entry in email_counts:
        email = entry["email"]
        dupes = list(User.objects.filter(email=email).order_by("id"))
        # keep the first, update the rest
        for user in dupes[1:]:
            new_email = generate_unique_email(normalize_email(email), existing_emails)
            if not new_email:
                continue
            updates.append((user.id, user.username, email, new_email))
            existing_emails.add(new_email)

    if not updates:
        print("Duplicates exist but no updates were generated.")
        return

    print("Planned updates:")
    for user_id, username, old_email, new_email in updates:
        print(f"- user_id={user_id} username={username} {old_email} -> {new_email}")

    if not args.apply:
        print("Dry run only. Re-run with --apply to save changes.")
        return

    for user_id, _, _, new_email in updates:
        User.objects.filter(id=user_id).update(email=new_email)

    print(f"Updated {len(updates)} users.")


if __name__ == "__main__":
    main()
