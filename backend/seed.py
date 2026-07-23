"""Seed data for UGS HireFlow."""
import random
from datetime import datetime, timezone, timedelta
from db import db
from auth import hash_password
from models import (
    Candidate, Company, Job, Batch, InterviewEvent, PaymentRecord, PartnerInfo,
    Education, Experience, EmergencyContact, Reference, now_iso, new_id
)


async def seed_all():
    # Users: admin + employees
    admin_id = new_id()
    emp1_id, emp2_id = new_id(), new_id()

    await db.users.insert_many([
        {"id": admin_id, "email": "admin@ugshireflow.com", "full_name": "Bhargav Admin",
         "role": "admin", "phone": "+919000000001", "is_active": True,
         "password_hash": hash_password("Bhargav@9669"), "created_at": now_iso()},
        {"id": emp1_id, "email": "srikar@ugshireflow.com", "full_name": "Srikar Recruiter",
         "role": "employee", "phone": "+919949954313", "designation": "Senior Recruiter",
         "department": "Tech Hiring", "is_active": True,
         "password_hash": hash_password("Srikar@9669"), "created_at": now_iso()},
        {"id": emp2_id, "email": "hrteam@ugshireflow.com", "full_name": "HR Team User",
         "role": "employee", "phone": "+919949523474", "designation": "Recruitment Lead",
         "department": "Product Hiring", "is_active": True,
         "password_hash": hash_password("Hrteam@9669"), "created_at": now_iso()},
    ])

    # Companies
    companies_data = [
        ("Infogain Systems", "IT Services", "Bangalore"),
        ("NovaFin Capital", "Fintech", "Mumbai"),
        ("Cortex Health", "Healthtech", "Hyderabad"),
        ("Vertex Retail", "E-commerce", "Gurgaon"),
        ("Skyline Cloud", "Cloud & DevOps", "Pune"),
    ]
    company_ids = []
    for name, ind, loc in companies_data:
        c = Company(name=name, industry=ind, location=loc,
                    website=f"https://{name.split()[0].lower()}.com",
                    about=f"{name} is a leading {ind} organisation building modern products.",
                    hr_contacts=[{"name": f"HR at {name}",
                                    "email": f"hr@{name.split()[0].lower()}.com",
                                    "phone": "+911234500000",
                                    "role": "Head of Talent"}])
        await db.companies.insert_one(c.model_dump())
        company_ids.append(c.id)

    # Jobs
    job_titles = [
        ("Senior React Engineer", ["React", "TypeScript", "Redux"], 3, 6, 1200000, 2000000),
        ("Backend Developer (Python)", ["Python", "FastAPI", "PostgreSQL"], 2, 5, 900000, 1800000),
        ("DevOps Engineer", ["AWS", "Kubernetes", "Terraform"], 3, 7, 1500000, 2500000),
        ("Data Analyst", ["SQL", "Python", "PowerBI"], 1, 3, 600000, 1200000),
        ("Product Manager", ["Product Strategy", "Analytics"], 4, 8, 2000000, 3500000),
        ("Full-Stack Engineer", ["React", "Node.js", "MongoDB"], 2, 5, 1100000, 1900000),
        ("QA Automation Engineer", ["Selenium", "Cypress", "JavaScript"], 2, 4, 800000, 1400000),
        ("Mobile Developer (Flutter)", ["Flutter", "Dart", "Firebase"], 2, 5, 900000, 1600000),
        ("ML Engineer", ["Python", "TensorFlow", "PyTorch"], 3, 6, 1500000, 2400000),
        ("UX Designer", ["Figma", "User Research", "Prototyping"], 2, 5, 900000, 1500000),
    ]
    job_ids = []
    for i, (title, skills, emin, emax, smin, smax) in enumerate(job_titles):
        j = Job(title=title, company_id=company_ids[i % len(company_ids)],
                skills=skills, experience_min=emin, experience_max=emax,
                salary_min=smin, salary_max=smax,
                location=random.choice(["Bangalore", "Mumbai", "Pune", "Remote", "Hyderabad"]),
                vacancies=random.randint(1, 5),
                description=f"We are hiring an experienced {title} for our growing team.")
        await db.jobs.insert_one(j.model_dump())
        job_ids.append(j.id)

    # Batches
    batches = [
        Batch(name="Full-Stack January Batch", technology="React + FastAPI",
              trainer="Anand Kumar", start_date="2026-01-05", end_date="2026-03-05",
              status="running", description="8-week intensive full-stack bootcamp."),
        Batch(name="DevOps Cloud Batch", technology="AWS + Kubernetes",
              trainer="Meera Iyer", start_date="2026-01-20", end_date="2026-03-30",
              status="running", description="Hands-on DevOps training."),
    ]
    batch_ids = []
    for b in batches:
        await db.batches.insert_one(b.model_dump())
        batch_ids.append(b.id)

    # Candidates
    candidate_names = [
        ("Arjun Kapoor", "arjun.k@example.com", "+919812345001"),
        ("Sneha Reddy", "sneha.r@example.com", "+919812345002"),
        ("Vikram Singh", "vikram.s@example.com", "+919812345003"),
        ("Neha Iyer", "neha.i@example.com", "+919812345004"),
        ("Karan Malhotra", "karan.m@example.com", "+919812345005"),
        ("Ananya Nair", "ananya.n@example.com", "+919812345006"),
        ("Rohan Desai", "rohan.d@example.com", "+919812345007"),
        ("Meenakshi Rao", "meenakshi.r@example.com", "+919812345008"),
        ("Aditya Joshi", "aditya.j@example.com", "+919812345009"),
        ("Kavya Menon", "kavya.m@example.com", "+919812345010"),
    ]
    skills_pool = [["React", "JavaScript", "CSS"], ["Python", "Django", "PostgreSQL"],
                    ["AWS", "Docker", "Kubernetes"], ["Java", "Spring Boot"],
                    ["Node.js", "MongoDB", "Express"], ["Flutter", "Dart"],
                    ["SQL", "Tableau", "Excel"], ["Figma", "Adobe XD"]]
    cities = ["Bangalore", "Mumbai", "Pune", "Chennai", "Hyderabad", "Delhi"]
    statuses = ["pending_verification", "verified", "assigned", "company_assigned",
                 "interview_scheduled", "round_1", "technical", "selected", "placed", "waiting"]

    for i, (name, email, phone) in enumerate(candidate_names):
        code = f"UGS-C-{i+1:04d}"
        status = statuses[i % len(statuses)]
        emp_id = [emp1_id, emp2_id][i % 2] if status != "pending_verification" else None
        assigned_co = company_ids[i % len(company_ids)] if status in [
            "company_assigned", "interview_scheduled", "round_1", "technical",
            "selected", "placed"] else None
        assigned_job = job_ids[i % len(job_ids)] if assigned_co else None

        fee = 15000
        paid = fee if status in ["selected", "placed"] else (7500 if i % 3 == 0 else 0)
        p_status = "completed" if paid >= fee and fee > 0 else ("partial" if paid > 0 else "pending")

        payments = []
        if paid > 0:
            payments.append(PaymentRecord(amount=paid, payment_mode="upi",
                                           receipt_number=f"RCPT-{1000+i}",
                                           remarks="Registration fee").model_dump())

        timeline = []
        if status != "pending_verification":
            timeline.append(InterviewEvent(stage="verified", status="completed",
                                            remarks="Profile verified",
                                            updated_by_name="UGS Admin").model_dump())
        if assigned_co:
            timeline.append(InterviewEvent(stage="company_assigned", status="completed",
                                            company_id=assigned_co, job_id=assigned_job,
                                            remarks="Shortlisted",
                                            updated_by_name="Priya Sharma").model_dump())
        if status in ["interview_scheduled", "round_1", "technical", "selected", "placed"]:
            timeline.append(InterviewEvent(stage="interview_scheduled", status="completed",
                                            company_id=assigned_co, job_id=assigned_job,
                                            scheduled_at=now_iso(),
                                            remarks="Round 1 scheduled",
                                            updated_by_name="Priya Sharma").model_dump())
        if status in ["placed"]:
            timeline.append(InterviewEvent(stage="placed", status="completed",
                                            company_id=assigned_co, job_id=assigned_job,
                                            remarks="Successfully placed!",
                                            updated_by_name="UGS Admin").model_dump())

        c = Candidate(
            full_name=name, email=email, phone=phone,
            city=random.choice(cities), state="Karnataka", country="India",
            date_of_birth="1996-05-15", gender=random.choice(["Male", "Female"]),
            skills=random.choice(skills_pool),
            total_experience_years=random.randint(1, 8),
            current_salary=random.randint(500000, 1500000),
            expected_salary=random.randint(1000000, 2500000),
            notice_period_days=random.choice([30, 60, 90]),
            preferred_locations=random.sample(cities, 2),
            education=[Education(degree="B.Tech Computer Science",
                                    institution="IIT Delhi", year="2019",
                                    percentage="8.4 CGPA")],
            experience=[Experience(company="TechCorp", role="Software Engineer",
                                      duration="2 years",
                                      description="Developed scalable web apps")],
            emergency_contact=EmergencyContact(name="Family Contact",
                                                relation="Parent",
                                                phone="+919000000000"),
            reference=Reference(name="Manager Reference", relation="Ex-Manager",
                                 phone="+919000000000"),
            status=status, candidate_code=code,
            assigned_employee_id=emp_id, assigned_company_id=assigned_co,
            assigned_job_id=assigned_job,
            batch_id=batch_ids[i % 2] if i < 4 else None,
            registration_fee=fee, amount_paid=paid, payment_status=p_status,
            payments=payments, interview_timeline=timeline,
            partner=PartnerInfo(name="Referral Partner Ltd", contact="+919000000000",
                                  commission_percent=10, notes="Standard referral").model_dump() if i % 3 == 0 else None,
            placed_at=now_iso() if status == "placed" else None,
            verified_at=now_iso() if status != "pending_verification" else None,
        )
        await db.candidates.insert_one(c.model_dump())

        # Assign candidates to jobs/batches lists
        if assigned_job:
            await db.jobs.update_one({"id": assigned_job},
                                      {"$addToSet": {"assigned_candidate_ids": c.id}})
        if c.batch_id:
            await db.batches.update_one({"id": c.batch_id},
                                          {"$addToSet": {"candidate_ids": c.id}})

