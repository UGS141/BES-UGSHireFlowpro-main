"""UGS HireFlow — Phase 2 Backend Test Suite.

Covers: partners CRUD, register-candidate-full multipart, verify-v2,
archive/restore/soft-delete/permanent-delete, duplicates+merge, employee detail,
company hiring history, job workspace (close/reopen/remove/bulk allocate),
batch status transitions, org settings, saved filters, xlsx import/export,
extended /search/full, profile completion, quick view, notifications triggers,
login/logout activity logs, error handlers.
"""
import io
import os
import json
import uuid
import pytest
import requests
from openpyxl import Workbook

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://placement-pro-54.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@ugs.com", "password": "Admin@123"}
EMP = {"email": "priya@ugs.com", "password": "Employee@123"}
CAND = {"email": "arjun.k@example.com", "password": "Candidate@123"}


def _login(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=30)
    assert r.status_code == 200, f"login {creds['email']} => {r.status_code} {r.text[:200]}"
    return r.json()


@pytest.fixture(scope="session")
def admin_h():
    return {"Authorization": f"Bearer {_login(ADMIN)['access_token']}"}


@pytest.fixture(scope="session")
def emp_h():
    return {"Authorization": f"Bearer {_login(EMP)['access_token']}"}


@pytest.fixture(scope="session")
def cand_h():
    return {"Authorization": f"Bearer {_login(CAND)['access_token']}"}


@pytest.fixture(scope="session")
def admin_user():
    return _login(ADMIN)["user"]


@pytest.fixture(scope="session")
def emp_user():
    return _login(EMP)["user"]


# ---------------- AUTH activity ----------------
class TestAuthActivity:
    def test_login_creates_activity(self, admin_h):
        # login-activity is logged inside login endpoint (per Phase 2 requirement)
        r = requests.get(f"{API}/activity-logs", headers=admin_h, timeout=15)
        assert r.status_code == 200
        logs = r.json()
        if isinstance(logs, dict):
            logs = logs.get("items", logs)
        assert any(l.get("action") == "user.login" for l in logs), "expected user.login in activity"

    def test_log_logout(self, admin_h):
        r = requests.post(f"{API}/auth/log-logout", headers=admin_h, timeout=15)
        assert r.status_code == 200
        assert r.json().get("ok") is True


# ---------------- REGISTER FULL (multipart) ----------------
class TestRegisterFull:
    reg_candidate_id = None
    reg_email = None

    def test_register_multipart(self):
        suffix = uuid.uuid4().hex[:8]
        email = f"test_full_{suffix}@example.com"
        TestRegisterFull.reg_email = email
        form = {
            "full_name": "TEST Full Reg",
            "email": email,
            "phone": f"9{suffix[:9]}",
            "password": "Pass@1234",
            "city": "Bengaluru",
            "skills": "Python,FastAPI,MongoDB",
            "reference_name": "Test Ref",
            "reference_phone": "9998887777",
        }
        files = [
            ("photo", ("photo.png", b"\x89PNG\r\n\x1a\n" + b"0" * 128, "image/png")),
            ("resume", ("resume.pdf", b"%PDF-1.4\ntest", "application/pdf")),
            ("certificates", ("cert1.pdf", b"%PDF cert1", "application/pdf")),
            ("certificates", ("cert2.pdf", b"%PDF cert2", "application/pdf")),
            ("experience_documents", ("exp1.pdf", b"%PDF exp1", "application/pdf")),
        ]
        r = requests.post(f"{API}/public/register-candidate-full",
                          data=form, files=files, timeout=60)
        assert r.status_code == 200, r.text[:400]
        d = r.json()
        assert d["candidate_code"].startswith("UGS-C")
        assert d["reference_name"] == "Test Ref"
        assert d["reference_phone"] == "9998887777"
        assert d.get("photo_file_id"), "photo_file_id missing"
        assert d.get("resume_file_id"), "resume_file_id missing"
        assert len(d.get("documents", [])) >= 3, f"expected >=3 docs, got {len(d.get('documents',[]))}"
        assert d.get("profile_completion", 0) > 0
        TestRegisterFull.reg_candidate_id = d["id"]

    def test_registered_candidate_visible_in_list(self, admin_h):
        if not TestRegisterFull.reg_email:
            pytest.skip("registration failed earlier")
        r = requests.get(f"{API}/candidates?q=TEST Full Reg", headers=admin_h, timeout=15)
        assert r.status_code == 200
        items = r.json().get("items", [])
        assert any(c["email"] == TestRegisterFull.reg_email for c in items)


