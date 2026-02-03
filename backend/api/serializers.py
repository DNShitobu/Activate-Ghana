from django.contrib.auth import get_user_model, authenticate
from rest_framework import serializers
from .models import (
    Job,
    Proposal,
    Milestone,
    Review,
    Notification,
    Payout,
    UserProfile,
    NotificationPreference,
    Product,
    QuoteRequest,
    ChatThread,
    ChatMessage,
)

User = get_user_model()


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.CharField(write_only=True, required=False, default="client")

    class Meta:
        model = User
        fields = ["username", "email", "password", "role"]

    def validate_role(self, value):
        if isinstance(value, str) and "expert" in value.lower():
            return "expert"
        return "client"

    def create(self, validated_data):
        role = validated_data.pop("role", "client")
        user = User.objects.create_user(**validated_data)
        user.first_name = role  # simple role storage
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, attrs):
        user = authenticate(username=attrs["username"], password=attrs["password"])
        if not user:
            raise serializers.ValidationError("Invalid credentials")
        attrs["user"] = user
        return attrs


class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = "__all__"
        read_only_fields = ["posted_by", "created_at"]


class ProposalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proposal
        fields = "__all__"
        read_only_fields = ["state", "created_at"]


class ProposalUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proposal
        fields = ["state", "price", "revisions", "message"]


class MilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = "__all__"
        read_only_fields = ["created_at"]


class MilestoneUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = ["state", "auto_release_at"]


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = "__all__"
        read_only_fields = ["author", "created_at"]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"
        read_only_fields = ["user", "created_at"]


class PayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payout
        fields = "__all__"
        read_only_fields = ["user", "status", "created_at"]


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username")
    email = serializers.EmailField(source="user.email")

    class Meta:
        model = UserProfile
        fields = [
            "username",
            "email",
            "role",
            "verified_id",
            "verified_trade",
            "verified_background",
            "rate_min",
            "rate_max",
            "availability_days",
            "lat",
            "lng",
        ]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = ["email_enabled", "push_enabled"]


class UserAdminSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "is_staff", "role"]

    def get_role(self, obj):
        prof = getattr(obj, "profile", None)
        return getattr(prof, "role", "client")


class ProductSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source="seller.username", read_only=True)

    class Meta:
        model = Product
        fields = "__all__"
        read_only_fields = ["seller", "created_at", "seller_name"]


class QuoteRequestSerializer(serializers.ModelSerializer):
    buyer_name = serializers.CharField(source="buyer.username", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_seller_name = serializers.CharField(source="product.seller.username", read_only=True)

    class Meta:
        model = QuoteRequest
        fields = "__all__"
        read_only_fields = ["buyer", "status", "created_at", "buyer_name", "product_name", "product_seller_name"]


class QuoteRequestUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteRequest
        fields = ["status"]


class ChatThreadSerializer(serializers.ModelSerializer):
    participant_ids = serializers.ListField(write_only=True, required=False)
    participant_names = serializers.SerializerMethodField()

    class Meta:
        model = ChatThread
        fields = ["id", "participants", "participant_ids", "participant_names", "created_at"]
        read_only_fields = ["participants", "created_at"]

    def get_participant_names(self, obj):
        return [u.username for u in obj.participants.all()]


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.username", read_only=True)

    class Meta:
        model = ChatMessage
        fields = "__all__"
        read_only_fields = ["sender", "created_at", "sender_name"]
