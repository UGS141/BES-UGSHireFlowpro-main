"""Phase 4 additions — Placement Gallery + Website Enquiries."""
import io
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from openpyxl import Workbook

from db import db, log_activity, create_notification
from auth import get_current_user, require_roles
from storage import put_object, APP_NAME
from models import new_id, now_iso, FileRef

router = APIRouter(prefix="/api", tags=["v3"])


# ================================================================
# MODELS
# ================================================================
class PlacementBase(BaseModel):
    candidate_name: str
    company_name: str
    job_role: str
    package: Optional[str] = None
    placement_date: Optional[str] = None
    short_description: Optional[str] = None
    display_order: int = 0
    is_published: bool = True


class Placement(PlacementBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    candidate_photo_file_id: Optional[str] = None
    company_logo_file_id: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class EnquiryBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: Optional[str] = None
    message: str


class Enquiry(EnquiryBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    status: str = "unread"  # unread, read, replied
    replied_at: Optional[str] = None
    reply_notes: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)


# ================================================================
# PLACEMENT GALLERY
# ================================================================
from fastapi.responses import JSONResponse
from upload_service import process_and_save_upload, UploadValidationError

# ================================================================
# PLACEMENT GALLERY
# ================================================================
async def _upload_placement_file(file: UploadFile, owner_id: str, label: str) -> str:
    fr = await process_and_save_upload(file, owner_id=owner_id, label=label)
    return fr["id"]


@router.get("/public/placements")
async def public_placements():
    """Public: fetch published placements ordered by display_order."""
    items = await db.placements.find({"is_published": True}, {"_id": 0}) \
        .sort([("display_order", 1), ("created_at", -1)]).to_list(200)
    return items


@router.get("/placements")
async def list_placements(current: dict = Depends(require_roles(["admin"]))):
    items = await db.placements.find({}, {"_id": 0}) \
        .sort([("display_order", 1), ("created_at", -1)]).to_list(500)
    return items


@router.post("/placements")
async def create_placement(
    candidate_name: str = Form(...),
    company_name: str = Form(...),
    job_role: str = Form(...),
    package: Optional[str] = Form(None),
    placement_date: Optional[str] = Form(None),
    short_description: Optional[str] = Form(None),
    display_order: int = Form(0),
    is_published: bool = Form(True),
    candidate_photo: Optional[UploadFile] = File(None),
    company_logo: Optional[UploadFile] = File(None),
    current: dict = Depends(require_roles(["admin"])),
):
    try:
        p = Placement(candidate_name=candidate_name, company_name=company_name,
                        job_role=job_role, package=package, placement_date=placement_date,
                        short_description=short_description,
                        display_order=display_order, is_published=is_published)
        if candidate_photo and candidate_photo.filename:
            p.candidate_photo_file_id = await _upload_placement_file(candidate_photo, current["id"], "placement_candidate")
        if company_logo and company_logo.filename:
            p.company_logo_file_id = await _upload_placement_file(company_logo, current["id"], "company_logo")
        await db.placements.insert_one(p.model_dump())
        await log_activity(current, "placement.created",
                            f"Added placement: {candidate_name} → {company_name}",
                            "placement", p.id)
        return p.model_dump()
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
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error_code": "UPLOAD_FAILED",
                "message": "Unable to add placement.",
                "details": str(e)
            }
        )


@router.patch("/placements/{pid}")
async def update_placement(
    pid: str,
    candidate_name: Optional[str] = Form(None),
    company_name: Optional[str] = Form(None),
    job_role: Optional[str] = Form(None),
    package: Optional[str] = Form(None),
    placement_date: Optional[str] = Form(None),
    short_description: Optional[str] = Form(None),
    display_order: Optional[int] = Form(None),
    is_published: Optional[bool] = Form(None),
    candidate_photo: Optional[UploadFile] = File(None),
    company_logo: Optional[UploadFile] = File(None),
    current: dict = Depends(require_roles(["admin"])),
):
    try:
        updates = {k: v for k, v in {
            "candidate_name": candidate_name, "company_name": company_name,
            "job_role": job_role, "package": package,
            "placement_date": placement_date, "short_description": short_description,
            "display_order": display_order, "is_published": is_published,
        }.items() if v is not None}
        if candidate_photo and candidate_photo.filename:
            updates["candidate_photo_file_id"] = await _upload_placement_file(candidate_photo, current["id"], "placement_candidate")
        if company_logo and company_logo.filename:
            updates["company_logo_file_id"] = await _upload_placement_file(company_logo, current["id"], "company_logo")
        updates["updated_at"] = now_iso()
        r = await db.placements.update_one({"id": pid}, {"$set": updates})
        if r.matched_count == 0: raise HTTPException(404)
        await log_activity(current, "placement.updated", f"Updated placement {pid}",
                            "placement", pid)
        return await db.placements.find_one({"id": pid}, {"_id": 0})
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
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error_code": "UPLOAD_FAILED",
                "message": "Unable to update placement.",
                "details": str(e)
            }
        )


@router.post("/placements/{pid}/publish")
async def publish_placement(pid: str, current: dict = Depends(require_roles(["admin"]))):
    await db.placements.update_one({"id": pid},
        {"$set": {"is_published": True, "updated_at": now_iso()}})
    return {"success": True}


@router.post("/placements/{pid}/hide")
async def hide_placement(pid: str, current: dict = Depends(require_roles(["admin"]))):
    await db.placements.update_one({"id": pid},
        {"$set": {"is_published": False, "updated_at": now_iso()}})
    return {"success": True}


