from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0003_unique_email"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="bio",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="phone",
            field=models.CharField(blank=True, max_length=30),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="location",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="kyc_id_document",
            field=models.FileField(blank=True, null=True, upload_to="kyc/id/"),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="kyc_trade_license",
            field=models.FileField(blank=True, null=True, upload_to="kyc/trade/"),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="kyc_background_check",
            field=models.FileField(blank=True, null=True, upload_to="kyc/background/"),
        ),
        migrations.AddField(
            model_name="review",
            name="evidence_files",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="product",
            name="image",
            field=models.ImageField(blank=True, null=True, upload_to="products/"),
        ),
    ]
