"""UGS HireFlow - Main FastAPI application."""
from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile, File, Query, Response, Header, Form
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
import os
import io
import csv
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from db import db, log_activity, create_notification
from auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_roles,
)
from storage import init_storage, put_object, get_object, APP_NAME
from models import (
    User, UserCreate, LoginRequest, TokenResponse, ChangePasswordRequest,
    Candidate, CandidateCreate, CandidateUpdate, InterviewEvent, InterviewEventCreate,
    PaymentRecord, PaymentCreate, PartnerInfo, NoteCreate,
    Employee, EmployeeCreate, Company, CompanyBase, Job, JobBase,
    Batch, BatchBase, FileRef, Notification, now_iso, new_id,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("ugs")

app = FastAPI(title="UGS HireFlow API", version="1.0.0")
api = APIRouter(prefix="/api")


# ---------- HELPERS ----------
def clean(doc):
    if not doc:
        return doc
    doc.pop("_id", None)
    return doc


async def next_code(collection: str, prefix: str) -> str:
    count = await db[collection].count_documents({})
    return f"{prefix}-{count + 1:04d}"


async def notify_admins_of_vendor_payment(candidate: dict, reason: str, remaining: int):
    async for admin in db.users.find({"role": "admin"}):
        await create_notification(
            user_id=admin["id"],
            title=f"Vendor Payment Due: {reason}",
            message=f"Vendor payment for candidate {candidate['full_name']} ({candidate.get('candidate_code', 'N/A')}) is due. Status: {candidate.get('vendor_payment_status')}. Days Remaining: {remaining}.",
            type_="warning",
            link=f"/app/candidates/{candidate['id']}"
        )


async def vendor_payment_scheduler_task():
    import asyncio
    from datetime import datetime, date
    import logging
    logger = logging.getLogger("ugs.vendor_payment_scheduler")
    
    while True:
        try:
            today = date.today()
            logger.info("Checking vendor payments for reminders...")
            async for c in db.candidates.find({"expected_vendor_payment_date": {"$ne": None}, "vendor_payment_status": {"$ne": "Received"}}):
                try:
                    exp_date = datetime.strptime(c["expected_vendor_payment_date"], "%Y-%m-%d").date()
                    rem = (exp_date - today).days
                    
                    last_notified = c.get("last_notified_days")
                    
                    # Notify Admin when: Vendor Payment Due: 7 Days Remaining, 3 Days Remaining, Today, Overdue
                    # If status becomes "Received", stop reminder notifications (covered by vendor_payment_status != Received in query)
                    if rem == 7 and last_notified != 7:
                        await notify_admins_of_vendor_payment(c, "7 Days Remaining", rem)
                        await db.candidates.update_one({"id": c["id"]}, {"$set": {"last_notified_days": 7}})
                    elif rem == 3 and last_notified != 3:
                        await notify_admins_of_vendor_payment(c, "3 Days Remaining", rem)
                        await db.candidates.update_one({"id": c["id"]}, {"$set": {"last_notified_days": 3}})
                    elif rem == 0 and last_notified != 0:
                        await notify_admins_of_vendor_payment(c, "Today", rem)
                        await db.candidates.update_one({"id": c["id"]}, {"$set": {"last_notified_days": 0}})
                    elif rem < 0 and (last_notified is None or last_notified >= 0):
                        await notify_admins_of_vendor_payment(c, "Overdue", rem)
                        await db.candidates.update_one({"id": c["id"]}, {"$set": {"last_notified_days": -1}})
                except Exception as ex:
                    logger.error(f"Error checking candidate {c.get('id')}: {ex}")
        except Exception as e:
            logger.error(f"Error in vendor payment scheduler task: {e}")
        # Sleep for 12 hours (runs twice a day)
        await asyncio.sleep(12 * 3600)


# ---------- STARTUP ----------
@app.on_event("startup")
async def startup():
    import asyncio
    asyncio.create_task(vendor_payment_scheduler_task())
    try:
        init_storage()
    except Exception as e:
        logger.warning(f"Object storage init failed (uploads will fail): {e}")

    # Validate Cloudinary Configuration on Startup
    cloudinary_cloud = os.environ.get("CLOUDINARY_CLOUD_NAME")
    cloudinary_key = os.environ.get("CLOUDINARY_API_KEY")
    cloudinary_secret = os.environ.get("CLOUDINARY_API_SECRET")
    cloudinary_url = os.environ.get("CLOUDINARY_URL")
    
    if cloudinary_url:
        logger.info("Cloudinary: CLOUDINARY_URL environment variable detected.")
        if not (cloudinary_cloud and cloudinary_key and cloudinary_secret):
            try:
                if cloudinary_url.startswith("cloudinary://"):
                    url_part = cloudinary_url.replace("cloudinary://", "")
                    credentials, cloud_name = url_part.split("@")
                    api_key, api_secret = credentials.split(":")
                    if "?" in api_secret:
                        api_secret = api_secret.split("?")[0]
                    cloudinary_cloud = cloud_name
                    cloudinary_key = api_key
                    cloudinary_secret = api_secret
                    logger.info("Cloudinary: Parsed credentials from CLOUDINARY_URL successfully.")
            except Exception as e:
                logger.error(f"Cloudinary: Error parsing CLOUDINARY_URL on startup: {e}")

    missing_keys = []
    if not cloudinary_cloud: missing_keys.append("CLOUDINARY_CLOUD_NAME")
    if not cloudinary_key: missing_keys.append("CLOUDINARY_API_KEY")
    if not cloudinary_secret: missing_keys.append("CLOUDINARY_API_SECRET")

    if not missing_keys:
        logger.info("Cloudinary configured successfully")
    else:
        logger.warning(f"Cloudinary configuration missing: {', '.join(missing_keys)}")
    # Ensure indexes
    await db.users.create_index("email", unique=True)
    await db.candidates.create_index("email")
    await db.candidates.create_index("phone")
    await db.candidates.create_index("candidate_code")
    await db.candidates.create_index("partner_id")
    await db.candidates.create_index("assigned_employee_id")
    await db.candidates.create_index("assigned_company_id")
    await db.candidates.create_index("status")
    await db.candidates.create_index("is_deleted")
    await db.notifications.create_index("user_id")
    await db.activity_logs.create_index("created_at")
    await db.activity_logs.create_index("entity_id")
    await db.activity_logs.create_index("actor_id")
    await db.partners.create_index("phone")
    await db.partners.create_index("partner_code")

    # Auto-seed if empty
    if await db.users.count_documents({}) == 0:
        from seed import seed_all
        await seed_all()
        logger.info("Seeded initial data")

    # Seed placements + indexes for new v3 collections
    try:
        await seed_placements_if_empty()
    except Exception as e:
        logger.warning(f"Placement seed skipped: {e}")
    await db.placements.create_index("display_order")
    await db.placements.create_index("is_published")
    await db.enquiries.create_index("status")
    await db.enquiries.create_index("created_at")


# ============ AUTH ROUTES ============
@api.post("/auth/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is inactive")
    token = create_access_token(user["id"], user["role"], user["email"])
    clean(user)
    user.pop("password_hash", None)
    # Activity log for login
    await log_activity({"id": user["id"], "full_name": user.get("full_name"),
                          "role": user["role"], "email": user["email"]},
                        "user.login",
                        f"{user.get('full_name') or user['email']} logged in")
    return {"access_token": token, "token_type": "bearer", "user": user}


@api.get("/auth/me")
async def me(current: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current["id"]})
    if not user:
        raise HTTPException(404, "User not found")
    clean(user)
    user.pop("password_hash", None)
    return user


