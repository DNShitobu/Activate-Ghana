from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Product",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("category", models.CharField(blank=True, max_length=120)),
                ("price", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("unit", models.CharField(blank=True, max_length=50)),
                ("quantity", models.PositiveIntegerField(default=0)),
                ("location", models.CharField(blank=True, max_length=255)),
                ("description", models.TextField(blank=True)),
                ("image_url", models.URLField(blank=True)),
                ("contact_phone", models.CharField(blank=True, max_length=50)),
                ("contact_email", models.EmailField(blank=True, max_length=254)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("seller", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="products", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="QuoteRequest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("quantity", models.PositiveIntegerField(default=0)),
                ("delivery_location", models.CharField(blank=True, max_length=255)),
                ("needed_by", models.CharField(blank=True, max_length=100)),
                ("target_price", models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ("notes", models.TextField(blank=True)),
                ("status", models.CharField(choices=[("new", "New"), ("reviewing", "Reviewing"), ("quoted", "Quoted"), ("accepted", "Accepted"), ("declined", "Declined")], default="new", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("buyer", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="quotes", to=settings.AUTH_USER_MODEL)),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="quotes", to="api.product")),
            ],
        ),
        migrations.CreateModel(
            name="ChatThread",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("participants", models.ManyToManyField(related_name="chat_threads", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="ChatMessage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("text", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("sender", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="chat_messages", to=settings.AUTH_USER_MODEL)),
                ("thread", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="messages", to="api.chatthread")),
            ],
            options={
                "ordering": ["created_at"],
            },
        ),
    ]