@router.delete("/placements/{pid}")
async def delete_placement(pid: str, current: dict = Depends(require_roles(["admin"]))):
    await db.placements.delete_one({"id": pid})
    await log_activity(current, "placement.deleted", f"Deleted placement {pid}",
                        "placement", pid)
    return {"success": True}


# ================================================================
# WEBSITE ENQUIRIES
# ================================================================
@router.post("/public/enquiries")
async def submit_enquiry(body: EnquiryBase):
    """Public: contact form submission. Also fires admin notifications."""
    e = Enquiry(**body.model_dump())
    await db.enquiries.insert_one(e.model_dump())
    await log_activity(None, "enquiry.received",
                        f"New enquiry from {e.name} ({e.email})",
                        "enquiry", e.id)
    async for admin in db.users.find({"role": "admin"}):
        await create_notification(admin["id"], "New Website Enquiry",
                                    f"{e.name}: {e.subject or (e.message[:60] + '…')}",
                                    "info", "/app/enquiries")
    return {"success": True, "id": e.id,
             "message": "Enquiry received. We'll get back to you shortly."}


@router.get("/enquiries")
async def list_enquiries(
    q: str = "", status: str = "",
    skip: int = 0, limit: int = 100,
    current: dict = Depends(require_roles(["admin"])),
):
    filt = {}
    if q:
        filt["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
            {"phone": {"$regex": q, "$options": "i"}},
            {"subject": {"$regex": q, "$options": "i"}},
            {"message": {"$regex": q, "$options": "i"}},
        ]
    if status: filt["status"] = status
    items = await db.enquiries.find(filt, {"_id": 0}).sort("created_at", -1) \
        .skip(skip).limit(limit).to_list(limit)
    total = await db.enquiries.count_documents(filt)
    unread = await db.enquiries.count_documents({"status": "unread"})
    return {"items": items, "total": total, "unread": unread}


@router.get("/enquiries/unread-count")
async def unread_enquiries_count(current: dict = Depends(get_current_user)):
    if current["role"] != "admin":
        return {"unread": 0}
    n = await db.enquiries.count_documents({"status": "unread"})
    return {"unread": n}


@router.post("/enquiries/{eid}/mark-read")
async def mark_enquiry_read(eid: str, current: dict = Depends(require_roles(["admin"]))):
    await db.enquiries.update_one({"id": eid}, {"$set": {"status": "read"}})
    return {"success": True}


@router.post("/enquiries/{eid}/mark-replied")
async def mark_enquiry_replied(eid: str, reply_notes: Optional[str] = Form(None),
                                 current: dict = Depends(require_roles(["admin"]))):
    await db.enquiries.update_one({"id": eid}, {"$set": {
        "status": "replied", "replied_at": now_iso(), "reply_notes": reply_notes
    }})
    await log_activity(current, "enquiry.replied", f"Enquiry {eid} marked replied",
                        "enquiry", eid)
    return {"success": True}


@router.delete("/enquiries/{eid}")
async def delete_enquiry(eid: str, current: dict = Depends(require_roles(["admin"]))):
    await db.enquiries.delete_one({"id": eid})
    return {"success": True}


@router.get("/enquiries/export/xlsx")
async def export_enquiries_xlsx(current: dict = Depends(require_roles(["admin"]))):
    items = await db.enquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(10000)
    wb = Workbook(); ws = wb.active; ws.title = "Enquiries"
    ws.append(["Name", "Email", "Phone", "Subject", "Message", "Status",
                "Submitted", "Replied", "Reply Notes"])
    for e in items:
        ws.append([e.get("name"), e.get("email"), e.get("phone"),
                    e.get("subject"), e.get("message"), e.get("status"),
                    e.get("created_at"), e.get("replied_at") or "",
                    e.get("reply_notes") or ""])
    for i, col in enumerate(ws.columns, 1):
        max_len = max((len(str(c.value)) for c in col if c.value), default=10)
        ws.column_dimensions[ws.cell(row=1, column=i).column_letter].width = min(max_len + 2, 60)
    buf = io.BytesIO(); wb.save(buf); buf.seek(0)
    return StreamingResponse(buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=enquiries.xlsx"})


# ================================================================
# SEED sample placements (idempotent, only if empty)
# ================================================================
async def seed_placements_if_empty():
    if await db.placements.count_documents({}) > 0:
        return
    samples = [
        ("Aditya Sharma", "Infosys", "Software Engineer", "₹8.5 LPA"),
        ("Priya Menon", "TCS", "Business Analyst", "₹7.2 LPA"),
        ("Rohan Gupta", "Accenture", "Data Analyst", "₹9.0 LPA"),
        ("Neha Iyer", "Wipro", "Full-Stack Developer", "₹10.5 LPA"),
        ("Karan Malhotra", "Cognizant", "DevOps Engineer", "₹11.0 LPA"),
        ("Ananya Nair", "Capgemini", "QA Engineer", "₹7.8 LPA"),
        ("Vikram Singh", "Deloitte", "Consultant", "₹12.4 LPA"),
        ("Meenakshi Rao", "IBM", "Cloud Engineer", "₹13.0 LPA"),
    ]
    for i, (name, co, role, pkg) in enumerate(samples):
        p = Placement(
            candidate_name=name, company_name=co, job_role=role,
            package=pkg, placement_date="2025-11-15", display_order=i,
            is_published=True,
            short_description=f"{name} was placed at {co} as {role}.",
        )
        await db.placements.insert_one(p.model_dump())
