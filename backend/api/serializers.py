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
    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True)
    role = serializers.CharField(write_only=True, required=False, default="client")

    class Meta:
        model = User
        fields = ["username", "email", "password", "role"]

    def validate_role(self, value):
        if isinstance(value, str) and "expert" in value.lower():
            return "expert"
        return "client"

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Email already registered.")
        return email

    def create(self, validated_data):
        role = validated_data.pop("role", "client")
        raw_username = (validated_data.get("username") or "").strip()
        email = validated_data.get("email", "").strip().lower()
        if not raw_username:
            base = email.split("@")[0] if email else "user"
            candidate = base
            suffix = 1
            while User.objects.filter(username=candidate).exists():
                suffix += 1
                candidate = f"{base}{suffix}"
            validated_data["username"] = candidate
        validated_data["email"] = email
        user = User.objects.create_user(**validated_data)
        user.first_name = role  # simple role storage
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, attrs):
        identifier = attrs["username"].strip()
        password = attrs["password"]
        user = authenticate(username=identifier, password=password)
        if not user and "@" in identifier:
            user_obj = User.objects.filter(email__iexact=identifier).first()
            if user_obj:
                user = authenticate(username=user_obj.username, password=password)
        if not user:
            raise serializers.ValidationError("Invalid credentials")
        attrs["user"] = user
        return attrs


class EmailLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs["email"].strip()
        password = attrs["password"]
        user_obj = User.objects.filter(email__iexact=email).first()
        if not user_obj:
            raise serializers.ValidationError("Invalid credentials")
        user = authenticate(username=user_obj.username, password=password)
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
    avatar_url = serializers.SerializerMethodField()
    kyc_id_document_url = serializers.SerializerMethodField()
    kyc_trade_license_url = serializers.SerializerMethodField()
    kyc_background_check_url = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            "username",
            "email",
            "role",
            "email_verified",
            "verified_id",
            "verified_trade",
            "verified_background",
            "rate_min",
            "rate_max",
            "availability_days",
            "lat",
            "lng",
            "bio",
            "phone",
            "location",
            "avatar",
            "avatar_url",
            "kyc_id_document",
            "kyc_trade_license",
            "kyc_background_check",
            "kyc_id_document_url",
            "kyc_trade_license_url",
            "kyc_background_check_url",
        ]

    def _build_file_url(self, obj, field_name):
        file_field = getattr(obj, field_name)
        if not file_field:
            return ""
        request = self.context.get("request")
        url = file_field.url
        return request.build_absolute_uri(url) if request else url

    def validate_avatar(self, value):
        if value is None:
            return value
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Avatar too large (max 5MB).")
        if value.content_type not in ["image/jpeg", "image/png"]:
            raise serializers.ValidationError("Unsupported image type.")
        return value

    def _validate_file(self, value):
        if value is None:
            return value
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("File too large (max 5MB).")
        if value.content_type not in ["image/jpeg", "image/png", "application/pdf"]:
            raise serializers.ValidationError("Unsupported file type.")
        return value

    def validate_kyc_id_document(self, value):
        return self._validate_file(value)

    def validate_kyc_trade_license(self, value):
        return self._validate_file(value)

    def validate_kyc_background_check(self, value):
        return self._validate_file(value)

    def get_kyc_id_document_url(self, obj):
        return self._build_file_url(obj, "kyc_id_document")

    def get_kyc_trade_license_url(self, obj):
        return self._build_file_url(obj, "kyc_trade_license")

    def get_kyc_background_check_url(self, obj):
        return self._build_file_url(obj, "kyc_background_check")

    def get_avatar_url(self, obj):
        return self._build_file_url(obj, "avatar")

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        is_owner = user and user.is_authenticated and user.id == instance.user_id
        is_admin = user and user.is_authenticated and user.is_staff
        if not (is_owner or is_admin):
            for field in [
                "kyc_id_document",
                "kyc_trade_license",
                "kyc_background_check",
                "kyc_id_document_url",
                "kyc_trade_license_url",
                "kyc_background_check_url",
            ]:
                data.pop(field, None)
        return data


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
    image_file = serializers.ImageField(source="image", required=False, allow_null=True)

    class Meta:
        model = Product
        fields = "__all__"
        read_only_fields = ["seller", "created_at", "seller_name"]

    def validate_image_file(self, value):
        if value is None:
            return value
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Image too large (max 5MB).")
        if value.content_type not in ["image/jpeg", "image/png"]:
            raise serializers.ValidationError("Unsupported image type.")
        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.image:
            request = self.context.get("request")
            url = instance.image.url
            data["image_url"] = request.build_absolute_uri(url) if request else url
        return data


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
