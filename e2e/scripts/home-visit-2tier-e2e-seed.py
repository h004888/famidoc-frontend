#!/usr/bin/env python3
"""
Isolated PostgreSQL seed / inspect / cleanup utility for Home Visit 2-Tier Playwright Full-Stack E2E.
Reads DATABASE_URL from famidoc-backend/.env.
All seeded rows use fixed UUID prefix e2e10000-0000-4000-8000-000000000xxx.
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

E2E_PASSWORD = "E2eHomeVisit2Tier@2026!"

IDS = {
    "family_user": "e2e10000-0000-4000-8000-000000000001",
    "doctor_user": "e2e10000-0000-4000-8000-000000000002",
    "facility_user": "e2e10000-0000-4000-8000-000000000004",
    "family_unit": "e2e10000-0000-4000-8000-000000000010",
    "patient_1": "e2e10000-0000-4000-8000-000000000011",
    "patient_2": "e2e10000-0000-4000-8000-000000000013",
    "doctor": "e2e10000-0000-4000-8000-000000000012",
    "contract": "e2e10000-0000-4000-8000-000000000020",
    "contract_member_1": "e2e10000-0000-4000-8000-000000000021",
    "contract_member_2": "e2e10000-0000-4000-8000-000000000022",
    "enc_2tier_main": "e2e10000-0000-4000-8000-000000000101",
    "enc_overdue": "e2e10000-0000-4000-8000-000000000102",
    "enc_family_confirm": "e2e10000-0000-4000-8000-000000000103",
    "emr_overdue": "e2e10000-0000-4000-8000-000000000202",
    "notif_doctor": "e2e10000-0000-4000-8000-000000000401",
}

ALL_ENCOUNTER_IDS = [
    IDS["enc_2tier_main"],
    IDS["enc_overdue"],
    IDS["enc_family_confirm"],
]

EMAILS = {
    "family": "e2e_hv2_family@famidoc.invalid",
    "doctor": "e2e_hv2_doctor@famidoc.invalid",
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
    user_ids = (IDS["family_user"], IDS["doctor_user"])
    patient_ids = (IDS["patient_1"], IDS["patient_2"])

    cur.execute("SET LOCAL session_replication_role = 'replica'")

    cur.execute(
        "DELETE FROM notifications WHERE id = %s OR user_id IN %s OR reference_id::text IN %s",
        (IDS["notif_doctor"], user_ids, enc_ids),
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
    cur.execute(
        "DELETE FROM encounters WHERE id IN %s OR contract_id = %s",
        (enc_ids, IDS["contract"]),
    )
    cur.execute("DELETE FROM contract_members WHERE contract_id = %s", (IDS["contract"],))
    cur.execute("DELETE FROM medical_contracts WHERE id = %s", (IDS["contract"],))
    cur.execute(
        "DELETE FROM patient_allergies WHERE patient_id IN %s",
        (patient_ids,),
    )
    cur.execute(
        "DELETE FROM patients WHERE id IN %s OR family_id = %s",
        (patient_ids, IDS["family_unit"]),
    )
    cur.execute("DELETE FROM family_units WHERE id = %s", (IDS["family_unit"],))
    cur.execute("DELETE FROM doctors WHERE id = %s", (IDS["doctor"],))
    cur.execute("DELETE FROM users WHERE id IN %s", (user_ids,))


def seed_data(conn) -> dict:
    pw_hash = hash_password(E2E_PASSWORD)
    now_utc = dt.datetime.now(dt.timezone.utc)
    vn_tz = dt.timezone(dt.timedelta(hours=7))
    now_vn = now_utc.astimezone(vn_tz)

    today_vn = now_vn.date()
    yesterday_vn = (now_vn - dt.timedelta(days=1)).date()
    contract_start = (now_vn - dt.timedelta(days=30)).date()
    contract_end = (now_vn + dt.timedelta(days=180)).date()

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cleanup_data(cur)

        cur.execute(
            """
            SELECT hf.id, hf.user_id, u.email AS facility_email
            FROM healthcare_facilities hf
            JOIN users u ON u.id = hf.user_id
            WHERE hf.verification_status = 'ACTIVE'
            LIMIT 1
            """
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
            (IDS["family_user"], EMAILS["family"], "0999000201", "FAMILY_REP", "Nguyễn Văn An (E2E)"),
            (IDS["doctor_user"], EMAILS["doctor"], "0999000202", "DOCTOR", "BS. E2E 2-Tier"),
        ]
        for uid, email, phone, role, full_name in users:
            cur.execute(
                """
                INSERT INTO users (id, email, phone, role, full_name, password_hash, status)
                VALUES (%s, %s, %s, %s::"UserRole", %s, %s, 'ACTIVE'::"UserStatus")
                """,
                (uid, email, phone, role, full_name, pw_hash),
            )

        cur.execute(
            """
            INSERT INTO doctors (
                id, user_id, facility_id, doctor_name, specialty, experience_years,
                onboarding_status
            )
            VALUES (%s, %s, %s, %s, %s, %s, 'ACTIVE'::"DoctorOnboardingStatus")
            """,
            (IDS["doctor"], IDS["doctor_user"], facility_id, "BS. E2E 2-Tier", "Y học gia đình", 10),
        )

        cur.execute(
            """
            INSERT INTO family_units (id, representative_user_id, home_address, emergency_phone)
            VALUES (%s, %s, %s, %s)
            """,
            (IDS["family_unit"], IDS["family_user"], "123 Nguyễn Trãi, Q.5, TP.HCM", "0999000299"),
        )

        cur.execute(
            """
            INSERT INTO patients (id, family_id, full_name, date_of_birth, gender, relationship_to_head, status)
            VALUES (%s, %s, %s, %s, 'MALE'::"Gender", 'HEAD', 'ACTIVE')
            """,
            (IDS["patient_1"], IDS["family_unit"], "Nguyễn Văn An", dt.date(1965, 5, 15)),
        )
        cur.execute(
            """
            INSERT INTO patients (id, family_id, full_name, date_of_birth, gender, relationship_to_head, status)
            VALUES (%s, %s, %s, %s, 'FEMALE'::"Gender", 'SPOUSE', 'ACTIVE')
            """,
            (IDS["patient_2"], IDS["family_unit"], "Trần Thị Bình", dt.date(1968, 8, 20)),
        )

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
                "HD-E2E-HV2-001",
                IDS["family_unit"],
                facility_id,
                IDS["doctor"],
                package_id,
                contract_start,
                contract_end,
            ),
        )
        cur.execute(
            "INSERT INTO contract_members (id, contract_id, patient_id) VALUES (%s, %s, %s)",
            (IDS["contract_member_1"], IDS["contract"], IDS["patient_1"]),
        )
        cur.execute(
            "INSERT INTO contract_members (id, contract_id, patient_id) VALUES (%s, %s, %s)",
            (IDS["contract_member_2"], IDS["contract"], IDS["patient_2"]),
        )

        # Encounter 1: Today HOME_VISIT, family confirmed arrival, 2 PLANNED participants
        cur.execute(
            """
            INSERT INTO encounters (
                id, contract_id, doctor_id, encounter_type, category, visit_scope,
                scheduled_date, scheduled_time, slot_window, encounter_status,
                family_confirmed_arrival_at
            )
            VALUES (
                %s, %s, %s, 'HOME_VISIT'::"EncounterType", 'PERIODIC_ROUTINE'::"EncounterCategory", 'FAMILY'::"EncounterVisitScope",
                %s, '08:30:00', 'MORNING', 'PENDING_RECORD'::"EncounterStatus", %s
            )
            """,
            (IDS["enc_2tier_main"], IDS["contract"], IDS["doctor"], today_vn, now_utc),
        )
        cur.execute(
            """
            INSERT INTO encounter_participants (encounter_id, patient_id, attendance_status)
            VALUES (%s, %s, 'PLANNED'::"EncounterParticipantAttendance"),
                   (%s, %s, 'PLANNED'::"EncounterParticipantAttendance")
            """,
            (IDS["enc_2tier_main"], IDS["patient_1"], IDS["enc_2tier_main"], IDS["patient_2"]),
        )

        # Encounter 2: Yesterday overdue HOME_VISIT with 1 finalized EMR, doctorCompletedAt NULL, recordOverdueAt set
        cur.execute(
            """
            INSERT INTO encounters (
                id, contract_id, doctor_id, encounter_type, category, visit_scope,
                scheduled_date, scheduled_time, slot_window, encounter_status,
                family_confirmed_arrival_at, record_overdue_at
            )
            VALUES (
                %s, %s, %s, 'HOME_VISIT'::"EncounterType", 'PERIODIC_ROUTINE'::"EncounterCategory", 'INDIVIDUAL'::"EncounterVisitScope",
                %s, '08:30:00', 'MORNING', 'PENDING_RECORD'::"EncounterStatus", %s, %s
            )
            """,
            (IDS["enc_overdue"], IDS["contract"], IDS["doctor"], yesterday_vn, now_utc - dt.timedelta(days=1), now_utc),
        )
        cur.execute(
            """
            INSERT INTO encounter_participants (encounter_id, patient_id, attendance_status)
            VALUES (%s, %s, 'EXAMINED'::"EncounterParticipantAttendance"),
                   (%s, %s, 'ABSENT'::"EncounterParticipantAttendance")
            """,
            (IDS["enc_overdue"], IDS["patient_1"], IDS["enc_overdue"], IDS["patient_2"]),
        )
        cur.execute(
            """
            INSERT INTO clinical_emr (
                id, encounter_id, patient_id, chief_complaint, clinical_findings,
                icd10_code, icd10_diagnosis, treatment_plan, is_finalized, finalized_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, true, %s)
            """,
            (
                IDS["emr_overdue"],
                IDS["enc_overdue"],
                IDS["patient_1"],
                "Khám định kỳ (E2E Overdue)",
                "Huyết áp ổn định",
                "I10",
                "Tăng huyết áp vô căn",
                "Theo dõi định kỳ",
                now_utc,
            ),
        )

        # Encounter 3: Today 00:05 HOME_VISIT CONFIRMED awaiting family 1-tap arrival confirm
        cur.execute(
            """
            INSERT INTO encounters (
                id, contract_id, doctor_id, encounter_type, category, visit_scope,
                scheduled_date, scheduled_time, slot_window, encounter_status
            )
            VALUES (
                %s, %s, %s, 'HOME_VISIT'::"EncounterType", 'PERIODIC_ROUTINE'::"EncounterCategory", 'FAMILY'::"EncounterVisitScope",
                %s, '00:05:00', 'MORNING', 'CONFIRMED'::"EncounterStatus"
            )
            """,
            (IDS["enc_family_confirm"], IDS["contract"], IDS["doctor"], today_vn),
        )
        cur.execute(
            """
            INSERT INTO encounter_participants (encounter_id, patient_id, attendance_status)
            VALUES (%s, %s, 'PLANNED'::"EncounterParticipantAttendance")
            """,
            (IDS["enc_family_confirm"], IDS["patient_1"]),
        )

        # Notification for Doctor bell deep-link
        cur.execute(
            """
            INSERT INTO notifications (id, user_id, title, content, type, reference_id, is_read)
            VALUES (%s, %s, %s, %s, %s, %s, false)
            """,
            (
                IDS["notif_doctor"],
                IDS["doctor_user"],
                "Gia đình đã xác nhận bác sĩ có mặt (E2E)",
                "Gia đình Nguyễn Văn An đã xác nhận 1 chạm. Mở ca khám để ghi hồ sơ.",
                "ENCOUNTER_ARRIVAL_CONFIRMED",
                IDS["enc_2tier_main"],
            ),
        )

    conn.commit()
    return {
        "success": True,
        "ids": IDS,
        "emails": EMAILS,
        "password": E2E_PASSWORD,
        "dates": {
            "today": today_vn.isoformat(),
            "yesterday": yesterday_vn.isoformat(),
        },
    }


def inspect_data(conn) -> dict:
    enc_ids = tuple(ALL_ENCOUNTER_IDS)
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT id::text, encounter_status::text, family_confirmed_arrival_at,
                   doctor_completed_at, record_overdue_at, late_completion_reason
            FROM encounters
            WHERE id IN %s
            ORDER BY id
            """,
            (enc_ids,),
        )
        encounters = [dict(row) for row in cur.fetchall()]

        cur.execute(
            """
            SELECT encounter_id::text, patient_id::text, attendance_status::text
            FROM encounter_participants
            WHERE encounter_id IN %s
            ORDER BY encounter_id, patient_id
            """,
            (enc_ids,),
        )
        participants = [dict(row) for row in cur.fetchall()]

        cur.execute(
            """
            SELECT id::text, encounter_id::text, patient_id::text, is_finalized, icd10_code
            FROM clinical_emr
            WHERE encounter_id IN %s
            ORDER BY encounter_id, patient_id
            """,
            (enc_ids,),
        )
        emrs = [dict(row) for row in cur.fetchall()]

    return {
        "success": True,
        "encounters": encounters,
        "participants": participants,
        "emrs": emrs,
    }


def main():
    parser = argparse.ArgumentParser()
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
            result = {"success": True}
        print(json.dumps(result, default=str))
    finally:
        conn.close()


if __name__ == "__main__":
    main()
