"""Phase 4 tests — Placement Gallery + Website Enquiries."""
import os
import io
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/")
ADMIN = {"email": "admin@ugs.com", "password": "Admin@123"}
EMPLOYEE = {"email": "priya@ugs.com", "password": "Employee@123"}
CANDIDATE = {"email": "arjun.k@example.com", "password": "Candidate@123"}


def _login(creds):
    r = requests.post(f"{BASE}/api/auth/login", json=creds, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def admin_token():
    return _login(ADMIN)


@pytest.fixture(scope="module")
def emp_token():
    return _login(EMPLOYEE)


def _h(tok):
    return {"Authorization": f"Bearer {tok}"}


# ----------------- PLACEMENTS -----------------
class TestPlacementsPublic:
    def test_public_list_returns_seeded(self):
        r = requests.get(f"{BASE}/api/public/placements", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 8, f"expected >=8 seeded, got {len(data)}"
        assert all(p.get("is_published") for p in data)
        first = data[0]
        for k in ("candidate_name", "company_name", "job_role"):
            assert k in first

    def test_public_list_no_auth_required(self):
        r = requests.get(f"{BASE}/api/public/placements", timeout=15)
        assert r.status_code == 200


class TestPlacementsAdmin:
    created_id = None

    def test_list_admin(self, admin_token):
        r = requests.get(f"{BASE}/api/placements", headers=_h(admin_token), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_rbac_employee_cannot_list(self, emp_token):
        r = requests.get(f"{BASE}/api/placements", headers=_h(emp_token), timeout=15)
        assert r.status_code == 403

    def test_rbac_employee_cannot_create(self, emp_token):
        r = requests.post(f"{BASE}/api/placements", headers=_h(emp_token),
                          data={"candidate_name": "X", "company_name": "Y", "job_role": "Z"}, timeout=15)
        assert r.status_code == 403

    def test_create_update_publish_delete(self, admin_token):
        # CREATE with file uploads
        files = {
            "candidate_photo": ("photo.png", b"\x89PNG\r\n\x1a\n" + b"\0" * 20, "image/png"),
            "company_logo": ("logo.png", b"\x89PNG\r\n\x1a\n" + b"\0" * 20, "image/png"),
        }
        data = {
            "candidate_name": "TEST_Cand", "company_name": "TEST_Co",
            "job_role": "Test Role", "package": "₹5 LPA",
            "placement_date": "2025-12-01",
            "short_description": "unit test",
            "display_order": "99", "is_published": "true",
        }
        r = requests.post(f"{BASE}/api/placements", headers=_h(admin_token),
                          data=data, files=files, timeout=30)
        assert r.status_code == 200, r.text
        p = r.json()
        pid = p["id"]
        assert p["candidate_name"] == "TEST_Cand"
        assert p["candidate_photo_file_id"] and p["company_logo_file_id"]

        # UPDATE
        r = requests.patch(f"{BASE}/api/placements/{pid}", headers=_h(admin_token),
                           data={"job_role": "Updated Role"}, timeout=15)
        assert r.status_code == 200
        assert r.json()["job_role"] == "Updated Role"

        # HIDE
        r = requests.post(f"{BASE}/api/placements/{pid}/hide", headers=_h(admin_token), timeout=10)
        assert r.status_code == 200

        # Verify not in public listing
        pub = requests.get(f"{BASE}/api/public/placements", timeout=15).json()
        assert not any(x["id"] == pid for x in pub)

        # PUBLISH
        r = requests.post(f"{BASE}/api/placements/{pid}/publish", headers=_h(admin_token), timeout=10)
        assert r.status_code == 200
        pub = requests.get(f"{BASE}/api/public/placements", timeout=15).json()
        assert any(x["id"] == pid for x in pub)

        # DELETE
        r = requests.delete(f"{BASE}/api/placements/{pid}", headers=_h(admin_token), timeout=10)
        assert r.status_code == 200


# ----------------- ENQUIRIES -----------------
class TestEnquiries:
    created_id = None

    def test_public_submit_no_auth(self):
        payload = {"name": "TEST_Person", "email": "test_p4@example.com",
                   "phone": "9999999999", "subject": "TEST subject",
                   "message": "This is a phase4 test enquiry"}
        r = requests.post(f"{BASE}/api/public/enquiries", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["success"] and j["id"]
        TestEnquiries.created_id = j["id"]

    def test_admin_list_and_unread(self, admin_token):
        r = requests.get(f"{BASE}/api/enquiries", headers=_h(admin_token), timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert "items" in j and "total" in j and "unread" in j
        assert j["unread"] >= 1
        assert any(e["id"] == TestEnquiries.created_id for e in j["items"])

    def test_unread_count(self, admin_token):
        r = requests.get(f"{BASE}/api/enquiries/unread-count", headers=_h(admin_token), timeout=10)
        assert r.status_code == 200
        assert r.json()["unread"] >= 1

    def test_search_filter(self, admin_token):
        r = requests.get(f"{BASE}/api/enquiries?q=TEST_Person", headers=_h(admin_token), timeout=10)
        assert r.status_code == 200
        assert r.json()["total"] >= 1

    def test_rbac_employee_forbidden(self, emp_token):
        r = requests.get(f"{BASE}/api/enquiries", headers=_h(emp_token), timeout=10)
        assert r.status_code == 403

    def test_admin_notifications_fired(self, admin_token):
        r = requests.get(f"{BASE}/api/notifications", headers=_h(admin_token), timeout=15)
        assert r.status_code == 200
        notifs = r.json()
        items = notifs.get("items", notifs) if isinstance(notifs, dict) else notifs
        assert any("Enquiry" in (n.get("title") or "") for n in items), \
            f"no enquiry notification found in {items[:3]}"

    def test_mark_read(self, admin_token):
        eid = TestEnquiries.created_id
        r = requests.post(f"{BASE}/api/enquiries/{eid}/mark-read", headers=_h(admin_token), timeout=10)
        assert r.status_code == 200
        lst = requests.get(f"{BASE}/api/enquiries?q=TEST_Person", headers=_h(admin_token)).json()
        e = next(x for x in lst["items"] if x["id"] == eid)
        assert e["status"] == "read"

    def test_mark_replied(self, admin_token):
        eid = TestEnquiries.created_id
        r = requests.post(f"{BASE}/api/enquiries/{eid}/mark-replied",
                          headers=_h(admin_token), data={"reply_notes": "sent email"}, timeout=10)
        assert r.status_code == 200
        lst = requests.get(f"{BASE}/api/enquiries?q=TEST_Person", headers=_h(admin_token)).json()
        e = next(x for x in lst["items"] if x["id"] == eid)
        assert e["status"] == "replied"
        assert e["reply_notes"] == "sent email"
        assert e.get("replied_at")

    def test_status_filter(self, admin_token):
        r = requests.get(f"{BASE}/api/enquiries?status=replied", headers=_h(admin_token), timeout=10)
        assert r.status_code == 200
        for it in r.json()["items"]:
            assert it["status"] == "replied"

    def test_export_xlsx(self, admin_token):
        r = requests.get(f"{BASE}/api/enquiries/export/xlsx", headers=_h(admin_token), timeout=20)
        assert r.status_code == 200
        assert "spreadsheetml" in r.headers.get("content-type", "")
        # xlsx = zip magic PK
        assert r.content[:2] == b"PK"

    def test_delete(self, admin_token):
        eid = TestEnquiries.created_id
        r = requests.delete(f"{BASE}/api/enquiries/{eid}", headers=_h(admin_token), timeout=10)
        assert r.status_code == 200


class TestRBACPublicEnquiryNoAuth:
    def test_anonymous_can_submit(self):
        r = requests.post(f"{BASE}/api/public/enquiries", json={
            "name": "TEST_Anon", "email": "anon@test.com",
            "message": "hello"}, timeout=15)
        assert r.status_code == 200
        # cleanup
        eid = r.json()["id"]
        tok = _login(ADMIN)
        requests.delete(f"{BASE}/api/enquiries/{eid}", headers=_h(tok))