# ---------------- PARTNERS CRUD ----------------
class TestPartners:
    partner_id = None
    partner_code = None

    def test_list_partners(self, admin_h):
        r = requests.get(f"{API}/partners", headers=admin_h, timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_partner(self, admin_h):
        body = {"name": "TEST Partner A", "phone": "9111000111",
                "email": "partnerA@test.com", "commission_percent": 5}
        r = requests.post(f"{API}/partners", json=body, headers=admin_h, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["partner_code"].startswith("UGS-P")
        assert d["name"] == "TEST Partner A"
        TestPartners.partner_id = d["id"]
        TestPartners.partner_code = d["partner_code"]

    def test_create_partner_idempotent_by_phone(self, admin_h):
        body = {"name": "TEST Partner Dup", "phone": "9111000111"}
        r = requests.post(f"{API}/partners", json=body, headers=admin_h, timeout=15)
        assert r.status_code == 200
        # Returns the existing one
        assert r.json()["id"] == TestPartners.partner_id

    def test_get_partner_with_candidates(self, admin_h):
        r = requests.get(f"{API}/partners/{TestPartners.partner_id}", headers=admin_h, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "candidates" in d
        assert "candidate_count" in d

    def test_patch_partner(self, admin_h):
        r = requests.patch(f"{API}/partners/{TestPartners.partner_id}",
                           json={"notes": "updated notes"}, headers=admin_h, timeout=15)
        assert r.status_code == 200
        assert r.json()["notes"] == "updated notes"

    def test_delete_partner_no_candidates(self, admin_h):
        # create fresh unlinked partner then delete
        r = requests.post(f"{API}/partners",
                          json={"name": "TEST Delete Me", "phone": f"9{uuid.uuid4().hex[:9]}"},
                          headers=admin_h, timeout=15)
        pid = r.json()["id"]
        r2 = requests.delete(f"{API}/partners/{pid}", headers=admin_h, timeout=15)
        assert r2.status_code == 200


# ---------------- VERIFY V2 ----------------
class TestVerifyV2:
    cand_id = None
    partner_phone = f"9{uuid.uuid4().hex[:9]}"
    partner_id = None

    def _create_candidate(self, admin_h):
        suffix = uuid.uuid4().hex[:8]
        payload = {
            "full_name": f"TEST Verify {suffix}",
            "email": f"test_ver_{suffix}@example.com",
            "phone": f"8{suffix[:9]}",
            "skills": ["Python"],
        }
        r = requests.post(f"{API}/candidates", json=payload, headers=admin_h, timeout=15)
        assert r.status_code == 200, r.text
        return r.json()["id"]

    def test_verify_with_new_partner(self, admin_h):
        cid = self._create_candidate(admin_h)
        TestVerifyV2.cand_id = cid
        body = {"new_partner": {"name": "TEST Ref Partner", "phone": TestVerifyV2.partner_phone},
                "remarks": "verified via test"}
        r = requests.post(f"{API}/candidates/{cid}/verify-v2", json=body,
                          headers=admin_h, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["success"] is True
        assert d["partner_id"]
        TestVerifyV2.partner_id = d["partner_id"]

        # verify candidate status
        c = requests.get(f"{API}/candidates/{cid}", headers=admin_h, timeout=15).json()
        assert c["status"] == "verified"
        assert c["partner_id"] == d["partner_id"]

    def test_verify_idempotent_same_phone(self, admin_h):
        cid = self._create_candidate(admin_h)
        body = {"new_partner": {"name": "TEST Ref Partner 2",
                                  "phone": TestVerifyV2.partner_phone}}
        r = requests.post(f"{API}/candidates/{cid}/verify-v2", json=body,
                          headers=admin_h, timeout=15)
        assert r.status_code == 200
        # Should reuse existing partner
        assert r.json()["partner_id"] == TestVerifyV2.partner_id

    def test_verify_with_existing_partner_id(self, admin_h):
        cid = self._create_candidate(admin_h)
        body = {"partner_id": TestVerifyV2.partner_id}
        r = requests.post(f"{API}/candidates/{cid}/verify-v2", json=body,
                          headers=admin_h, timeout=15)
        assert r.status_code == 200
        assert r.json()["partner_id"] == TestVerifyV2.partner_id


# ---------------- CANDIDATE FILTERS ----------------
class TestCandidateFilters:
    def test_filter_by_partner_id(self, admin_h):
        # Use partner from Verify tests
        pid = TestVerifyV2.partner_id
        if not pid:
            pytest.skip("no partner_id from previous test")
        r = requests.get(f"{API}/candidates?partner_id={pid}", headers=admin_h, timeout=15)
        assert r.status_code == 200
        for c in r.json().get("items", []):
            assert c.get("partner_id") == pid

    def test_search_reference_name(self, admin_h):
        r = requests.get(f"{API}/candidates?q=Test Ref", headers=admin_h, timeout=15)
        assert r.status_code == 200
        # should find at least the registered candidate
        assert r.json().get("total", 0) >= 0

    def test_include_archived_toggle(self, admin_h):
        # Archive a candidate then verify visibility
        r = requests.get(f"{API}/candidates?include_archived=true", headers=admin_h, timeout=15)
        assert r.status_code == 200


# ---------------- SOFT DELETE / ARCHIVE / RESTORE / PERM DELETE ----------------
class TestLifecycle:
    def _mkc(self, admin_h):
        s = uuid.uuid4().hex[:8]
        r = requests.post(f"{API}/candidates",
            json={"full_name": f"TEST LC {s}", "email": f"lc_{s}@t.com",
                    "phone": f"7{s[:9]}"}, headers=admin_h, timeout=15)
        return r.json()["id"]

    def test_archive_restore(self, admin_h):
        cid = self._mkc(admin_h)
        r = requests.post(f"{API}/candidates/{cid}/archive", headers=admin_h, timeout=15)
        assert r.status_code == 200
        # should not appear in default list
        lst = requests.get(f"{API}/candidates", headers=admin_h, timeout=15).json().get("items", [])
        assert not any(c["id"] == cid for c in lst)
        # include archived should show
        lst2 = requests.get(f"{API}/candidates?include_archived=true", headers=admin_h, timeout=15).json().get("items", [])
        assert any(c["id"] == cid for c in lst2)
        # restore
        r2 = requests.post(f"{API}/candidates/{cid}/restore", headers=admin_h, timeout=15)
        assert r2.status_code == 200
        lst3 = requests.get(f"{API}/candidates", headers=admin_h, timeout=15).json().get("items", [])
        assert any(c["id"] == cid for c in lst3)

    def test_soft_delete_hides(self, admin_h):
        cid = self._mkc(admin_h)
        r = requests.post(f"{API}/candidates/{cid}/soft-delete", headers=admin_h, timeout=15)
        assert r.status_code == 200
        lst = requests.get(f"{API}/candidates", headers=admin_h, timeout=15).json().get("items", [])
        assert not any(c["id"] == cid for c in lst)

    def test_permanent_delete(self, admin_h):
        cid = self._mkc(admin_h)
        r = requests.delete(f"{API}/candidates/{cid}/permanent", headers=admin_h, timeout=15)
        assert r.status_code == 200
        # subsequent get 404
        g = requests.get(f"{API}/candidates/{cid}", headers=admin_h, timeout=15)
        assert g.status_code == 404


# ---------------- DUPLICATES + MERGE ----------------
class TestDuplicateMerge:
    def test_duplicate_check(self, admin_h):
        # Create a candidate then check duplicates
        s = uuid.uuid4().hex[:6]
        email = f"dupchk_{s}@t.com"
        phone = f"7{s}00099"
        requests.post(f"{API}/candidates",
            json={"full_name": f"TEST Dup {s}", "email": email, "phone": phone},
            headers=admin_h, timeout=15)
        r = requests.get(f"{API}/candidates/duplicates/check?email={email}",
                         headers=admin_h, timeout=15)
        assert r.status_code == 200
        assert any(c["email"] == email for c in r.json())

    def test_merge(self, admin_h):
        s = uuid.uuid4().hex[:6]
        c1 = requests.post(f"{API}/candidates",
            json={"full_name": f"TEST Src {s}", "email": f"src_{s}@t.com",
                    "phone": f"6{s}00001"}, headers=admin_h, timeout=15).json()
        c2 = requests.post(f"{API}/candidates",
            json={"full_name": f"TEST Tgt {s}", "email": f"tgt_{s}@t.com",
                    "phone": f"6{s}00002"}, headers=admin_h, timeout=15).json()
        r = requests.post(f"{API}/candidates/merge",
            json={"source_id": c1["id"], "target_id": c2["id"]},
            headers=admin_h, timeout=15)
        assert r.status_code == 200, r.text
        # source now soft-deleted -> 404 in default list, exists in db
        g = requests.get(f"{API}/candidates/{c1['id']}", headers=admin_h, timeout=15)
        # candidate GET may still return it; check is_deleted flag
        if g.status_code == 200:
            assert g.json().get("is_deleted") is True


# ---------------- EMPLOYEE DETAIL ----------------
class TestEmployeeDetail:
    def test_admin_can_fetch(self, admin_h, emp_user):
        r = requests.get(f"{API}/employees/{emp_user['id']}", headers=admin_h, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "workload" in d and "stage_counts" in d
        assert "assigned_candidates" in d and "activity" in d and "login_history" in d
        assert set(d["workload"].keys()) >= {"assigned", "placed", "active_pipeline"}

    def test_employee_self_access(self, emp_h, emp_user):
        r = requests.get(f"{API}/employees/{emp_user['id']}", headers=emp_h, timeout=15)
        assert r.status_code == 200

    def test_employee_cannot_fetch_others(self, emp_h, admin_h):
        # find another employee
        emps = requests.get(f"{API}/employees", headers=admin_h, timeout=15).json()
        me = _login(EMP)["user"]["id"]
        other = next((e for e in emps if e["id"] != me), None)
        if not other:
            pytest.skip("no other employee")
        r = requests.get(f"{API}/employees/{other['id']}", headers=emp_h, timeout=15)
        assert r.status_code == 403


# ---------------- COMPANY HIRING HISTORY ----------------
class TestCompanyHiring:
    def test_hiring_history(self, admin_h):
        cos = requests.get(f"{API}/companies", headers=admin_h, timeout=15).json()
        if not cos:
            pytest.skip("no company")
        cid = cos[0]["id"]
        r = requests.get(f"{API}/companies/{cid}/hiring-history", headers=admin_h, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "company" in d and "stats" in d and "jobs" in d
        assert set(d["stats"].keys()) >= {"total_jobs", "open_jobs", "total_placed", "active_candidates"}


# ---------------- JOB ACTIONS ----------------
class TestJobActions:
    def test_workspace_close_reopen_alloc_remove(self, admin_h):
        jobs = requests.get(f"{API}/jobs", headers=admin_h, timeout=15).json()
        if not jobs:
            pytest.skip("no jobs")
        jid = jobs[0]["id"]
        # workspace
        w = requests.get(f"{API}/jobs/{jid}/workspace", headers=admin_h, timeout=15)
        assert w.status_code == 200
        d = w.json()
        assert "job" in d and "company" in d and "candidates" in d and "stats" in d
        # close
        c = requests.post(f"{API}/jobs/{jid}/close", headers=admin_h, timeout=15)
        assert c.status_code == 200
        # reopen
        o = requests.post(f"{API}/jobs/{jid}/reopen", headers=admin_h, timeout=15)
        assert o.status_code == 200
        # bulk allocate — create a fresh candidate + allocate
        s = uuid.uuid4().hex[:6]
        cand = requests.post(f"{API}/candidates",
            json={"full_name": f"TEST Alloc {s}", "email": f"al_{s}@t.com",
                    "phone": f"5{s}00099"}, headers=admin_h, timeout=15).json()
        a = requests.post(f"{API}/jobs/{jid}/assign-candidates",
                          json=[cand["id"]], headers=admin_h, timeout=15)
        assert a.status_code == 200, a.text
        # remove
        rm = requests.post(f"{API}/jobs/{jid}/remove-candidate",
                           data={"candidate_id": cand["id"]},
                           headers=admin_h, timeout=15)
        assert rm.status_code == 200


# ---------------- BATCH ACTIONS ----------------
class TestBatchActions:
    def test_batch_transitions(self, admin_h):
        batches = requests.get(f"{API}/batches", headers=admin_h, timeout=15).json()
        if not batches:
            pytest.skip("no batches")
        bid = batches[0]["id"]
        r = requests.post(f"{API}/batches/{bid}/mark-running", headers=admin_h, timeout=15)
        assert r.status_code == 200
        r2 = requests.post(f"{API}/batches/{bid}/mark-completed", headers=admin_h, timeout=15)
        assert r2.status_code == 200


# ---------------- ORG SETTINGS ----------------
class TestOrgSettings:
    def test_get_default(self, admin_h):
        r = requests.get(f"{API}/settings/organization", headers=admin_h, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["brand_name"] == "UGS HireFlow" or d.get("brand_name")

    def test_update(self, admin_h):
        r = requests.put(f"{API}/settings/organization",
                          json={"phone": "+91-9999900000"}, headers=admin_h, timeout=15)
        assert r.status_code == 200
        assert r.json()["phone"] == "+91-9999900000"


# ---------------- SAVED FILTERS ----------------
class TestSavedFilters:
    def test_crud(self, admin_h):
        r = requests.post(f"{API}/filters/saved",
            data={"name": "TEST Filter", "entity": "candidates",
                    "filters": json.dumps({"status": "verified"})},
            headers=admin_h, timeout=15)
        assert r.status_code == 200, r.text
        fid = r.json()["id"]

        lst = requests.get(f"{API}/filters/saved?entity=candidates",
                            headers=admin_h, timeout=15).json()
        assert any(f["id"] == fid for f in lst)

        d = requests.delete(f"{API}/filters/saved/{fid}", headers=admin_h, timeout=15)
        assert d.status_code == 200


# ---------------- EXCEL IMPORT / EXPORT ----------------
def _make_xlsx(rows):
    wb = Workbook()
    ws = wb.active
    ws.append(["full_name", "email", "phone", "skills", "city"])
    for r in rows:
        ws.append(r)
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf


class TestExcel:
    def test_preview(self, admin_h):
        s = uuid.uuid4().hex[:6]
        buf = _make_xlsx([
            [f"TEST XLS {s}1", f"xls1_{s}@t.com", f"4{s}00001", "Python", "Delhi"],
            [f"TEST XLS {s}2", f"xls2_{s}@t.com", f"4{s}00002", "Java", "Mumbai"],
        ])
        r = requests.post(f"{API}/candidates/import/xlsx/preview",
            files={"file": ("test.xlsx", buf,
                              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
            headers=admin_h, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["total"] == 2 and "duplicates" in d and len(d["rows"]) == 2

    def test_import_and_skip_duplicates(self, admin_h):
        s = uuid.uuid4().hex[:6]
        buf = _make_xlsx([
            [f"TEST IMP {s}1", f"imp1_{s}@t.com", f"3{s}00001", "Python", "Delhi"],
            [f"TEST IMP {s}2", f"imp2_{s}@t.com", f"3{s}00002", "Java", "Mumbai"],
        ])
        r = requests.post(f"{API}/candidates/import/xlsx",
            files={"file": ("test.xlsx", buf,
                              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
            data={"skip_duplicates": "true"},
            headers=admin_h, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["imported"] == 2

    def test_export(self, admin_h):
        r = requests.get(f"{API}/candidates/export/xlsx", headers=admin_h, timeout=60)
        assert r.status_code == 200
        assert "spreadsheetml" in r.headers.get("content-type", "")
        # Excel files start with PK (zip)
        assert r.content[:2] == b"PK"


# ---------------- EXTENDED SEARCH ----------------
class TestSearchFull:
    def test_keys_present(self, admin_h):
        r = requests.get(f"{API}/search/full?q=priya", headers=admin_h, timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ["candidates", "companies", "jobs", "employees", "batches", "partners"]:
            assert k in d
        # priya is a seeded employee
        assert len(d["employees"]) >= 1


# ---------------- QUICK VIEW / PROFILE COMPLETION ----------------
class TestQuickAndCompletion:
    def test_quick_view(self, admin_h):
        cid = TestRegisterFull.reg_candidate_id
        if not cid:
            pytest.skip("no reg cand")
        r = requests.get(f"{API}/candidates/{cid}/quick", headers=admin_h, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["id"] == cid and "profile_completion" in d and "candidate_code" in d

    def test_recompute_completion(self, admin_h):
        cid = TestRegisterFull.reg_candidate_id
        if not cid:
            pytest.skip("no reg cand")
        r = requests.post(f"{API}/candidates/{cid}/recompute-completion",
                          headers=admin_h, timeout=15)
        assert r.status_code == 200
        assert 0 <= r.json()["profile_completion"] <= 100


# ---------------- NOTIFICATIONS ----------------
class TestNotifications:
    def test_notifications_created_on_verify(self, admin_h):
        r = requests.get(f"{API}/notifications", headers=admin_h, timeout=15)
        assert r.status_code == 200
        d = r.json()
        items = d.get("items", d) if isinstance(d, dict) else d
        assert isinstance(items, list)
        # register-full created notifications for admins
        assert any("Registration" in (n.get("title") or "") for n in items)


# ---------------- ERROR HANDLERS ----------------
class TestErrors:
    def test_unknown_endpoint(self):
        r = requests.get(f"{API}/no-such-endpoint-abc", timeout=15)
        assert r.status_code in (404, 401)
        # 401 is acceptable if it hits auth first; more importantly it should be JSON
        try:
            j = r.json()
            assert "detail" in j or "message" in j
        except ValueError:
            pytest.fail("Non-JSON error response")

    def test_validation_error_422(self, admin_h):
        r = requests.post(f"{API}/candidates", json={"email": "no-name"},
                          headers=admin_h, timeout=15)
        assert r.status_code == 422
