"""لایه ارتباط با گوگل درایو (Drive API v3)."""

from __future__ import annotations

import io
import logging
import threading
from dataclasses import dataclass

from google.auth.transport.requests import Request
from google.oauth2 import service_account
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaIoBaseUpload

from config import Settings

log = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/drive"]
TOKEN_URI = "https://oauth2.googleapis.com/token"
FOLDER_MIME = "application/vnd.google-apps.folder"
DOC_MIME = "application/vnd.google-apps.document"
CHUNK_SIZE = 4 * 1024 * 1024


class DriveError(RuntimeError):
    """خطای قابل نمایش به کاربر."""


@dataclass(frozen=True)
class UploadedFile:
    id: str
    name: str
    link: str


def _quote(name: str) -> str:
    """escape کردن نام برای استفاده در کوئری Drive."""
    return name.replace("\\", "\\\\").replace("'", "\\'")


class DriveUploader:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._service = None
        self._lock = threading.Lock()  # httplib2 کلاینت گوگل thread-safe نیست
        self._folder_cache: dict[tuple[str, str], str] = {}
        self._root_info: UploadedFile | None = None

    # ------------------------------------------------------------------ auth
    def _build_credentials(self):
        if self._settings.use_service_account:
            log.info("احراز هویت گوگل با Service Account")
            return service_account.Credentials.from_service_account_file(
                self._settings.service_account_file, scopes=SCOPES
            )

        log.info("احراز هویت گوگل با OAuth2 (refresh token)")
        creds = Credentials(
            token=None,
            refresh_token=self._settings.refresh_token,
            client_id=self._settings.client_id,
            client_secret=self._settings.client_secret,
            token_uri=TOKEN_URI,
            scopes=SCOPES,
        )
        try:
            creds.refresh(Request())
        except Exception as exc:  # noqa: BLE001
            raise DriveError(
                "گرفتن access token از گوگل شکست خورد. "
                "GOOGLE_CLIENT_ID / SECRET / REFRESH_TOKEN را چک کن "
                f"(جزئیات: {exc})."
            ) from exc
        return creds

    @property
    def service(self):
        if self._service is None:
            self._service = build(
                "drive",
                "v3",
                credentials=self._build_credentials(),
                cache_discovery=False,
                static_discovery=True,
            )
        return self._service

    # --------------------------------------------------------------- folders
    def root_folder(self) -> UploadedFile:
        """اطلاعات پوشه اصلی (کش‌شده)."""
        if self._root_info is None:
            with self._lock:
                try:
                    meta = (
                        self.service.files()
                        .get(
                            fileId=self._settings.drive_folder_id,
                            fields="id,name,webViewLink",
                            supportsAllDrives=True,
                        )
                        .execute(num_retries=3)
                    )
                except HttpError as exc:
                    raise DriveError(
                        "به پوشه درایو دسترسی ندارم. آیدی پوشه را چک کن و مطمئن شو "
                        "پوشه با ایمیل سرویس‌اکانت (در حالت سرویس‌اکانت) share شده، "
                        f"یا با همان اکانتی لاگین کرده‌ای که توکن را گرفتی. ({exc})"
                    ) from exc
            self._root_info = UploadedFile(
                id=meta["id"],
                name=meta.get("name", "Drive"),
                link=meta.get("webViewLink", "https://drive.google.com/drive/folders/" + meta["id"]),
            )
        return self._root_info

    def _find_or_create_folder(self, name: str, parent_id: str) -> str:
        cache_key = (parent_id, name)
        if cache_key in self._folder_cache:
            return self._folder_cache[cache_key]

        query = (
            f"name = '{_quote(name)}' and mimeType = '{FOLDER_MIME}' "
            f"and '{_quote(parent_id)}' in parents and trashed = false"
        )
        try:
            found = (
                self.service.files()
                .list(
                    q=query,
                    fields="files(id,name)",
                    pageSize=1,
                    supportsAllDrives=True,
                    includeItemsFromAllDrives=True,
                )
                .execute(num_retries=3)
            )
            files = found.get("files", [])
            if files:
                folder_id = files[0]["id"]
            else:
                created = (
                    self.service.files()
                    .create(
                        body={"name": name, "mimeType": FOLDER_MIME, "parents": [parent_id]},
                        fields="id",
                        supportsAllDrives=True,
                    )
                    .execute(num_retries=3)
                )
                folder_id = created["id"]
                log.info("زیرپوشه ساخته شد: %s (%s)", name, folder_id)
        except HttpError as exc:
            raise DriveError(f"ساخت/پیدا کردن پوشه «{name}» شکست خورد: {exc}") from exc

        self._folder_cache[cache_key] = folder_id
        return folder_id

    def target_folder(self, subfolder: str | None) -> str:
        """پوشه‌ای که فایل باید داخلش برود."""
        root = self.root_folder().id
        if not subfolder:
            return root
        return self._find_or_create_folder(subfolder, root)

    # --------------------------------------------------------------- upload
    def upload(
        self,
        data: bytes,
        name: str,
        mimetype: str,
        *,
        description: str = "",
        subfolder: str | None = None,
        as_google_doc: bool = False,
    ) -> UploadedFile:
        parent_id = self.target_folder(subfolder)

        metadata: dict = {"name": name, "parents": [parent_id]}
        if description:
            metadata["description"] = description[:1000]
        if as_google_doc:
            metadata["mimeType"] = DOC_MIME

        media = MediaIoBaseUpload(
            io.BytesIO(data),
            mimetype=mimetype,
            chunksize=CHUNK_SIZE,
            resumable=len(data) > CHUNK_SIZE,
        )

        with self._lock:
            try:
                request = self.service.files().create(
                    body=metadata,
                    media_body=media,
                    fields="id,name,webViewLink",
                    supportsAllDrives=True,
                )
                result = request.execute(num_retries=3)
            except HttpError as exc:
                raise DriveError(_human_error(exc)) from exc

        return UploadedFile(
            id=result["id"],
            name=result.get("name", name),
            link=result.get("webViewLink", "https://drive.google.com/file/d/" + result["id"] + "/view"),
        )


def _human_error(exc: HttpError) -> str:
    status = getattr(exc.resp, "status", 0)
    if status == 401:
        return "توکن گوگل منقضی/نامعتبر است. get_refresh_token.py را دوباره اجرا کن."
    if status == 403:
        return (
            "گوگل اجازه نداد (403). معمولاً یعنی سهمیه فضای درایو پر است، "
            f"یا دسترسی پوشه کامل نیست. ({exc})"
        )
    if status == 404:
        return "پوشه مقصد پیدا نشد. DRIVE_FOLDER_ID را چک کن."
    return f"آپلود به گوگل درایو شکست خورد: {exc}"