@api.post("/auth/change-password")
async def change_password(body: ChangePasswordRequest, current: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current["id"]})
    if not verify_password(body.current_password, user["password_hash"]):
        raise HTTPException(400, "Current password incorrect")
    await db.users.update_one({"id": current["id"]}, {"$set": {"password_hash": hash_password(body.new_password)}})
    return {"success": True}


@api.post("/auth/forgot-password")
async def forgot_password(email: str = Form(...)):
    # Placeholder: log and return generic message (email delivery deferred).
    logger.info(f"Password reset requested for {email}")
    return {"message": "If the email exists, reset instructions have been sent."}


# ============ CANDIDATE REGISTRATION (PUBLIC) ============
@api.post("/public/register-candidate")
async def public_register(body: CandidateCreate):
    exists = await db.candidates.find_one({"email": body.email.lower()})
    if exists:
        raise HTTPException(400, "Email already registered")
    payload = body.model_dump()
    payload["email"] = payload["email"].lower()
    pwd = payload.pop("password", None)
    cand = Candidate(**payload)
    cand.candidate_code = await next_code("candidates", "UGS-C")
    doc = cand.model_dump()
    await db.candidates.insert_one(doc)

    # Create login user if password provided
    if pwd:
        user_doc = {
            "id": new_id(),
            "email": cand.email,
            "full_name": cand.full_name,
            "role": "candidate",
            "phone": cand.phone,
            "is_active": True,
            "candidate_id": cand.id,
            "password_hash": hash_password(pwd),
            "created_at": now_iso(),
        }
        await db.users.insert_one(user_doc)

    await log_activity(None, "candidate.registered", f"New candidate registered: {cand.full_name}",
                       "candidate", cand.id)

    # Notify all admins
    async for admin in db.users.find({"role": "admin"}):
        await create_notification(admin["id"], "New Candidate Registration",
                                   f"{cand.full_name} has registered and awaits verification.",
                                   "info", f"/admin/candidates/{cand.id}")
    clean(doc)
    return doc


def compute_vendor_remaining_days(c: dict) -> dict:
    if not c:
        return c
    exp_date_str = c.get("expected_vendor_payment_date")
    if exp_date_str:
        try:
            from datetime import datetime, date
            exp_date = datetime.strptime(exp_date_str, "%Y-%m-%d").date()
            if c.get("vendor_payment_status") == "Received":
                if c.get("vendor_payment_received_date"):
                    recv_date = datetime.strptime(c["vendor_payment_received_date"], "%Y-%m-%d").date()
                    c["vendor_remaining_days"] = (exp_date - recv_date).days
                else:
                    c["vendor_remaining_days"] = 0
            else:
                c["vendor_remaining_days"] = (exp_date - date.today()).days
        except Exception:
            c["vendor_remaining_days"] = None
    else:
        c["vendor_remaining_days"] = None
    return c


def parse_ctc(ctc_str: str) -> float:
    if not ctc_str:
        return 0.0
    try:
        import re
        match = re.search(r"([0-9.]+)", ctc_str)
        if match:
            return float(match.group(1))
    except Exception:
        pass
    return 0.0


