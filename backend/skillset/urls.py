from pathlib import Path
from django.contrib import admin
from django.http import FileResponse, HttpResponseNotFound
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

PROJECT_ROOT = Path(__file__).resolve().parents[2]


def serve_index(request):
    index_path = PROJECT_ROOT / "index.html"
    if not index_path.exists():
        return HttpResponseNotFound("index.html not found at project root")
    return FileResponse(open(index_path, "rb"), content_type="text/html")


def serve_static(request, filepath):
    file_path = PROJECT_ROOT / filepath
    if not file_path.exists() or not file_path.is_file():
        return HttpResponseNotFound("File not found")
    return FileResponse(open(file_path, "rb"))

urlpatterns = [
    path("", serve_index),
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns += [
    path("<path:filepath>", serve_static),
]
