from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ("client", "Client"),
        ("expert", "Expert"),
    ]
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="client")
    verified_id = models.BooleanField(default=False)
    verified_trade = models.BooleanField(default=False)
    verified_background = models.BooleanField(default=False)
    rate_min = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    rate_max = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    availability_days = models.PositiveIntegerField(null=True, blank=True)
    lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"


class Job(models.Model):
    STATUS_CHOICES = [
        ("applications_open", "Applications open"),
        ("shortlisting", "Shortlisting"),
        ("prefunded", "Pre-funded escrow"),
        ("in_progress", "In progress"),
        ("completed", "Completed"),
    ]
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    budget = models.DecimalField(max_digits=12, decimal_places=2)
    location = models.CharField(max_length=255, blank=True)
    lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="applications_open")
    posted_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="jobs")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Proposal(models.Model):
    STATE_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("declined", "Declined"),
        ("counter", "Counter"),
    ]
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="proposals")
    expert = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="proposals")
    price = models.DecimalField(max_digits=12, decimal_places=2)
    revisions = models.PositiveIntegerField(default=1)
    state = models.CharField(max_length=20, choices=STATE_CHOICES, default="pending")
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.job} - {self.expert}"


class Milestone(models.Model):
    STATE_CHOICES = [
        ("submitted", "Submitted"),
        ("approved", "Approved"),
        ("in_dispute", "In dispute"),
        ("released", "Released"),
    ]
    proposal = models.ForeignKey(Proposal, on_delete=models.CASCADE, related_name="milestones")
    title = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    state = models.CharField(max_length=20, choices=STATE_CHOICES, default="submitted")
    order = models.PositiveIntegerField(default=1)
    auto_release_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "created_at"]

    def __str__(self):
        return f"{self.title} ({self.state})"


class Review(models.Model):
    contract_id = models.CharField(max_length=50)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews_written")
    target = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews_received")
    rating = models.PositiveIntegerField()
    text = models.TextField()
    evidence = models.JSONField(default=list, blank=True)
    private_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.contract_id}: {self.rating}"


class Notification(models.Model):
    TYPE_CHOICES = [
        ("proposal", "Proposal"),
        ("payout", "Payout"),
        ("dispute", "Dispute"),
        ("milestone", "Milestone"),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    text = models.CharField(max_length=255)
    unread = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.text}"


class Payout(models.Model):
    METHOD_CHOICES = [
        ("momo", "Mobile Money"),
        ("bank", "Bank"),
        ("card", "Card"),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="payouts")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=10, choices=METHOD_CHOICES)
    fees = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, default="pending")
    receipt_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payout {self.amount} {self.method} ({self.status})"


class NotificationPreference(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notification_pref")
    email_enabled = models.BooleanField(default=True)
    push_enabled = models.BooleanField(default=False)
    def __str__(self):
        return f"Prefs for {self.user}"


class Product(models.Model):
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="products")
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=120, blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    unit = models.CharField(max_length=50, blank=True)
    quantity = models.PositiveIntegerField(default=0)
    location = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    image_url = models.URLField(blank=True)
    contact_phone = models.CharField(max_length=50, blank=True)
    contact_email = models.EmailField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.seller})"


class QuoteRequest(models.Model):
    STATUS_CHOICES = [
        ("new", "New"),
        ("reviewing", "Reviewing"),
        ("quoted", "Quoted"),
        ("accepted", "Accepted"),
        ("declined", "Declined"),
    ]
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="quotes")
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quotes")
    quantity = models.PositiveIntegerField(default=0)
    delivery_location = models.CharField(max_length=255, blank=True)
    needed_by = models.CharField(max_length=100, blank=True)
    target_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="new")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Quote {self.product} by {self.buyer}"


class ChatThread(models.Model):
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="chat_threads")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Thread {self.id}"


class ChatMessage(models.Model):
    thread = models.ForeignKey(ChatThread, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chat_messages")
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Message {self.id} in {self.thread_id}"
