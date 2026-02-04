from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0004_profile_uploads_and_media"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="avatar",
            field=models.ImageField(blank=True, null=True, upload_to="profiles/"),
        ),
    ]
