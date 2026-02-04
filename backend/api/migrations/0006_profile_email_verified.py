from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0005_profile_avatar"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="email_verified",
            field=models.BooleanField(default=False),
        ),
    ]