# ============ CANDIDATES ============
@api.get("/candidates")
async def list_candidates(
    q: str = "", status: str = "", employee_id: str = "", company_id: str = "",
    batch_id: str = "", payment_status: str = "", partner_id: str = "",
    vendor_type: str = "", vendor_payment_status: str = "",
    experience: Optional[float] = None, remaining_days: Optional[int] = None,
    # Experience filters
    experience_type: str = "", previous_company: str = "",
    notice_period: str = "", ctc_range: str = "",
    include_archived: bool = False,
    skip: int = 0, limit: int = 100,
    current: dict = Depends(get_current_user),
):
    filt = {"is_deleted": {"$ne": True}}
    if not include_archived:
        filt["is_archived"] = {"$ne": True}
    if current["role"] == "employee":
        filt["assigned_employee_id"] = current["id"]
    if q:
        filt["$or"] = [
            {"full_name": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
            {"phone": {"$regex": q, "$options": "i"}},
            {"candidate_code": {"$regex": q, "$options": "i"}},
            {"skills": {"$regex": q, "$options": "i"}},
            {"reference_name": {"$regex": q, "$options": "i"}},
            {"previous_company": {"$regex": q, "$options": "i"}},
            {"designation": {"$regex": q, "$options": "i"}},
            {"total_experience": {"$regex": q, "$options": "i"}},
            {"notice_period": {"$regex": q, "$options": "i"}},
            {"current_ctc": {"$regex": q, "$options": "i"}},
        ]
    if status: filt["status"] = status
    if employee_id: filt["assigned_employee_id"] = employee_id
    if company_id: filt["assigned_company_id"] = company_id
    if batch_id: filt["batch_id"] = batch_id
    if payment_status: filt["payment_status"] = payment_status
    if partner_id: filt["partner_id"] = partner_id
    if vendor_type: filt["vendor_type"] = vendor_type
    if vendor_payment_status: filt["vendor_payment_status"] = vendor_payment_status
    if experience is not None: filt["total_experience_years"] = {"$gte": experience}
    if remaining_days is not None:
        from datetime import date, timedelta
        max_date = (date.today() + timedelta(days=remaining_days)).strftime("%Y-%m-%d")
        filt["expected_vendor_payment_date"] = {"$lte": max_date, "$ne": None}
        
    # Apply experience filters
    if experience_type:
        filt["experience_type"] = experience_type
    if previous_company:
        filt["previous_company"] = {"$regex": previous_company, "$options": "i"}
    if notice_period:
        filt["notice_period"] = notice_period

    if ctc_range:
        cursor = db.candidates.find(filt, {"_id": 0}).sort("created_at", -1)
        all_items = await cursor.to_list(1000)
        
        filtered_items = []
        try:
            min_val, max_val = 0.0, 999.0
            if ctc_range == "0-3": min_val, max_val = 0.0, 3.0
            elif ctc_range == "3-6": min_val, max_val = 3.0, 6.0
            elif ctc_range == "6-10": min_val, max_val = 6.0, 10.0
            elif ctc_range == "10+": min_val, max_val = 10.0, 999.0
            
            for item in all_items:
                ctc_val = parse_ctc(item.get("current_ctc", ""))
                if min_val <= ctc_val <= max_val:
                    filtered_items.append(item)
        except Exception:
            filtered_items = all_items
            
        total = len(filtered_items)
        items = filtered_items[skip:skip+limit]
    else:
        cursor = db.candidates.find(filt, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
        items = await cursor.to_list(limit)
        total = await db.candidates.count_documents(filt)

    for item in items:
        compute_vendor_remaining_days(item)
    return {"items": items, "total": total}


@api.get("/candidates/{cid}")
async def get_candidate(cid: str, current: dict = Depends(get_current_user)):
    c = await db.candidates.find_one({"id": cid}, {"_id": 0})
    if not c: raise HTTPException(404, "Not found")
    if current["role"] == "candidate":
        u = await db.users.find_one({"id": current["id"]})
        if u.get("candidate_id") != cid:
            raise HTTPException(403, "Forbidden")
    if current["role"] == "employee" and c.get("assigned_employee_id") != current["id"]:
        raise HTTPException(403, "Forbidden")
    return compute_vendor_remaining_days(c)


@api.post("/candidates")
async def create_candidate(body: CandidateCreate, current: dict = Depends(require_roles(["admin", "employee"]))):
    body_dict = body.model_dump()
    body_dict["email"] = body_dict["email"].lower()
    body_dict.pop("password", None)
    if await db.candidates.find_one({"email": body_dict["email"]}):
        raise HTTPException(400, "Email already exists")
    c = Candidate(**body_dict)
    c.candidate_code = await next_code("candidates", "UGS-C")
    if current["role"] == "employee":
        c.assigned_employee_id = current["id"]
        c.status = "assigned"
    await db.candidates.insert_one(c.model_dump())
    await log_activity(current, "candidate.created", f"Created candidate {c.full_name}", "candidate", c.id)
    return c.model_dump()


@api.patch("/candidates/{cid}")
async def update_candidate(cid: str, body: CandidateUpdate, current: dict = Depends(require_roles(["admin", "employee"]))):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(400, "No fields to update")
        
    # Calculate vendor expected date if period is set/updated
    if "vendor_payment_period" in updates and updates["vendor_payment_period"]:
        try:
            from datetime import date, timedelta
            days = int(updates["vendor_payment_period"].split()[0])
            updates["expected_vendor_payment_date"] = (date.today() + timedelta(days=days)).strftime("%Y-%m-%d")
        except Exception as e:
            logger.error(f"Error parsing vendor payment period: {e}")
            
    # Calculate vendor payment received date if status changes
    if "vendor_payment_status" in updates:
        if updates["vendor_payment_status"] == "Received":
            from datetime import date
            updates["vendor_payment_received_date"] = date.today().strftime("%Y-%m-%d")
        else:
            updates["vendor_payment_received_date"] = None

    updates["updated_at"] = now_iso()
    result = await db.candidates.update_one({"id": cid}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(404, "Not found")
    await log_activity(current, "candidate.updated", f"Updated candidate {cid}", "candidate", cid, updates)
    c = await db.candidates.find_one({"id": cid}, {"_id": 0})
    return compute_vendor_remaining_days(c)


@api.post("/candidates/{cid}/verify")
async def verify_candidate(cid: str, current: dict = Depends(require_roles(["admin"]))):
    c = await db.candidates.find_one({"id": cid})
    if not c: raise HTTPException(404, "Not found")
    await db.candidates.update_one({"id": cid}, {"$set": {
        "status": "verified", "verified_at": now_iso(), "updated_at": now_iso()
    }})
    await log_activity(current, "candidate.verified", f"Verified candidate {c['full_name']}", "candidate", cid)
    # Notify candidate if has user
    cu = await db.users.find_one({"candidate_id": cid})
    if cu:
        await create_notification(cu["id"], "Profile Verified",
                                   "Your profile has been verified. You'll be assigned to a recruiter soon.",
                                   "success")
    return {"success": True}


@api.post("/candidates/{cid}/assign")
async def assign_candidate(cid: str, employee_id: str = Form(...), current: dict = Depends(require_roles(["admin"]))):
    emp = await db.users.find_one({"id": employee_id, "role": "employee"})
    if not emp: raise HTTPException(404, "Employee not found")
    c = await db.candidates.find_one({"id": cid})
    if not c: raise HTTPException(404, "Candidate not found")
    await db.candidates.update_one({"id": cid}, {"$set": {
        "assigned_employee_id": employee_id, "status": "assigned", "updated_at": now_iso()
    }})
    await log_activity(current, "candidate.assigned",
                       f"Assigned {c['full_name']} to {emp['full_name']}",
                       "candidate", cid, {"employee_id": employee_id})
    await create_notification(employee_id, "New Candidate Assigned",
                               f"{c['full_name']} has been assigned to you.", "info",
                               f"/employee/candidates/{cid}")
    return {"success": True}


@api.post("/candidates/{cid}/interview-events")
async def add_interview_event(cid: str, body: InterviewEventCreate,
                                current: dict = Depends(require_roles(["admin", "employee"]))):
    c = await db.candidates.find_one({"id": cid})
    if not c: raise HTTPException(404, "Not found")
    user = await db.users.find_one({"id": current["id"]})
    evt = InterviewEvent(**body.model_dump(), updated_by=current["id"],
                          updated_by_name=user["full_name"] if user else current["email"])
    await db.candidates.update_one({"id": cid}, {
        "$push": {"interview_timeline": evt.model_dump()},
        "$set": {"status": body.stage, "updated_at": now_iso(),
                  **({"placed_at": now_iso()} if body.stage == "placed" else {})}
    })
    await log_activity(current, "interview.updated",
                       f"Stage set to {body.stage} for {c['full_name']}", "candidate", cid,
                       {"stage": body.stage, "remarks": body.remarks})

    # Notify candidate + admins
    cu = await db.users.find_one({"candidate_id": cid})
    stage_titles = {
        "interview_scheduled": ("Interview Scheduled", "Your interview has been scheduled."),
        "selected": ("Selected!", "Congratulations — you've been selected."),
        "placed": ("Placed", "You have been successfully placed."),
        "rejected": ("Update on your application", "Please check with your recruiter."),
        "offer_released": ("Offer Released", "An offer has been released for you."),
    }
    if body.stage in stage_titles and cu:
        title, msg = stage_titles[body.stage]
        await create_notification(cu["id"], title, msg,
            "success" if body.stage in ["selected", "placed", "offer_released"] else "info",
            "/me")
    if body.stage in ("selected", "placed", "offer_released"):
        async for admin in db.users.find({"role": "admin"}):
            await create_notification(admin["id"], f"Candidate {body.stage}",
                f"{c['full_name']} → {body.stage}", "success",
                f"/app/candidates/{cid}")
    if c.get("assigned_employee_id"):
        await create_notification(c["assigned_employee_id"],
            f"Interview {body.stage}", f"{c['full_name']} → {body.stage}",
            "info", f"/app/candidates/{cid}")
    return evt.model_dump()


@api.post("/candidates/{cid}/payments")
async def add_payment(cid: str, body: PaymentCreate, current: dict = Depends(require_roles(["admin", "employee"]))):
    c = await db.candidates.find_one({"id": cid})
    if not c: raise HTTPException(404, "Not found")
    pay = PaymentRecord(**body.model_dump())
    pay.receipt_number = pay.receipt_number or f"RCPT-{int(datetime.now(timezone.utc).timestamp())}"
    new_paid = float(c.get("amount_paid", 0)) + float(body.amount)
    fee = float(c.get("registration_fee", 0))
    if fee <= 0:
        p_status = "completed" if new_paid > 0 else "pending"
    elif new_paid >= fee:
        p_status = "completed"
    elif new_paid > 0:
        p_status = "partial"
    else:
        p_status = "pending"
    await db.candidates.update_one({"id": cid}, {
        "$push": {"payments": pay.model_dump()},
        "$set": {"amount_paid": new_paid, "payment_status": p_status, "updated_at": now_iso()}
    })
    await log_activity(current, "payment.added", f"Payment of ₹{body.amount} for {c['full_name']}",
                       "candidate", cid, {"amount": body.amount})
    # Notify candidate + admins
    cu = await db.users.find_one({"candidate_id": cid})
    if cu:
        await create_notification(cu["id"], "Payment Recorded",
            f"₹{body.amount} recorded. Status: {p_status}", "success", "/me")
    async for admin in db.users.find({"role": "admin"}):
        await create_notification(admin["id"], "Payment Updated",
            f"₹{body.amount} for {c['full_name']} ({p_status})", "info",
            f"/app/candidates/{cid}")
    return pay.model_dump()


@api.patch("/candidates/{cid}/partner")
async def update_partner(cid: str, body: PartnerInfo, current: dict = Depends(require_roles(["admin", "employee"]))):
    await db.candidates.update_one({"id": cid}, {"$set": {"partner": body.model_dump(), "updated_at": now_iso()}})
    await log_activity(current, "partner.updated", f"Partner info updated for candidate {cid}", "candidate", cid)
    return body.model_dump()


@api.post("/candidates/{cid}/notes")
async def add_note(cid: str, body: NoteCreate, current: dict = Depends(require_roles(["admin", "employee"]))):
    user = await db.users.find_one({"id": current["id"]})
    note = {"id": new_id(), "text": body.text,
             "author": user["full_name"] if user else current["email"],
             "author_id": current["id"], "created_at": now_iso()}
    await db.candidates.update_one({"id": cid}, {"$push": {"notes": note}})
    await log_activity(current, "note.added", f"Note added to candidate {cid}", "candidate", cid)
    return note


@api.get("/candidates/export/csv")
async def export_candidates_csv(current: dict = Depends(require_roles(["admin"]))):
    rows = await db.candidates.find({}, {"_id": 0}).to_list(10000)
    output = io.StringIO()
    fields = ["candidate_code", "full_name", "email", "phone", "status", "payment_status",
              "amount_paid", "registration_fee", "assigned_employee_id",
              "assigned_company_id", "city", "total_experience_years",
              "expected_salary", "created_at"]
    w = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
    w.writeheader()
    for r in rows:
        w.writerow(r)
    return StreamingResponse(io.BytesIO(output.getvalue().encode()),
                              media_type="text/csv",
                              headers={"Content-Disposition": "attachment; filename=candidates.csv"})


@api.post("/candidates/import/csv")
async def import_candidates_csv(file: UploadFile = File(...),
                                  current: dict = Depends(require_roles(["admin"]))):
    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode()))
    imported, skipped = 0, 0
    for row in reader:
        email = (row.get("email") or "").strip().lower()
        name = (row.get("full_name") or row.get("name") or "").strip()
        phone = (row.get("phone") or "").strip()
        if not email or not name or not phone:
            skipped += 1; continue
        if await db.candidates.find_one({"email": email}):
            skipped += 1; continue
        skills = [s.strip() for s in (row.get("skills") or "").split(",") if s.strip()]
        try:
            c = Candidate(full_name=name, email=email, phone=phone,
                          city=row.get("city"), state=row.get("state"),
                          skills=skills,
                          total_experience_years=float(row.get("experience") or 0),
                          expected_salary=float(row.get("expected_salary") or 0) or None,
                          status="pending_verification")
            c.candidate_code = await next_code("candidates", "UGS-C")
            await db.candidates.insert_one(c.model_dump())
            imported += 1
        except Exception as e:
            logger.warning(f"Import row failed: {e}")
            skipped += 1
    await log_activity(current, "candidates.imported",
                       f"Imported {imported} candidates ({skipped} skipped)")
    return {"imported": imported, "skipped": skipped}


# ============ EMPLOYEES ============
@api.get("/employees")
async def list_employees(current: dict = Depends(require_roles(["admin", "employee"]))):
    users = await db.users.find({"role": "employee"}, {"_id": 0, "password_hash": 0}).to_list(500)
    for u in users:
        u["assigned_count"] = await db.candidates.count_documents({"assigned_employee_id": u["id"]})
    return users


@api.post("/employees")
async def create_employee(body: EmployeeCreate, current: dict = Depends(require_roles(["admin"]))):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email already exists")
    uid = new_id()
    user_doc = {"id": uid, "email": email, "full_name": body.full_name, "role": "employee",
                 "phone": body.phone, "is_active": body.is_active,
                 "designation": body.designation, "department": body.department,
                 "password_hash": hash_password(body.password), "created_at": now_iso()}
    await db.users.insert_one(user_doc)
    await log_activity(current, "employee.created", f"Created employee {body.full_name}", "employee", uid)
    user_doc.pop("password_hash", None)
    user_doc.pop("_id", None)
    return user_doc


@api.patch("/employees/{uid}")
async def update_employee(uid: str, body: dict, current: dict = Depends(require_roles(["admin"]))):
    body.pop("password", None); body.pop("password_hash", None); body.pop("id", None); body.pop("role", None)
    if "email" in body: body["email"] = body["email"].lower()
    await db.users.update_one({"id": uid, "role": "employee"}, {"$set": body})
    await log_activity(current, "employee.updated", f"Updated employee {uid}", "employee", uid)
    u = await db.users.find_one({"id": uid}, {"_id": 0, "password_hash": 0})
    return u


@api.delete("/employees/{uid}")
async def deactivate_employee(uid: str, current: dict = Depends(require_roles(["admin"]))):
    await db.users.update_one({"id": uid}, {"$set": {"is_active": False}})
    await log_activity(current, "employee.deactivated", f"Deactivated employee {uid}", "employee", uid)
    return {"success": True}


# ============ COMPANIES ============
@api.get("/companies")
async def list_companies(q: str = "", current: dict = Depends(get_current_user)):
    filt = {}
    if q:
        filt = {"$or": [{"name": {"$regex": q, "$options": "i"}},
                         {"industry": {"$regex": q, "$options": "i"}},
                         {"location": {"$regex": q, "$options": "i"}}]}
    items = await db.companies.find(filt, {"_id": 0}).sort("created_at", -1).to_list(500)
    for c in items:
        c["open_jobs"] = await db.jobs.count_documents({"company_id": c["id"], "status": "open"})
        c["assigned_candidates"] = await db.candidates.count_documents({"assigned_company_id": c["id"]})
    return items


@api.get("/companies/{cid}")
async def get_company(cid: str, current: dict = Depends(get_current_user)):
    c = await db.companies.find_one({"id": cid}, {"_id": 0})
    if not c: raise HTTPException(404)
    c["jobs"] = await db.jobs.find({"company_id": cid}, {"_id": 0}).to_list(200)
    c["candidates"] = await db.candidates.find({"assigned_company_id": cid}, {"_id": 0}).to_list(200)
    return c


@api.post("/companies")
async def create_company(body: CompanyBase, current: dict = Depends(require_roles(["admin"]))):
    co = Company(**body.model_dump())
    await db.companies.insert_one(co.model_dump())
    await log_activity(current, "company.created", f"Created company {co.name}", "company", co.id)
    async for admin in db.users.find({"role": "admin"}):
        if admin["id"] != current["id"]:
            await create_notification(admin["id"], "Company Added",
                f"{co.name} was added", "info", "/app/companies")
    return co.model_dump()


@api.patch("/companies/{cid}")
async def update_company(cid: str, body: dict, current: dict = Depends(require_roles(["admin"]))):
    body.pop("id", None)
    await db.companies.update_one({"id": cid}, {"$set": body})
    await log_activity(current, "company.updated", f"Updated company {cid}", "company", cid)
    return await db.companies.find_one({"id": cid}, {"_id": 0})


@api.delete("/companies/{cid}")
async def delete_company(cid: str, current: dict = Depends(require_roles(["admin"]))):
    await db.companies.delete_one({"id": cid})
    await log_activity(current, "company.deleted", f"Deleted company {cid}", "company", cid)
    return {"success": True}


# ============ JOBS ============
@api.get("/jobs")
async def list_jobs(q: str = "", company_id: str = "", status: str = "",
                    current: dict = Depends(get_current_user)):
    filt = {}
    if q: filt["$or"] = [{"title": {"$regex": q, "$options": "i"}},
                          {"skills": {"$regex": q, "$options": "i"}}]
    if company_id: filt["company_id"] = company_id
    if status: filt["status"] = status
    items = await db.jobs.find(filt, {"_id": 0}).sort("created_at", -1).to_list(500)
    # attach company name
    company_ids = list({j["company_id"] for j in items if j.get("company_id")})
    if company_ids:
        cos = await db.companies.find({"id": {"$in": company_ids}}, {"_id": 0}).to_list(500)
        co_map = {c["id"]: c["name"] for c in cos}
        for j in items:
            j["company_name"] = co_map.get(j.get("company_id"), "")
    return items


@api.get("/jobs/{jid}")
async def get_job(jid: str, current: dict = Depends(get_current_user)):
    j = await db.jobs.find_one({"id": jid}, {"_id": 0})
    if not j: raise HTTPException(404)
    co = await db.companies.find_one({"id": j["company_id"]}, {"_id": 0})
    j["company"] = co
    if j.get("assigned_candidate_ids"):
        j["candidates"] = await db.candidates.find(
            {"id": {"$in": j["assigned_candidate_ids"]}}, {"_id": 0}).to_list(500)
    else:
        j["candidates"] = []
    return j


@api.post("/jobs")
async def create_job(body: JobBase, current: dict = Depends(require_roles(["admin", "employee"]))):
    if not await db.companies.find_one({"id": body.company_id}):
        raise HTTPException(400, "Company not found")
    j = Job(**body.model_dump())
    await db.jobs.insert_one(j.model_dump())
    await log_activity(current, "job.created", f"Created job {j.title}", "job", j.id)
    # Notify all recruiters + admins
    async for u in db.users.find({"role": {"$in": ["admin", "employee"]}}):
        if u["id"] != current["id"]:
            await create_notification(u["id"], "New Job Opening",
                f"{j.title} added", "info", "/app/jobs")
    return j.model_dump()


@api.patch("/jobs/{jid}")
async def update_job(jid: str, body: dict, current: dict = Depends(require_roles(["admin", "employee"]))):
    body.pop("id", None)
    await db.jobs.update_one({"id": jid}, {"$set": body})
    await log_activity(current, "job.updated", f"Updated job {jid}", "job", jid)
    return await db.jobs.find_one({"id": jid}, {"_id": 0})


@api.delete("/jobs/{jid}")
async def delete_job(jid: str, current: dict = Depends(require_roles(["admin"]))):
    await db.jobs.delete_one({"id": jid})
    return {"success": True}


@api.post("/jobs/{jid}/assign-candidates")
async def assign_job_candidates(jid: str, candidate_ids: list[str],
                                 current: dict = Depends(require_roles(["admin", "employee"]))):
    j = await db.jobs.find_one({"id": jid})
    if not j: raise HTTPException(404)
    await db.jobs.update_one({"id": jid}, {"$addToSet": {"assigned_candidate_ids": {"$each": candidate_ids}}})
    for cid in candidate_ids:
        await db.candidates.update_one({"id": cid}, {"$set": {
            "assigned_company_id": j["company_id"], "assigned_job_id": jid,
            "status": "company_assigned", "updated_at": now_iso()
        }})
        await log_activity(current, "job.candidate_assigned",
                            f"Candidate {cid} allocated to job {j['title']}", "job", jid)
    return {"success": True, "assigned": len(candidate_ids)}


# ============ BATCHES ============
@api.get("/batches")
async def list_batches(current: dict = Depends(get_current_user)):
    items = await db.batches.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items


@api.get("/batches/{bid}")
async def get_batch(bid: str, current: dict = Depends(get_current_user)):
    b = await db.batches.find_one({"id": bid}, {"_id": 0})
    if not b: raise HTTPException(404)
    if b.get("candidate_ids"):
        b["candidates"] = await db.candidates.find({"id": {"$in": b["candidate_ids"]}}, {"_id": 0}).to_list(500)
    else:
        b["candidates"] = []
    return b


@api.post("/batches")
async def create_batch(body: BatchBase, current: dict = Depends(require_roles(["admin"]))):
    b = Batch(**body.model_dump())
    await db.batches.insert_one(b.model_dump())
    await log_activity(current, "batch.created", f"Created batch {b.name}", "batch", b.id)
    async for u in db.users.find({"role": {"$in": ["admin", "employee"]}}):
        if u["id"] != current["id"]:
            await create_notification(u["id"], "New Batch",
                f"{b.name} started", "info", "/app/batches")
    return b.model_dump()


@api.patch("/batches/{bid}")
async def update_batch(bid: str, body: dict, current: dict = Depends(require_roles(["admin"]))):
    body.pop("id", None)
    await db.batches.update_one({"id": bid}, {"$set": body})
    return await db.batches.find_one({"id": bid}, {"_id": 0})


@api.delete("/batches/{bid}")
async def delete_batch(bid: str, current: dict = Depends(require_roles(["admin"]))):
    await db.batches.delete_one({"id": bid})
    return {"success": True}


@api.post("/batches/{bid}/assign-candidates")
async def assign_batch_candidates(bid: str, candidate_ids: list[str],
                                    current: dict = Depends(require_roles(["admin"]))):
    await db.batches.update_one({"id": bid}, {"$addToSet": {"candidate_ids": {"$each": candidate_ids}}})
    for cid in candidate_ids:
        await db.candidates.update_one({"id": cid}, {"$set": {"batch_id": bid, "updated_at": now_iso()}})
    return {"success": True}


# ============ FILES ============
@api.post("/files/upload")
async def upload_file(label: str = Form("document"), file: UploadFile = File(...),
                       candidate_id: str = Form(None),
                       current: dict = Depends(get_current_user)):
    from upload_service import process_and_save_upload, UploadValidationError
    from fastapi.responses import JSONResponse
    try:
        file_ref_dict = await process_and_save_upload(
            file=file,
            owner_id=current["id"],
            candidate_id=candidate_id,
            label=label
        )
        return file_ref_dict
    except UploadValidationError as ve:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error_code": ve.error_code,
                "message": ve.message,
                "details": ve.details
            }
        )
    except Exception as e:
        logger.exception(f"Unhandled file upload error: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error_code": "UPLOAD_FAILED",
                "message": "Unable to upload file.",
                "details": str(e)
            }
        )


