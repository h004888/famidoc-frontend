#!/usr/bin/env python3
"""
Isolated PostgreSQL seed / inspect / cleanup utility for Health Timeline MVP Playwright E2E.
Reads DATABASE_URL from famidoc-backend/.env.
All seeded rows use fixed UUID prefix e2e10000-0000-4000-8000-000000000xxx so cleanup is 100% safe.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse

import psycopg2
from psycopg2.extras import RealDictCursor

REPO_ROOT = Path(__file__).resolve().parents[3]
BACKEND_DIR = REPO_ROOT / "famidoc-backend"
ENV_FILE = BACKEND_DIR / ".env"

E2E_PASSWORD = "E2eTimeline@2026!"

IDS = {
    "family_user": "e2e10000-0000-4000-8000-000000000001",
    "doctor1_user": "e2e10000-0000-4000-8000-000000000002",
    "doctor2_user": "e2e10000-0000-4000-8000-000000000003",
    "doctor3_user": "e2e10000-0000-4000-8000-000000000004",
    "family_unit": "e2e10000-0000-4000-8000-000000000010",
    "patient": "e2e10000-0000-4000-8000-000000000011",
    "patient_paged": "e2e10000-0000-4000-8000-000000000012",
    "doctor1": "e2e10000-0000-4000-8000-000000000021",
    "doctor2": "e2e10000-0000-4000-8000-000000000022",
    "doctor3": "e2e10000-0000-4000-8000-000000000023",
    "contract_active": "e2e10000-0000-4000-8000-000000000031",
    "contract_other": "e2e10000-0000-4000-8000-000000000032",
    "contract_expired": "e2e10000-0000-4000-8000-000000000033",
    "cm_1": "e2e10000-0000-4000-8000-000000000041",
    "cm_2": "e2e10000-0000-4000-8000-000000000042",
    "cm_3": "e2e10000-0000-4000-8000-000000000043",
    "cm_paged": "e2e10000-0000-4000-8000-000000000044",
    "enc_doc1_final": "e2e10000-0000-4000-8000-000000000101",
    "enc_doc1_unfinal": "e2e10000-0000-4000-8000-000000000102",
    "enc_doc2_final": "e2e10000-0000-4000-8000-000000000103",
    "enc_doc3_expired": "e2e10000-0000-4000-8000-000000000104",
    "emr_doc1_final": "e2e10000-0000-4000-8000-000000000201",
    "emr_doc1_unfinal": "e2e10000-0000-4000-8000-000000000202",
    "emr_doc2_final": "e2e10000-0000-4000-8000-000000000203",
    "rx_issued": "e2e10000-0000-4000-8000-000000000301",
    "rx_cancelled": "e2e10000-0000-4000-8000-000000000302",
    "rx_detail_issued": "e2e10000-0000-4000-8000-000000000311",
    "rx_detail_cancelled": "e2e10000-0000-4000-8000-000000000312",
    "doc_family": "e2e10000-0000-4000-8000-000000000401",
}

PAGED_ENC_IDS = [
    f"e2e10000-0000-4000-8000-0000000005{i:02d}" for i in range(1, 23)
]
PAGED_EMR_IDS = [
    f"e2e10000-0000-4000-8000-0000000006{i:02d}" for i in range(1, 23)
]

ALL_CONTRACT_IDS = (
    IDS["contract_active"],
    IDS["contract_other"],
    IDS["contract_expired"],
)
ALL_ENCOUNTER_IDS = tuple(
    [
        IDS["enc_doc1_final"],
        IDS["enc_doc1_unfinal"],
        IDS["enc_doc2_final"],
        IDS["enc_doc3_expired"],
    ]
    + PAGED_ENC_IDS
)
ALL_USER_IDS = (
    IDS["family_user"],
    IDS["doctor1_user"],
    IDS["doctor2_user"],
    IDS["doctor3_user"],
)
ALL_DOCTOR_IDS = (IDS["doctor1"], IDS["doctor2"], IDS["doctor3"])
ALL_PATIENT_IDS = (IDS["patient"], IDS["patient_paged"])

EMAILS = {
    "family": "e2e_timeline_family@famidoc.invalid",
    "doctor1": "e2e_timeline_doctor1@famidoc.invalid",
    "doctor2": "e2e_timeline_doctor2@famidoc.invalid",
    "doctor3": "e2e_timeline_doctor3@famidoc.invalid",
}


def load_database_url() -> str:
    env_url = os.environ.get("DATABASE_URL")
    if env_url:
        return env_url
    if not ENV_FILE.exists():
        raise RuntimeError(f"Missing {ENV_FILE}")
    content = ENV_FILE.read_text(encoding="utf-8")
    match = re.search(r'^DATABASE_URL\s*=\s*"?([^"\r\n]+)"?', content, re.MULTILINE)
    if not match:
        raise RuntimeError("DATABASE_URL not found in famidoc-backend/.env")
    return match.group(1)


def get_connection():
    url = load_database_url()
    parsed = urlparse(url)
    return psycopg2.connect(
        host=parsed.hostname or "localhost",
        port=parsed.port or 5432,
        user=parsed.username or "postgres",
        password=parsed.password or "",
        dbname=(parsed.path or "").lstrip("/"),
    )


def hash_password(plain: str) -> str:
    script = (
        "const bcrypt = require('bcryptjs');"
        "process.stdout.write(bcrypt.hashSync(process.argv[1], 10));"
    )
    proc = subprocess.run(
        ["node", "-e", script, plain],
        cwd=str(BACKEND_DIR),
        capture_output=True,
        text=True,
        check=True,
    )
    return proc.stdout.strip()


def cleanup_data(cur) -> None:
    cur.execute("SET LOCAL session_replication_role = 'replica'")

    cur.execute(
        "DELETE FROM notifications WHERE user_id IN %s OR reference_id::text IN %s",
        (ALL_USER_IDS, ALL_ENCOUNTER_IDS),
    )
    cur.execute(
        "DELETE FROM audit_logs WHERE actor_user_id IN %s OR resource_id::text IN %s",
        (ALL_USER_IDS, ALL_PATIENT_IDS),
    )
    cur.execute(
        "DELETE FROM patient_documents WHERE id = %s OR patient_id IN %s",
        (IDS["doc_family"], ALL_PATIENT_IDS),
    )
    cur.execute(
        """
        DELETE FROM prescription_details
        WHERE prescription_id IN (
            SELECT p.id FROM prescriptions p
            JOIN clinical_emr e ON e.id = p.emr_id
            WHERE e.encounter_id IN %s
        )
        """,
        (ALL_ENCOUNTER_IDS,),
    )
    cur.execute(
        """
        UPDATE prescriptions SET replaces_prescription_id = NULL
        WHERE emr_id IN (SELECT id FROM clinical_emr WHERE encounter_id IN %s)
        """,
        (ALL_ENCOUNTER_IDS,),
    )
    cur.execute(
        """
        DELETE FROM prescriptions
        WHERE emr_id IN (SELECT id FROM clinical_emr WHERE encounter_id IN %s)
        """,
        (ALL_ENCOUNTER_IDS,),
    )
    cur.execute("DELETE FROM clinical_emr WHERE encounter_id IN %s", (ALL_ENCOUNTER_IDS,))
    cur.execute("DELETE FROM encounter_participants WHERE encounter_id IN %s", (ALL_ENCOUNTER_IDS,))
    cur.execute(
        "DELETE FROM encounters WHERE id IN %s OR contract_id IN %s",
        (ALL_ENCOUNTER_IDS, ALL_CONTRACT_IDS),
    )
    cur.execute("DELETE FROM contract_members WHERE contract_id IN %s", (ALL_CONTRACT_IDS,))
    cur.execute("DELETE FROM medical_contracts WHERE id IN %s", (ALL_CONTRACT_IDS,))
    cur.execute(
        "DELETE FROM patients WHERE id IN %s OR family_id = %s",
        (ALL_PATIENT_IDS, IDS["family_unit"]),
    )
    cur.execute("DELETE FROM family_units WHERE id = %s", (IDS["family_unit"],))
    cur.execute("DELETE FROM doctors WHERE id IN %s OR user_id IN %s", (ALL_DOCTOR_IDS, ALL_USER_IDS))
    cur.execute("DELETE FROM users WHERE id IN %s OR email IN %s", (ALL_USER_IDS, tuple(EMAILS.values())))


def seed_data(conn) -> dict:
    pw_hash = hash_password(E2E_PASSWORD)
    now_utc = dt.datetime.now(dt.timezone.utc)
    vn_tz = dt.timezone(dt.timedelta(hours=7))
    now_vn = now_utc.astimezone(vn_tz)

    today = now_vn.date()
    d_minus_1 = today - dt.timedelta(days=1)
    d_minus_2 = today - dt.timedelta(days=2)
    d_minus_3 = today - dt.timedelta(days=3)
    d_minus_4 = today - dt.timedelta(days=4)

    contract_start = today - dt.timedelta(days=30)
    contract_end = today + dt.timedelta(days=180)
    expired_start = today - dt.timedelta(days=120)
    expired_end = today - dt.timedelta(days=10)

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cleanup_data(cur)

        cur.execute(
            "SELECT id FROM healthcare_facilities WHERE verification_status = 'ACTIVE' LIMIT 1"
        )
        fac = cur.fetchone()
        if not fac:
            raise RuntimeError("No ACTIVE healthcare_facility found in database")
        facility_id = str(fac["id"])

        cur.execute("SELECT id FROM service_packages LIMIT 1")
        pkg = cur.fetchone()
        if not pkg:
            raise RuntimeError("No service_package found in database")
        package_id = str(pkg["id"])

        users = [
            (IDS["family_user"], EMAILS["family"], "0998000101", "FAMILY_REP", "E2E Gia đình Timeline"),
            (IDS["doctor1_user"], EMAILS["doctor1"], "0998000102", "DOCTOR", "BS. E2E Timeline 1"),
            (IDS["doctor2_user"], EMAILS["doctor2"], "0998000103", "DOCTOR", "BS. E2E Timeline 2"),
            (IDS["doctor3_user"], EMAILS["doctor3"], "0998000104", "DOCTOR", "BS. E2E Timeline 3"),
        ]
        for uid, email, phone, role, full_name in users:
            cur.execute(
                """
                INSERT INTO users (id, email, phone, role, full_name, password_hash, status)
                VALUES (%s, %s, %s, %s::"UserRole", %s, %s, 'ACTIVE'::"UserStatus")
                """,
                (uid, email, phone, role, full_name, pw_hash),
            )

        doctors = [
            (IDS["doctor1"], IDS["doctor1_user"], "BS. E2E Timeline 1"),
            (IDS["doctor2"], IDS["doctor2_user"], "BS. E2E Timeline 2"),
            (IDS["doctor3"], IDS["doctor3_user"], "BS. E2E Timeline 3"),
        ]
        for did, uid, dname in doctors:
            cur.execute(
                """
                INSERT INTO doctors (
                    id, user_id, facility_id, doctor_name, specialty, experience_years,
                    onboarding_status
                )
                VALUES (%s, %s, %s, %s, 'Y học gia đình', 7, 'ACTIVE'::"DoctorOnboardingStatus")
                """,
                (did, uid, facility_id, dname),
            )

        cur.execute(
            """
            INSERT INTO family_units (id, representative_user_id, home_address, emergency_phone)
            VALUES (%s, %s, '456 Đường Timeline, Quận 3, TP.HCM', '0998000199')
            """,
            (IDS["family_unit"], IDS["family_user"]),
        )

        cur.execute(
            """
            INSERT INTO patients (id, family_id, full_name, date_of_birth, gender, relationship_to_head, status)
            VALUES (%s, %s, 'Nguyễn Văn Timeline', %s, 'MALE'::"Gender", 'HEAD', 'ACTIVE')
            """,
            (IDS["patient"], IDS["family_unit"], dt.date(1970, 3, 20)),
        )
        cur.execute(
            """
            INSERT INTO patients (id, family_id, full_name, date_of_birth, gender, relationship_to_head, status)
            VALUES (%s, %s, 'Trần Thị Phân Trang', %s, 'FEMALE'::"Gender", 'SPOUSE', 'ACTIVE')
            """,
            (IDS["patient_paged"], IDS["family_unit"], dt.date(1972, 8, 10)),
        )

        contracts = [
            (IDS["contract_active"], "HD-E2E-TL-001", IDS["doctor1"], contract_start, contract_end, "ACTIVE"),
            (IDS["contract_other"], "HD-E2E-TL-002", IDS["doctor2"], expired_start, expired_end, "EXPIRED"),
            (IDS["contract_expired"], "HD-E2E-TL-003", IDS["doctor3"], expired_start, expired_end, "EXPIRED"),
        ]
        for cid, cnum, did, sdate, edate, cstatus in contracts:
            cur.execute(
                """
                INSERT INTO medical_contracts (
                    id, contract_number, family_id, facility_id, doctor_id, package_id,
                    total_amount, remaining_home_visits, remaining_telehealth,
                    start_date, end_date, contract_status, is_demo
                )
                VALUES (%s, %s, %s, %s, %s, %s, 3000000, 10, 10, %s, %s, %s, true)
                """,
                (cid, cnum, IDS["family_unit"], facility_id, did, package_id, sdate, edate, cstatus),
            )

        for cm_id, cid, pid in [
            (IDS["cm_1"], IDS["contract_active"], IDS["patient"]),
            (IDS["cm_2"], IDS["contract_other"], IDS["patient"]),
            (IDS["cm_3"], IDS["contract_expired"], IDS["patient"]),
            (IDS["cm_paged"], IDS["contract_active"], IDS["patient_paged"]),
        ]:
            cur.execute(
                "INSERT INTO contract_members (id, contract_id, patient_id) VALUES (%s, %s, %s)",
                (cm_id, cid, pid),
            )

        # Patient 1 encounters:
        # 1) Doctor 1 finalized HOME_VISIT (d_minus_2) -> visible to family & doctor 1 (canOpenDetail=true)
        # 2) Doctor 1 unfinalized TELEHEALTH (d_minus_1) -> hidden from family, visible to doctor 1 (canOpenDetail=true)
        # 3) Doctor 2 finalized FACILITY_VISIT (d_minus_3) -> visible to doctor 1 (canOpenDetail=false, D4)
        encounters = [
            (IDS["enc_doc1_final"], IDS["contract_active"], IDS["doctor1"], "HOME_VISIT", "PERIODIC_ROUTINE", d_minus_2, "08:30:00", "COMPLETED"),
            (IDS["enc_doc1_unfinal"], IDS["contract_active"], IDS["doctor1"], "TELEHEALTH", "AD_HOC_ON_DEMAND", d_minus_1, "09:15:00", "IN_PROGRESS"),
            (IDS["enc_doc2_final"], IDS["contract_other"], IDS["doctor2"], "FACILITY_VISIT", "PERIODIC_ROUTINE", d_minus_3, "14:00:00", "COMPLETED"),
            (IDS["enc_doc3_expired"], IDS["contract_expired"], IDS["doctor3"], "HOME_VISIT", "PERIODIC_ROUTINE", today - dt.timedelta(days=20), "10:00:00", "COMPLETED"),
        ]
        for eid, cid, did, etype, cat, sdate, stime, estatus in encounters:
            doc_completed = now_utc - dt.timedelta(days=2) if estatus == "COMPLETED" else None
            cur.execute(
                """
                INSERT INTO encounters (
                    id, contract_id, doctor_id, encounter_type, category,
                    scheduled_date, scheduled_time, encounter_status, doctor_completed_at
                )
                VALUES (%s, %s, %s, %s::"EncounterType", %s::"EncounterCategory", %s, %s, %s::"EncounterStatus", %s)
                """,
                (eid, cid, did, etype, cat, sdate, stime, estatus, doc_completed),
            )
            cur.execute(
                "INSERT INTO encounter_participants (encounter_id, patient_id) VALUES (%s, %s)",
                (eid, IDS["patient"]),
            )

        cur.execute(
            """
            INSERT INTO clinical_emr (
                id, encounter_id, patient_id, chief_complaint, clinical_findings,
                icd10_code, icd10_diagnosis, treatment_plan, is_finalized, finalized_at
            )
            VALUES (%s, %s, %s, 'Đau rát họng', 'Amidan sưng nhẹ', 'J02', 'Viêm họng cấp', 'Uống nhiều nước ấm', true, %s)
            """,
            (IDS["emr_doc1_final"], IDS["enc_doc1_final"], IDS["patient"], now_utc - dt.timedelta(days=2)),
        )
        cur.execute(
            """
            INSERT INTO clinical_emr (
                id, encounter_id, patient_id, chief_complaint, clinical_findings,
                icd10_code, icd10_diagnosis, treatment_plan, is_finalized
            )
            VALUES (%s, %s, %s, 'Đo huyết áp', 'Chưa hoàn tất bệnh án', 'R51', 'Chưa chốt bệnh án E2E', 'Theo dõi thêm', false)
            """,
            (IDS["emr_doc1_unfinal"], IDS["enc_doc1_unfinal"], IDS["patient"]),
        )
        cur.execute(
            """
            INSERT INTO clinical_emr (
                id, encounter_id, patient_id, chief_complaint, clinical_findings,
                icd10_code, icd10_diagnosis, treatment_plan, is_finalized, finalized_at
            )
            VALUES (%s, %s, %s, 'Tái khám huyết áp', 'HA 130/80 mmHg', 'I10', 'Tăng huyết áp E2E', 'Duy trì thuốc', true, %s)
            """,
            (IDS["emr_doc2_final"], IDS["enc_doc2_final"], IDS["patient"], now_utc - dt.timedelta(days=3)),
        )

        # Prescriptions on finalized EMR 1: 1 ISSUED (visible) + 1 CANCELLED (hidden from doctor & family)
        cur.execute(
            """
            INSERT INTO prescriptions (
                id, emr_id, prescription_code, prescribed_date, valid_until,
                instructions, status, recipient_user_id, created_at
            )
            VALUES (%s, %s, 'RX-E2E-TL-01', %s, %s, 'Súc miệng nước muối', 'ISSUED'::"PrescriptionStatus", %s, %s)
            """,
            (IDS["rx_issued"], IDS["emr_doc1_final"], d_minus_2, today + dt.timedelta(days=14), IDS["family_user"], now_utc),
        )
        cur.execute(
            """
            INSERT INTO prescriptions (
                id, emr_id, prescription_code, prescribed_date, valid_until,
                instructions, status, recipient_user_id, created_at
            )
            VALUES (%s, %s, 'RX-E2E-TL-CANCEL', %s, %s, 'Đơn đã hủy', 'CANCELLED'::"PrescriptionStatus", %s, %s)
            """,
            (IDS["rx_cancelled"], IDS["emr_doc1_final"], d_minus_2, today + dt.timedelta(days=14), IDS["family_user"], now_utc - dt.timedelta(hours=1)),
        )
        for pdid, pid, med in [
            (IDS["rx_detail_issued"], IDS["rx_issued"], "Paracetamol"),
            (IDS["rx_detail_cancelled"], IDS["rx_cancelled"], "Ibuprofen"),
        ]:
            cur.execute(
                """
                INSERT INTO prescription_details (
                    id, prescription_id, medication_name, active_ingredient, strength, administration_route,
                    dosage, frequency, duration_days, quantity, unit, line_number, medication_type
                )
                VALUES (%s, %s, %s, %s, '500mg', 'Uống', '1 viên', '2 lần/ngày', 5, 10, 'viên', 1, 'SINGLE_INGREDIENT')
                """,
                (pdid, pid, med, med),
            )

        # Family uploaded document on d_minus_4
        cur.execute(
            """
            INSERT INTO patient_documents (
                id, patient_id, document_name, document_type, file_url,
                mime_type, file_size_kb, recorded_date
            )
            VALUES (%s, %s, 'X-quang phổi E2E', 'IMAGING_XRAY_CT'::"PatientDocumentType", %s, 'image/png', 120, %s)
            """,
            (IDS["doc_family"], IDS["patient"], f"medical-books/{IDS['patient']}/xray-e2e.png", d_minus_4),
        )

        # Patient 2 (patient_paged): 22 finalized encounters so cursor pagination (limit=20) shows "Xem thêm"
        for idx, (eid, emr_id) in enumerate(zip(PAGED_ENC_IDS, PAGED_EMR_IDS), start=1):
            sdate = today - dt.timedelta(days=idx)
            cur.execute(
                """
                INSERT INTO encounters (
                    id, contract_id, doctor_id, encounter_type, category,
                    scheduled_date, scheduled_time, encounter_status, doctor_completed_at
                )
                VALUES (%s, %s, %s, 'HOME_VISIT'::"EncounterType", 'PERIODIC_ROUTINE'::"EncounterCategory", %s, '08:00:00', 'COMPLETED'::"EncounterStatus", %s)
                """,
                (eid, IDS["contract_active"], IDS["doctor1"], sdate, now_utc - dt.timedelta(days=idx)),
            )
            cur.execute(
                "INSERT INTO encounter_participants (encounter_id, patient_id) VALUES (%s, %s)",
                (eid, IDS["patient_paged"]),
            )
            cur.execute(
                """
                INSERT INTO clinical_emr (
                    id, encounter_id, patient_id, chief_complaint, clinical_findings,
                    icd10_code, icd10_diagnosis, treatment_plan, is_finalized, finalized_at
                )
                VALUES (%s, %s, %s, 'Khám định kỳ', 'Ổn định', 'Z00', %s, 'Theo dõi', true, %s)
                """,
                (emr_id, eid, IDS["patient_paged"], f"Khám định kỳ #{idx:02d}", now_utc - dt.timedelta(days=idx)),
            )

    conn.commit()
    return {
        "success": True,
        "ids": IDS,
        "emails": EMAILS,
        "password": E2E_PASSWORD,
    }


def inspect_audit(conn) -> dict:
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT actor_user_id::text, action, resource_id::text
            FROM audit_logs
            WHERE action = 'READ_PATIENT_TIMELINE' AND resource_id::text IN %s
            """,
            (ALL_PATIENT_IDS,),
        )
        audits = [dict(row) for row in cur.fetchall()]
    return {"success": True, "audits": audits}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["seed", "inspect", "cleanup"])
    args = parser.parse_args()

    conn = get_connection()
    try:
        if args.action == "seed":
            out = seed_data(conn)
        elif args.action == "inspect":
            out = inspect_audit(conn)
        else:
            with conn.cursor() as cur:
                cleanup_data(cur)
            conn.commit()
            out = {"success": True, "action": "cleanup"}
        print(json.dumps(out, default=str))
    finally:
        conn.close()


if __name__ == "__main__":
    main()
