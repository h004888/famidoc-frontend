#!/usr/bin/env python3
"""
Isolated PostgreSQL seed / inspect / cleanup utility for Contract Renewal Playwright E2E.
Connects strictly to local Docker Postgres (default: postgresql://postgres:postgres@127.0.0.1:5432/famidoc_test?schema=public).
All seeded rows use fixed UUID prefix e2e90000-0000-4000-8000-000000000xxx.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import subprocess
import sys
from pathlib import Path

import psycopg2
from psycopg2.extras import RealDictCursor

REPO_ROOT = Path(__file__).resolve().parents[3]
BACKEND_DIR = REPO_ROOT / "famidoc-backend"
DEFAULT_DB_URL = "postgresql://postgres:postgres@127.0.0.1:5432/famidoc_test"
E2E_PASSWORD = "E2eRenewal@2026!"

IDS = {
    "admin_user": "e2e90000-0000-4000-8000-000000000001",
    "facility_user": "e2e90000-0000-4000-8000-000000000002",
    "doctor_user": "e2e90000-0000-4000-8000-000000000003",
    "family_a_user": "e2e90000-0000-4000-8000-000000000004",
    "family_b_user": "e2e90000-0000-4000-8000-000000000005",
    "family_c_user": "e2e90000-0000-4000-8000-000000000006",
    "facility": "e2e90000-0000-4000-8000-000000000010",
    "b2b": "e2e90000-0000-4000-8000-000000000011",
    "doctor": "e2e90000-0000-4000-8000-000000000012",
    "package": "e2e90000-0000-4000-8000-000000000020",
    "family_a": "e2e90000-0000-4000-8000-000000000031",
    "family_b": "e2e90000-0000-4000-8000-000000000032",
    "family_c": "e2e90000-0000-4000-8000-000000000033",
    "patient_a1": "e2e90000-0000-4000-8000-000000000041",
    "patient_a2": "e2e90000-0000-4000-8000-000000000042",
    "patient_b1": "e2e90000-0000-4000-8000-000000000043",
    "patient_c1": "e2e90000-0000-4000-8000-000000000044",
    "contract_a": "e2e90000-0000-4000-8000-000000000051",
    "contract_b": "e2e90000-0000-4000-8000-000000000052",
    "contract_c": "e2e90000-0000-4000-8000-000000000053",
}


def get_conn():
    db_url = os.environ.get("E2E_DATABASE_URL", DEFAULT_DB_URL)
    return psycopg2.connect(db_url)


def hash_password(password: str) -> str:
    js = (
        "const { hashSync } = require('bcryptjs');"
        f"process.stdout.write(hashSync({json.dumps(password)}, 10));"
    )
    out = subprocess.check_output(
        ["node", "-e", js],
        cwd=str(BACKEND_DIR),
        text=True,
    )
    return out.strip()


def cleanup(cur) -> None:
    fam_ids = [IDS["family_a"], IDS["family_b"], IDS["family_c"]]
    user_ids = [
        IDS["admin_user"],
        IDS["facility_user"],
        IDS["doctor_user"],
        IDS["family_a_user"],
        IDS["family_b_user"],
        IDS["family_c_user"],
    ]

    cur.execute("UPDATE invoices SET accepted_transaction_id = NULL WHERE contract_id IN (SELECT id FROM medical_contracts WHERE family_id = ANY(%s::uuid[]))", (fam_ids,))
    cur.execute("DELETE FROM payment_transactions WHERE invoice_id IN (SELECT id FROM invoices WHERE contract_id IN (SELECT id FROM medical_contracts WHERE family_id = ANY(%s::uuid[])))", (fam_ids,))
    cur.execute("DELETE FROM invoices WHERE contract_id IN (SELECT id FROM medical_contracts WHERE family_id = ANY(%s::uuid[]))", (fam_ids,))
    cur.execute("DELETE FROM notifications WHERE user_id = ANY(%s::uuid[])", (user_ids,))
    cur.execute("DELETE FROM audit_logs WHERE actor_user_id = ANY(%s::uuid[])", (user_ids,))
    cur.execute("DELETE FROM doctor_slot_bookings WHERE doctor_id = %s::uuid", (IDS["doctor"],))
    cur.execute("DELETE FROM encounters WHERE contract_id IN (SELECT id FROM medical_contracts WHERE family_id = ANY(%s::uuid[]))", (fam_ids,))
    cur.execute("DELETE FROM contract_refund_requests WHERE contract_id IN (SELECT id FROM medical_contracts WHERE family_id = ANY(%s::uuid[]))", (fam_ids,))
    cur.execute("DELETE FROM contract_members WHERE contract_id IN (SELECT id FROM medical_contracts WHERE family_id = ANY(%s::uuid[]))", (fam_ids,))
    cur.execute("DELETE FROM contract_signatures WHERE contract_id IN (SELECT id FROM medical_contracts WHERE family_id = ANY(%s::uuid[]))", (fam_ids,))
    cur.execute("DELETE FROM medical_contracts WHERE family_id = ANY(%s::uuid[]) AND upgraded_from_id IS NOT NULL", (fam_ids,))
    cur.execute("DELETE FROM medical_contracts WHERE family_id = ANY(%s::uuid[])", (fam_ids,))
    cur.execute("DELETE FROM patients WHERE family_id = ANY(%s::uuid[])", (fam_ids,))
    cur.execute("DELETE FROM family_units WHERE id = ANY(%s::uuid[])", (fam_ids,))
    cur.execute("DELETE FROM doctors WHERE id = %s::uuid", (IDS["doctor"],))
    cur.execute("DELETE FROM b2b_staffing_contracts WHERE id = %s::uuid", (IDS["b2b"],))
    cur.execute("DELETE FROM healthcare_facilities WHERE id = %s::uuid", (IDS["facility"],))
    cur.execute("DELETE FROM service_packages WHERE id = %s::uuid", (IDS["package"],))
    cur.execute("DELETE FROM auth_sessions WHERE user_id = ANY(%s::uuid[])", (user_ids,))
    cur.execute("DELETE FROM users WHERE id = ANY(%s::uuid[])", (user_ids,))


def seed() -> dict:
    pw_hash = hash_password(E2E_PASSWORD)
    vn_today = (dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=7)).date()
    a_start = vn_today - dt.timedelta(days=85)
    a_end = vn_today + dt.timedelta(days=5)  # Case A: trong ngưỡng nhắc hạn 7 ngày
    b_start = vn_today - dt.timedelta(days=92)
    b_end = vn_today - dt.timedelta(days=2)  # Case B: EXPIRED trong ân hạn 7 ngày
    c_start = vn_today - dt.timedelta(days=30)
    c_end = vn_today + dt.timedelta(days=60)

    snapshot = {
        "package": {
            "id": IDS["package"],
            "code": "E2E_RENEWAL_3M",
            "version": 1,
            "name": "Gói Gia Đình E2E 3 Tháng",
            "durationMonths": 3,
            "priceVnd": 3500000,
            "includedMembers": 4,
            "maxMembers": 6,
            "additionalMemberMonthlyPriceVnd": 200000,
            "quotaPeriod": "PER_TERM",
        },
        "members": {"requestedCount": 2, "includedCount": 4, "additionalCount": 0, "maxAllowedCount": 6},
        "pricing": {"basePriceVnd": 3500000, "additionalMembersTotalVnd": 0, "totalPriceVnd": 3500000, "currency": "VND"},
        "benefits": {"quotas": {"homeVisits": 3, "videoConsultations": 20, "facilityVisits": 0}, "quotaPeriod": "PER_TERM", "unlimitedMessaging": True},
    }

    with get_conn() as conn:
        with conn.cursor() as cur:
            cleanup(cur)

            users = [
                (IDS["admin_user"], "0989000001", "e2e.ren.admin@famidoc.test", "ADMIN", "Admin E2E"),
                (IDS["facility_user"], "0989000002", "e2e.ren.facility@famidoc.test", "HEALTHCARE_FACILITY", "CSYT E2E"),
                (IDS["doctor_user"], "0989000003", "e2e.ren.doctor@famidoc.test", "DOCTOR", "BS. Trần Gia Đình E2E"),
                (IDS["family_a_user"], "0989000004", "e2e.ren.familya@famidoc.test", "FAMILY_REP", "Nguyễn Văn A (Case A)"),
                (IDS["family_b_user"], "0989000005", "e2e.ren.familyb@famidoc.test", "FAMILY_REP", "Lê Thị B (Case B)"),
                (IDS["family_c_user"], "0989000006", "e2e.ren.familyc@famidoc.test", "FAMILY_REP", "Phạm Văn C (Terminated)"),
            ]
            for uid, phone, email, role, name in users:
                cur.execute(
                    """
                    INSERT INTO users (id, phone, email, password_hash, role, full_name, status)
                    VALUES (%s::uuid, %s, %s, %s, %s::"UserRole", %s, 'ACTIVE'::"UserStatus")
                    """,
                    (uid, phone, email, pw_hash, role, name),
                )

            cur.execute(
                """
                INSERT INTO healthcare_facilities (
                  id, user_id, facility_name, license_number, tax_code, address, hotline,
                  bank_name, bank_account_number, bank_account_holder, representative_name,
                  verification_status
                )
                VALUES (
                  %s::uuid, %s::uuid, 'Phòng khám Đa khoa Gia Đình E2E', 'GPHD-E2E-001', '0109999001',
                  '123 Nguyễn Huệ, Q1, TP.HCM', '0989000002', 'Vietcombank', '0011223344',
                  'PHONG KHAM E2E', 'BS. Giám đốc E2E', 'ACTIVE'::"FacilityVerificationStatus"
                )
                """,
                (IDS["facility"], IDS["facility_user"]),
            )

            cur.execute(
                """
                INSERT INTO b2b_staffing_contracts (id, facility_id, contract_code, platform_commission_rate, facility_revenue_rate, start_date, end_date, status)
                VALUES (%s::uuid, %s::uuid, 'B2B-E2E-001', 15.00, 85.00, %s, %s, 'ACTIVE'::"B2bContractStatus")
                """,
                (IDS["b2b"], IDS["facility"], vn_today - dt.timedelta(days=180), vn_today + dt.timedelta(days=365)),
            )

            cur.execute(
                """
                INSERT INTO doctors (id, user_id, facility_id, doctor_name, specialty, experience_years, max_panel_capacity, active_panel_count, onboarding_status)
                VALUES (%s::uuid, %s::uuid, %s::uuid, 'BS. Trần Gia Đình E2E', 'Y học gia đình', 10, 5, 1, 'ACTIVE'::"DoctorOnboardingStatus")
                """,
                (IDS["doctor"], IDS["doctor_user"], IDS["facility"]),
            )

            cur.execute(
                """
                INSERT INTO service_packages (id, package_code, lineage_code, version, package_name, description, duration_months, base_price, included_members, max_members, additional_member_monthly_price, periodic_visits_quota, telehealth_quota, quota_period, video_quota_policy, status, published_at)
                VALUES (%s::uuid, 'E2E_RENEWAL_3M_V1', 'E2E_RENEWAL_3M', 1, 'Gói Gia Đình E2E 3 Tháng', 'Gói chăm sóc gia đình 3 tháng E2E', 3, 3500000, 4, 6, 200000, 3, 20, 'PER_TERM', 'FIXED', 'ACTIVE'::"ServicePackageStatus", now())
                """,
                (IDS["package"],),
            )

            families = [
                (IDS["family_a"], IDS["family_a_user"], "10 Đường A, Q1, TP.HCM", "0989000004"),
                (IDS["family_b"], IDS["family_b_user"], "20 Đường B, Q3, TP.HCM", "0989000005"),
                (IDS["family_c"], IDS["family_c_user"], "30 Đường C, Q5, TP.HCM", "0989000006"),
            ]
            for fid, rep_id, addr, phone in families:
                cur.execute(
                    """
                    INSERT INTO family_units (id, representative_user_id, home_address, emergency_phone)
                    VALUES (%s::uuid, %s::uuid, %s, %s)
                    """,
                    (fid, rep_id, addr, phone),
                )

            patients = [
                (IDS["patient_a1"], IDS["family_a"], "Nguyễn Văn A", "1985-05-10", "MALE", "SELF"),
                (IDS["patient_a2"], IDS["family_a"], "Trần Thị A2", "1988-08-20", "FEMALE", "SPOUSE"),
                (IDS["patient_b1"], IDS["family_b"], "Lê Thị B", "1990-01-15", "FEMALE", "SELF"),
                (IDS["patient_c1"], IDS["family_c"], "Phạm Văn C", "1982-03-22", "MALE", "SELF"),
            ]
            for pid, fid, pname, dob, gender, rel in patients:
                cur.execute(
                    """
                    INSERT INTO patients (id, family_id, full_name, date_of_birth, gender, relationship_to_head)
                    VALUES (%s::uuid, %s::uuid, %s, %s, %s::"Gender", %s)
                    """,
                    (pid, fid, pname, dob, gender, rel),
                )

            contracts = [
                (IDS["contract_a"], "MC-E2E-CASE-A", IDS["family_a"], a_start, a_end, "ACTIVE", 2, 9, 2),
                (IDS["contract_b"], "MC-E2E-CASE-B", IDS["family_b"], b_start, b_end, "EXPIRED", 0, 0, 1),
                (IDS["contract_c"], "MC-E2E-CASE-C", IDS["family_c"], c_start, c_end, "TERMINATED", 0, 0, 1),
            ]
            for cid, cnum, fid, sd, ed, cstatus, rhv, rt, mc in contracts:
                cur.execute(
                    """
                    INSERT INTO medical_contracts (
                      id, contract_number, family_id, facility_id, doctor_id, package_id,
                      total_amount, remaining_home_visits, remaining_telehealth,
                      start_date, end_date, contract_status, billing_snapshot, member_count, is_demo
                    ) VALUES (
                      %s::uuid, %s, %s::uuid, %s::uuid, %s::uuid, %s::uuid,
                      3500000, %s, %s, %s, %s, %s::"MedicalContractStatus", %s::jsonb, %s, true
                    )
                    """,
                    (cid, cnum, fid, IDS["facility"], IDS["doctor"], IDS["package"], rhv, rt, sd, ed, cstatus, json.dumps(snapshot), mc),
                )

            cur.execute("INSERT INTO contract_members (contract_id, patient_id) VALUES (%s::uuid, %s::uuid), (%s::uuid, %s::uuid)", (IDS["contract_a"], IDS["patient_a1"], IDS["contract_a"], IDS["patient_a2"]))
            cur.execute("INSERT INTO contract_members (contract_id, patient_id) VALUES (%s::uuid, %s::uuid)", (IDS["contract_b"], IDS["patient_b1"]))
            cur.execute("INSERT INTO contract_members (contract_id, patient_id) VALUES (%s::uuid, %s::uuid)", (IDS["contract_c"], IDS["patient_c1"]))

            conn.commit()

    return {
        "success": True,
        "ids": IDS,
        "password": E2E_PASSWORD,
        "dates": {
            "vn_today": vn_today.isoformat(),
            "a_end": a_end.isoformat(),
            "a_next_start": (a_end + dt.timedelta(days=1)).isoformat(),
            "b_end": b_end.isoformat(),
        },
        "emails": {
            "admin": "e2e.ren.admin@famidoc.test",
            "facility": "e2e.ren.facility@famidoc.test",
            "doctor": "e2e.ren.doctor@famidoc.test",
            "family_a": "e2e.ren.familya@famidoc.test",
            "family_b": "e2e.ren.familyb@famidoc.test",
            "family_c": "e2e.ren.familyc@famidoc.test",
        },
    }


def inspect() -> dict:
    fam_ids = [IDS["family_a"], IDS["family_b"], IDS["family_c"]]
    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, contract_number, family_id, contract_status, upgraded_from_id,
                       start_date::text, end_date::text, remaining_home_visits, remaining_telehealth,
                       member_count, documenso_envelope_id, hold_expires_at,
                       billing_snapshot->'renewalConfirmation' AS renewal_confirmation
                FROM medical_contracts
                WHERE family_id = ANY(%s::uuid[])
                ORDER BY created_at ASC
                """,
                (fam_ids,),
            )
            contracts = [dict(r) for r in cur.fetchall()]

            cur.execute(
                """
                SELECT cs.contract_id, cs.signer_role, cs.signer_user_id, cs.terms_hash, cs.ip_address
                FROM contract_signatures cs
                JOIN medical_contracts mc ON mc.id = cs.contract_id
                WHERE mc.family_id = ANY(%s::uuid[])
                """,
                (fam_ids,),
            )
            signatures = [dict(r) for r in cur.fetchall()]

            cur.execute(
                """
                SELECT cm.contract_id, cm.patient_id
                FROM contract_members cm
                JOIN medical_contracts mc ON mc.id = cm.contract_id
                WHERE mc.family_id = ANY(%s::uuid[])
                """,
                (fam_ids,),
            )
            members = [dict(r) for r in cur.fetchall()]

            cur.execute(
                """
                SELECT id, contract_id, invoice_code, payment_status
                FROM invoices
                WHERE contract_id IN (SELECT id FROM medical_contracts WHERE family_id = ANY(%s::uuid[]))
                """,
                (fam_ids,),
            )
            invoices = [dict(r) for r in cur.fetchall()]

            cur.execute(
                """
                SELECT user_id, type, title, reference_id
                FROM notifications
                WHERE user_id = ANY(%s::uuid[])
                """,
                ([IDS["family_a_user"], IDS["family_b_user"], IDS["doctor_user"], IDS["facility_user"]],),
            )
            notifications = [dict(r) for r in cur.fetchall()]

            cur.execute(
                "SELECT id, active_panel_count FROM doctors WHERE id = %s::uuid",
                (IDS["doctor"],),
            )
            doctor = dict(cur.fetchone() or {})

    return {
        "success": True,
        "contracts": contracts,
        "signatures": signatures,
        "members": members,
        "invoices": invoices,
        "notifications": notifications,
        "doctor": doctor,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["seed", "inspect", "cleanup"])
    args = parser.parse_args()
    if args.action == "seed":
        print(json.dumps(seed(), default=str))
    elif args.action == "inspect":
        print(json.dumps(inspect(), default=str))
    else:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cleanup(cur)
            conn.commit()
        print(json.dumps({"success": True}))


if __name__ == "__main__":
    main()