@api.get("/files/{fid}/download")
async def download_file(fid: str, auth: str = Query(None),
                          authorization: str = Header(None)):
    # Support token via query or header (needed for <img src>)
    from auth import decode_token
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1]
    elif auth:
        token = auth
    if not token: raise HTTPException(401, "Not authenticated")
    decode_token(token)
    rec = await db.files.find_one({"id": fid, "is_deleted": False})
    if not rec: raise HTTPException(404, "File not found")
    
    # Logging before serving
    p_id = rec.get("public_id")
    s_url = rec.get("storage_path")
    r_type = rec.get("resource_type")
    logger.info(f"Serving file - public_id: {p_id}, secure_url: {s_url}, resource_type: {r_type}")

    if rec.get("storage_path", "").startswith("http://") or rec.get("storage_path", "").startswith("https://"):
        from fastapi.responses import RedirectResponse
        logger.info(f"Redirecting directly to Cloudinary storage: {s_url}")
        return RedirectResponse(url=s_url)

    if rec.get("storage_path", "").startswith("local://"):
        relative_path = rec["storage_path"].replace("local://", "")
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        full_path = os.path.join(backend_dir, relative_path)
        if not os.path.exists(full_path):
            raise HTTPException(status_code=404, detail="File not found on local storage")
        with open(full_path, "rb") as f:
            data = f.read()
        ct = rec.get("content_type") or "application/octet-stream"
    else:
        data, ct = get_object(rec["storage_path"])
        
    return Response(content=data, media_type=rec.get("content_type", ct))


