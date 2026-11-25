#!/usr/bin/env python3
"""
Isolated PostgreSQL seed / inspect / cleanup utility for Dual-Lane Encounter Playwright E2E.
Reads DATABASE_URL from famidoc-backend/.env (no hardcoded secrets).
All seeded rows use fixed UUID prefix e2e00000-0000-4000-8000-000000000xxx so cleanup is 100% safe.
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

E2E_PASSWORD = "E2eDualLane@2026!"

IDS = {
    "family_user": "e2e00000-0000-4000-8000-000000000001",
    "doctor_user": "e2e00000-0000-4000-8000-000000000002",
    "admin_user": "e2e00000-0000-4000-8000-000000000003",
    "family_unit": "e2e00000-0000-4000-8000-000000000010",
    "patient": "e2e00000-0000-4000-8000-000000000011",
    "doctor": "e2e00000-0000-4000-8000-000000000012",
    "contract": "e2e00000-0000-4000-8000-000000000020",
    "contract_member": "e2e00000-0000-4000-8000-000000000021",
    # 6 Encounters covering all Dual-Lane E2E scenarios
    "enc_confirm_pending": "e2e00000-0000-4000-8000-000000000101",
    "enc_confirm_complete": "e2e00000-0000-4000-8000-000000000102",
    "enc_future_guard": "e2e00000-0000-4000-8000-000000000103",
    "enc_telehealth_guard": "e2e00000-0000-4000-8000-000000000104",
    "enc_no_show_dispute": "e2e00000-0000-4000-8000-000000000105",
    "enc_rx_replace": "e2e00000-0000-4000-8000-000000000106",
    # Pre-seeded EMR & Prescription
    "emr_confirm_complete": "e2e00000-0000-4000-8000-000000000202",
    "emr_rx_replace": "e2e00000-0000-4000-8000-000000000206",
    "rx_old": "e2e00000-0000-4000-8000-000000000306",
    "rx_detail_old": "e2e00000-0000-4000-8000-000000000316",
}

ALL_ENCOUNTER_IDS = [
    IDS["enc_confirm_pending"],
    IDS["enc_confirm_complete"],
    IDS["enc_future_guard"],
    IDS["enc_telehealth_guard"],
    IDS["enc_no_show_dispute"],
    IDS["enc_rx_replace"],
]

EMAILS = {
    "family": "e2e_dual_lane_family@famidoc.invalid",
    "doctor": "e2e_dual_lane_doctor@famidoc.invalid",
    "admin": "e2e_dual_lane_admin@famidoc.invalid",
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
    enc_ids = tuple(ALL_ENCOUNTER_IDS)
    user_ids = (IDS["family_user"], IDS["doctor_user"], IDS["admin_user"])

    # Temporarily bypass immutability triggers inside this transaction for isolated e2e00000-... rows only
    cur.execute("SET LOCAL session_replication_role = 'replica'")

    # Clean up dependent records created during E2E runs
    cur.execute(
        "DELETE FROM notifications WHERE user_id IN %s OR reference_id::text IN %s",
        (user_ids, enc_ids),
    )
    cur.execute(
        "DELETE FROM audit_logs WHERE actor_user_id IN %s OR resource_id::text IN %s",
        (user_ids, enc_ids),
    )
    cur.execute(
        "DELETE FROM doctor_reviews WHERE doctor_id = %s OR family_id = %s",
        (IDS["doctor"], IDS["family_unit"]),
    )
    cur.execute(
        "DELETE FROM complaints WHERE contract_id = %s OR encounter_id IN %s",
        (IDS["contract"], enc_ids),
    )
    # Delete replacement prescriptions first (FK replaces_prescription_id -> prescriptions.id)
    cur.execute(
        """
        DELETE FROM prescription_details
        WHERE prescription_id IN (
            SELECT p.id FROM prescriptions p
            JOIN clinical_emr e ON e.id = p.emr_id
            WHERE e.encounter_id IN %s
        )
        """,
        (enc_ids,),
    )
    cur.execute(
        """
        UPDATE prescriptions SET replaces_prescription_id = NULL
        WHERE emr_id IN (SELECT id FROM clinical_emr WHERE encounter_id IN %s)
        """,
        (enc_ids,),
    )
    cur.execute(
        """
        DELETE FROM prescriptions
        WHERE emr_id IN (SELECT id FROM clinical_emr WHERE encounter_id IN %s)
        """,
        (enc_ids,),
    )
    cur.execute("DELETE FROM clinical_emr WHERE encounter_id IN %s", (enc_ids,))
    cur.execute("DELETE FROM encounter_participants WHERE encounter_id IN %s", (enc_ids,))
    cur.execute("DELETE FROM encounters WHERE id IN %s OR contract_id = %s", (enc_ids, IDS["contract"]))
    cur.execute("DELETE FROM contract_members WHERE contract_id = %s", (IDS["contract"],))
    cur.execute("DELETE FROM medical_contracts WHERE id = %s", (IDS["contract"],))
    cur.execute("DELETE FROM patients WHERE id = %s OR family_id = %s", (IDS["patient"], IDS["family_unit"]))
    cur.execute("DELETE FROM family_units WHERE id = %s", (IDS["family_unit"],))
    cur.execute("DELETE FROM doctors WHERE id = %s", (IDS["doctor"],))
    cur.execute("DELETE FROM users WHERE id IN %s", (user_ids,))


def seed_data(conn) -> dict:
    pw_hash = hash_password(E2E_PASSWORD)
    now_utc = dt.datetime.now(dt.timezone.utc)
    vn_tz = dt.timezone(dt.timedelta(hours=7))
    now_vn = now_utc.astimezone(vn_tz)

    # Distinct past dates (VN +07:00) so Playwright can target each encounter card uniquely
    t1_vn = now_vn - dt.timedelta(minutes=90)
    past_date_1, past_time_1 = t1_vn.date(), t1_vn.strftime("%H:%M:00")
    past_date_2, past_time_2 = (now_vn - dt.timedelta(days=1)).date(), "10:30:00"
    past_date_3, past_time_3 = (now_vn - dt.timedelta(days=2)).date(), "08:30:00"

    yesterday = (now_vn - dt.timedelta(days=1)).date()
    tomorrow = (now_vn + dt.timedelta(days=1)).date()
    contract_start = (now_vn - dt.timedelta(days=30)).date()
    contract_end = (now_vn + dt.timedelta(days=180)).date()

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # 1. Clean previous E2E rows cleanly
        cleanup_data(cur)

        # 2. Find an existing ACTIVE facility and service package
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

        # 3. Create isolated users (FAMILY_REP, DOCTOR, ADMIN)
        users = [
            (IDS["family_user"], EMAILS["family"], "0999000101", "FAMILY_REP", "E2E Gia đình 2 Làn"),
            (IDS["doctor_user"], EMAILS["doctor"], "0999000102", "DOCTOR", "BS. E2E Đối Soát"),
            (IDS["admin_user"], EMAILS["admin"], "0999000103", "ADMIN", "Admin E2E Đối Soát"),
        ]
        for uid, email, phone, role, full_name in users:
            cur.execute(
                """
                INSERT INTO users (id, email, phone, role, full_name, password_hash, status)
                VALUES (%s, %s, %s, %s::"UserRole", %s, %s, 'ACTIVE'::"UserStatus")
                """,
                (uid, email, phone, role, full_name, pw_hash),
            )

        # 4. Create isolated Doctor linked to ACTIVE facility with onboarding_status = 'ACTIVE'
        cur.execute(
            """
            INSERT INTO doctors (
                id, user_id, facility_id, doctor_name, specialty, experience_years,
                onboarding_status
            )
            VALUES (%s, %s, %s, %s, %s, %s, 'ACTIVE'::"DoctorOnboardingStatus")
            """,
            (
                IDS["doctor"],
                IDS["doctor_user"],
                facility_id,
                "BS. E2E Đối Soát",
                "Y học gia đình",
                8,
            ),
        )

        # 5. Create isolated FamilyUnit & Patient
        cur.execute(
            """
            INSERT INTO family_units (id, representative_user_id, home_address, emergency_phone)
            VALUES (%s, %s, %s, %s)
            """,
            (
                IDS["family_unit"],
                IDS["family_user"],
                "123 Đường Kiểm Thử, Quận 1, TP.HCM",
                "0999000199",
            ),
        )
        cur.execute(
            """
            INSERT INTO patients (id, family_id, full_name, date_of_birth, gender, relationship_to_head, status)
            VALUES (%s, %s, %s, %s, 'MALE'::"Gender", 'HEAD', 'ACTIVE')
            """,
            (
                IDS["patient"],
                IDS["family_unit"],
                "Nguyễn Văn E2E",
                dt.date(1965, 5, 15),
            ),
        )

        # 6. Create ACTIVE MedicalContract & ContractMember
        cur.execute(
            """
            INSERT INTO medical_contracts (
                id, contract_number, family_id, facility_id, doctor_id, package_id,
                total_amount, remaining_home_visits, remaining_telehealth,
                start_date, end_date, contract_status, is_demo
            )
            VALUES (
                %s, %s, %s, %s, %s, %s,
                3000000, 10, 10,
                %s, %s, 'ACTIVE', true
            )
            """,
            (
                IDS["contract"],
                "HD-E2E-DUAL-LANE-001",
                IDS["family_unit"],
                facility_id,
                IDS["doctor"],
                package_id,
                contract_start,
                contract_end,
            ),
        )
        cur.execute(
            """
            INSERT INTO contract_members (id, contract_id, patient_id)
            VALUES (%s, %s, %s)
            """,
            (IDS["contract_member"], IDS["contract"], IDS["patient"]),
        )

        # 7. Create 6 Encounters for Dual-Lane E2E scenarios
        encounters = [
            # E2E-01: Past HOME_VISIT CONFIRMED, no EMR -> confirmArrival => PENDING_RECORD -> doctor confirm => COMPLETED
            (IDS["enc_confirm_pending"], "HOME_VISIT", "PERIODIC_ROUTINE", past_date_1, past_time_1, "CONFIRMED"),
            # E2E-02: Past HOME_VISIT CONFIRMED, has finalized EMR -> confirmArrival => COMPLETED
            (IDS["enc_confirm_complete"], "HOME_VISIT", "PERIODIC_ROUTINE", past_date_2, past_time_2, "CONFIRMED"),
            # E2E-03a: Future HOME_VISIT CONFIRMED -> confirmArrival => 400 BadRequest
            (IDS["enc_future_guard"], "HOME_VISIT", "PERIODIC_ROUTINE", tomorrow, "10:00:00", "CONFIRMED"),
            # E2E-03b: Past TELEHEALTH CONFIRMED -> confirmArrival => 400 BadRequest
            (IDS["enc_telehealth_guard"], "TELEHEALTH", "AD_HOC_ON_DEMAND", past_date_1, past_time_1, "CONFIRMED"),
            # E2E-04: Past HOME_VISIT CONFIRMED -> family reports DOCTOR_ABSENT => DISPUTED & locked from auto-close
            (IDS["enc_no_show_dispute"], "HOME_VISIT", "PERIODIC_ROUTINE", past_date_3, past_time_3, "CONFIRMED"),
            # E2E-05: Completed HOME_VISIT with ISSUED prescription -> D4 replace via prescriptionsApi.replace
            (IDS["enc_rx_replace"], "HOME_VISIT", "PERIODIC_ROUTINE", yesterday, "09:00:00", "COMPLETED"),
        ]
        for eid, etype, cat, sdate, stime, status in encounters:
            cur.execute(
                """
                INSERT INTO encounters (
                    id, contract_id, doctor_id, encounter_type, category,
                    scheduled_date, scheduled_time, encounter_status
                )
                VALUES (%s, %s, %s, %s::"EncounterType", %s::"EncounterCategory", %s, %s, %s::"EncounterStatus")
                """,
                (eid, IDS["contract"], IDS["doctor"], etype, cat, sdate, stime, status),
            )
            cur.execute(
                """
                INSERT INTO encounter_participants (encounter_id, patient_id)
                VALUES (%s, %s)
                """,
                (eid, IDS["patient"]),
            )

        # 8. Seed finalized EMR for ENC_CONFIRM_COMPLETE
        cur.execute(
            """
            INSERT INTO clinical_emr (
                id, encounter_id, patient_id, chief_complaint, clinical_findings,
                icd10_code, icd10_diagnosis, treatment_plan, is_finalized, finalized_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, true, %s)
            """,
            (
                IDS["emr_confirm_complete"],
                IDS["enc_confirm_complete"],
                IDS["patient"],
                "Kiểm tra huyết áp định kỳ (E2E-02)",
                "Huyết áp 125/80 mmHg, tim đều",
                "I10",
                "Tăng huyết áp vô căn",
                "Tiếp tục theo dõi tại nhà",
                now_utc,
            ),
        )

        # 9. Seed finalized EMR + ISSUED Prescription for ENC_RX_REPLACE (D4)
        cur.execute(
            """
            INSERT INTO clinical_emr (
                id, encounter_id, patient_id, chief_complaint, clinical_findings,
                icd10_code, icd10_diagnosis, treatment_plan, is_finalized, finalized_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, true, %s)
            """,
            (
                IDS["emr_rx_replace"],
                IDS["enc_rx_replace"],
                IDS["patient"],
                "Đau đầu nhẹ, tái khám tăng huyết áp (E2E-05)",
                "Tim đều, phổi trong",
                "I10",
                "Tăng huyết áp vô căn",
                "Uống thuốc đều đặn mỗi sáng",
                now_utc - dt.timedelta(days=1),
            ),
        )
        cur.execute(
            """
            INSERT INTO prescriptions (
                id, emr_id, prescription_code, prescribed_date, valid_until,
                instructions, status, recipient_user_id, clinical_context
            )
            VALUES (%s, %s, %s, %s, %s, %s, 'ISSUED'::"PrescriptionStatus", %s, %s::jsonb)
            """,
            (
                IDS["rx_old"],
                IDS["emr_rx_replace"],
                "RX-E2E-DL-01",
                yesterday,
                yesterday + dt.timedelta(days=30),
                "Uống 1 viên sau ăn sáng",
                IDS["family_user"],
                json.dumps({"address": "123 Đường Kiểm Thử", "phone": "0999000101"}),
            ),
        )
        cur.execute(
            """
            INSERT INTO prescription_details (
                id, prescription_id, medication_name, active_ingredient, strength, administration_route,
                dosage, frequency, duration_days, quantity, unit, line_number, medication_type
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 1, 'SINGLE_INGREDIENT')
            """,
            (
                IDS["rx_detail_old"],
                IDS["rx_old"],
                "Amlodipine",
                "Amlodipine besylate",
                "5mg",
                "Uống",
                "1 viên",
                "1 lần/ngày",
                30,
                30,
                "viên",
            ),
        )

    conn.commit()
    return {
        "success": True,
        "action": "seed",
        "ids": IDS,
        "emails": EMAILS,
        "password": E2E_PASSWORD,
        "dates": {
            "enc_confirm_pending": past_date_1.strftime("%d/%m/%Y"),
            "enc_confirm_complete": past_date_2.strftime("%d/%m/%Y"),
            "enc_no_show_dispute": past_date_3.strftime("%d/%m/%Y"),
        },
    }


def inspect_data(conn) -> dict:
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT id::text, encounter_type::text, encounter_status::text,
                   family_confirmed_arrival_at::text
            FROM encounters
            WHERE id IN %s
            ORDER BY id
            """,
            (tuple(ALL_ENCOUNTER_IDS),),
        )
        encounters = [dict(r) for r in cur.fetchall()]

        cur.execute(
            """
            SELECT id::text, encounter_id::text, is_finalized
            FROM clinical_emr
            WHERE encounter_id IN %s
            ORDER BY encounter_id
            """,
            (tuple(ALL_ENCOUNTER_IDS),),
        )
        emrs = [dict(r) for r in cur.fetchall()]

        cur.execute(
            """
            SELECT p.id::text, p.prescription_code, p.status::text,
                   p.replaces_prescription_id::text, p.replacement_reason
            FROM prescriptions p
            JOIN clinical_emr e ON e.id = p.emr_id
            WHERE e.encounter_id = %s
            ORDER BY p.created_at
            """,
            (IDS["enc_rx_replace"],),
        )
        prescriptions = [dict(r) for r in cur.fetchall()]

        cur.execute(
            """
            SELECT id::text, encounter_id::text, complaint_category::text, status::text
            FROM complaints
            WHERE contract_id = %s
            """,
            (IDS["contract"],),
        )
        complaints = [dict(r) for r in cur.fetchall()]

    return {
        "success": True,
        "encounters": encounters,
        "emrs": emrs,
        "prescriptions": prescriptions,
        "complaints": complaints,
    }


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description="Dual-Lane Encounter E2E PostgreSQL Seed/Cleanup")
    parser.add_argument("action", choices=["seed", "inspect", "cleanup"])
    args = parser.parse_args()

    conn = get_connection()
    try:
        if args.action == "seed":
            result = seed_data(conn)
        elif args.action == "inspect":
            result = inspect_data(conn)
        else:
            with conn.cursor() as cur:
                cleanup_data(cur)
            conn.commit()
            result = {"success": True, "action": "cleanup"}
        print(json.dumps(result, ensure_ascii=False, indent=2))
    finally:
        conn.close()


if __name__ == "__main__":
    main()