# ============ NOTIFICATIONS ============
@api.get("/notifications")
async def list_notifications(current: dict = Depends(get_current_user)):
    items = await db.notifications.find({"user_id": current["id"]}, {"_id": 0}) \
        .sort("created_at", -1).limit(50).to_list(50)
    unread = await db.notifications.count_documents({"user_id": current["id"], "is_read": False})
    return {"items": items, "unread": unread}


@api.post("/notifications/{nid}/read")
async def mark_notification(nid: str, current: dict = Depends(get_current_user)):
    await db.notifications.update_one({"id": nid, "user_id": current["id"]}, {"$set": {"is_read": True}})
    return {"success": True}


@api.post("/notifications/mark-all-read")
async def mark_all(current: dict = Depends(get_current_user)):
    await db.notifications.update_many({"user_id": current["id"]}, {"$set": {"is_read": True}})
    return {"success": True}


# ============ ACTIVITY LOGS ============
@api.get("/activity-logs")
async def get_logs(entity_id: str = "", limit: int = 100,
                     current: dict = Depends(require_roles(["admin", "employee"]))):
    filt = {}
    if entity_id: filt["entity_id"] = entity_id
    logs = await db.activity_logs.find(filt, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return logs


# ============ DASHBOARD ============
@api.get("/dashboard/admin")
async def admin_dashboard(current: dict = Depends(require_roles(["admin"]))):
    total_cand = await db.candidates.count_documents({})
    pending = await db.candidates.count_documents({"status": "pending_verification"})
    placed = await db.candidates.count_documents({"status": "placed"})
    in_pipeline = await db.candidates.count_documents({
        "status": {"$in": ["assigned", "profile_reviewed", "company_assigned",
                            "interview_scheduled", "round_1", "round_2", "technical", "hr",
                            "selected", "offer_released", "joined"]}})
    total_emp = await db.users.count_documents({"role": "employee", "is_active": True})
    total_co = await db.companies.count_documents({})
    open_jobs = await db.jobs.count_documents({"status": "open"})
    active_batches = await db.batches.count_documents({"status": "running"})
    # revenue
    pipeline = [{"$group": {"_id": None, "total_paid": {"$sum": "$amount_paid"},
                              "total_due": {"$sum": {"$subtract": ["$registration_fee", "$amount_paid"]}}}}]
    agg = await db.candidates.aggregate(pipeline).to_list(1)
    revenue = agg[0] if agg else {"total_paid": 0, "total_due": 0}
    revenue.pop("_id", None)

    # status distribution
    dist_agg = await db.candidates.aggregate([{"$group": {"_id": "$status", "count": {"$sum": 1}}}]).to_list(50)
    status_dist = [{"status": d["_id"], "count": d["count"]} for d in dist_agg]

    recent = await db.candidates.find({}, {"_id": 0}).sort("created_at", -1).limit(6).to_list(6)
    activities = await db.activity_logs.find({}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
    
    # Calculate Vendor Payment Reminders and summary stats dynamically
    from datetime import date
    today_str = date.today().strftime("%Y-%m-%d")
    month_prefix = date.today().strftime("%Y-%m")
    
    rem_cursor = db.candidates.find(
        {"expected_vendor_payment_date": {"$ne": None}, "vendor_payment_status": {"$ne": "Received"}},
        {"_id": 0}
    )
    rem_items = await rem_cursor.to_list(100)
    for item in rem_items:
        compute_vendor_remaining_days(item)
    # Sort reminders by remaining days ascending (nearest due date first)
    rem_items.sort(key=lambda x: x.get("vendor_remaining_days") if x.get("vendor_remaining_days") is not None else 99999)
    
    total_pending = await db.candidates.count_documents({
        "expected_vendor_payment_date": {"$ne": None},
        "vendor_payment_status": {"$in": ["Pending", "Hold"]}
    })
    due_today = await db.candidates.count_documents({
        "expected_vendor_payment_date": today_str,
        "vendor_payment_status": {"$ne": "Received"}
    })
    overdue = await db.candidates.count_documents({
        "expected_vendor_payment_date": {"$lt": today_str},
        "vendor_payment_status": {"$ne": "Received"}
    })
    received_this_month = await db.candidates.count_documents({
        "vendor_payment_status": "Received",
        "vendor_payment_received_date": {"$regex": f"^{month_prefix}"}
    })

    return {
        "kpis": {"total_candidates": total_cand, "pending_verification": pending,
                 "placed": placed, "in_pipeline": in_pipeline,
                 "employees": total_emp, "companies": total_co,
                 "open_jobs": open_jobs, "active_batches": active_batches},
        "revenue": revenue,
        "status_distribution": status_dist,
        "recent_candidates": recent,
        "recent_activities": activities,
        "vendor_payment_reminders": rem_items,
        "vendor_stats": {
            "total_pending": total_pending,
            "due_today": due_today,
            "overdue": overdue,
            "received_this_month": received_this_month
        }
    }


@api.get("/dashboard/employee")
async def employee_dashboard(current: dict = Depends(require_roles(["employee"]))):
    filt = {"assigned_employee_id": current["id"]}
    total = await db.candidates.count_documents(filt)
    placed = await db.candidates.count_documents({**filt, "status": "placed"})
    interviews = await db.candidates.count_documents({**filt, "status": {"$in":
        ["interview_scheduled", "round_1", "round_2", "technical", "hr"]}})
    pending = await db.candidates.count_documents({**filt, "status": "pending_verification"})
    recent = await db.candidates.find(filt, {"_id": 0}).sort("created_at", -1).limit(6).to_list(6)
    return {"kpis": {"assigned": total, "placed": placed, "interviews": interviews,
                       "pending": pending},
             "recent_candidates": recent}


@api.get("/dashboard/candidate")
async def candidate_dashboard(current: dict = Depends(require_roles(["candidate"]))):
    u = await db.users.find_one({"id": current["id"]})
    cid = u.get("candidate_id")
    if not cid: return {"candidate": None}
    c = await db.candidates.find_one({"id": cid}, {"_id": 0})
    if not c: return {"candidate": None}
    if c.get("assigned_employee_id"):
        emp = await db.users.find_one({"id": c["assigned_employee_id"]},
                                        {"_id": 0, "password_hash": 0})
        c["assigned_employee"] = emp
    if c.get("assigned_company_id"):
        c["assigned_company"] = await db.companies.find_one({"id": c["assigned_company_id"]}, {"_id": 0})
    if c.get("assigned_job_id"):
        c["assigned_job"] = await db.jobs.find_one({"id": c["assigned_job_id"]}, {"_id": 0})
    return {"candidate": c}


# ============ SEARCH ============
@api.get("/search")
async def global_search(q: str, current: dict = Depends(get_current_user)):
    if not q or len(q) < 2:
        return {"candidates": [], "companies": [], "jobs": []}
    r = {"$regex": q, "$options": "i"}
    cand = await db.candidates.find({"$or": [{"full_name": r}, {"email": r}, {"phone": r},
                                                {"candidate_code": r}]},
                                       {"_id": 0, "id": 1, "full_name": 1, "email": 1,
                                        "candidate_code": 1, "status": 1}).limit(10).to_list(10)
    cos = await db.companies.find({"name": r}, {"_id": 0, "id": 1, "name": 1,
                                                    "industry": 1}).limit(10).to_list(10)
    jobs = await db.jobs.find({"title": r}, {"_id": 0, "id": 1, "title": 1,
                                                "company_id": 1, "status": 1}).limit(10).to_list(10)
    return {"candidates": cand, "companies": cos, "jobs": jobs}


# ============ REPORTS ============
@api.get("/reports/summary")
async def reports_summary(current: dict = Depends(require_roles(["admin"]))):
    return await admin_dashboard(current)


@api.get("/reports/placements")
async def placement_report(current: dict = Depends(require_roles(["admin"]))):
    placed = await db.candidates.find({"status": "placed"}, {"_id": 0}).to_list(1000)
    return placed


@api.get("/health")
async def health():
    return {"status": "ok"}


@api.get("/")
async def root():
    return {"app": "UGS HireFlow", "version": "1.0.0"}


app.include_router(api)

from routes_v2 import router as v2_router
app.include_router(v2_router)

from routes_v3 import router as v3_router, seed_placements_if_empty
app.include_router(v3_router)

import re

class DynamicCORSMiddleware(CORSMiddleware):
    def is_allowed_origin(self, origin: str) -> bool:
        cors_origins = os.environ.get("CORS_ORIGINS", "*")
        if cors_origins == "*":
            return True
            
        allowed_list = [o.strip() for o in cors_origins.split(",") if o.strip()]
        if origin in allowed_list:
            return True
            
        # Allow localhost / 127.0.0.1 for local development
        if origin.startswith("http://localhost") or origin.startswith("http://127.0.0.1"):
            return True
            
        # Allow Vercel preview/production branch deployments (*.vercel.app)
        if re.match(r"^https://.*\.vercel\.app$", origin):
            return True
            
        return False

app.add_middleware(
    DynamicCORSMiddleware,
    allow_credentials=True,
    allow_origins=[],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- ERROR HANDLERS ----------
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError


@app.exception_handler(HTTPException)
async def http_exc_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code,
                          content={"detail": exc.detail, "status": exc.status_code})


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        errors.append({"field": ".".join(str(x) for x in err.get("loc", [])),
                        "message": err.get("msg", "Invalid")})
    return JSONResponse(status_code=422,
                          content={"detail": "Validation failed", "errors": errors})


@app.exception_handler(Exception)
async def unhandled_exc_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error on {request.method} {request.url.path}")
    return JSONResponse(status_code=500,
                          content={"detail": "Internal server error", "status": 500})


@app.on_event("shutdown")
async def shutdown():
    pass
