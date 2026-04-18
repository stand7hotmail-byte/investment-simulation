# Adversarial Review: Affiliate Broker Admin Panel (SPEC-010)

**Date:** 2024-05-23
**Reviewer:** Elite Senior Software Engineer / Security Specialist
**Subject:** SPEC-010 Implementation Review

## Verdict: FAIL (CRITICAL SECURITY RISK)

The implementation fulfills the basic functional requirements of the CRUD operations, but it contains a critical security flaw: **The administrative endpoints are completely unprotected.**

---

## 1. Security Risks

### [CRITICAL] Unauthorized Access to Admin Endpoints
- **File:** `backend/app/main.py`
- **Endpoints:**
    - `GET /api/admin/affiliates`
    - `POST /api/admin/affiliates`
    - `PATCH /api/admin/affiliates/{broker_id}`
    - `DELETE /api/admin/affiliates/{broker_id}`
- **Finding:** These endpoints do not include any dependency for authentication or authorization (e.g., `get_current_user_id` or an admin-specific check). 
- **Impact:** Any person with the API URL can view, create, modify, or delete all affiliate brokers. This allows an attacker to:
    - Replace legitimate affiliate links with their own (revenue theft).
    - Insert malicious URLs (phishing/malware distribution).
    - Sabotage the application by deleting all broker data.
- **Severity:** Critical.

### [MEDIUM] Loosely Defined CORS Policy
- **File:** `backend/app/main.py`
- **Pattern:** `.*\.up\.railway\.app`
- **Finding:** While trying to be flexible for deployment, this regex allows *any* application hosted on Railway to perform cross-origin requests.
- **Impact:** A malicious site hosted on Railway could potentially interact with the API on behalf of a user if other session-based vulnerabilities exist.
- **Severity:** Medium.

### [LOW] Lack of Input Sanitization
- **File:** `backend/app/schemas.py`
- **Finding:** `affiliate_url` and `logo_url` are accepted as raw strings without validation for protocol (https) or character escaping.
- **Severity:** Low (mitigated by frontend frameworks like Next.js, but still a best-practice gap).

---

## 2. Logical Gaps & Edge Cases

### [MEDIUM] Region Inconsistency (Broken Recommendation Logic)
- **Scenario:** Admin creates a broker with region "US" or "Global" (lowercase).
- **Finding:** The recommendation logic in `main.py` expects exactly "JP" or "GLOBAL" (uppercase). The `crud.get_active_affiliates_by_region` function uses a strict equality check.
- **Impact:** Brokers created with non-standard region strings will never be shown to users, rendering the admin's work useless for those entries.
- **Severity:** Medium.

### [LOW] Duplicate Broker Entries
- **File:** `backend/app/models.py`
- **Finding:** No unique constraint on `name` or `affiliate_url`.
- **Impact:** DB bloat and UI confusion if the "Create" button is clicked multiple times or if the same broker is added under different regions without intent.
- **Severity:** Low.

### [LOW] Default Values in Frontend
- **File:** `frontend/src/app/admin/affiliates/page.tsx`
- **Finding:** The `handleAdd` function hardcodes defaults like "New Broker" and "JP". If the API call fails or is slow, multiple "New Broker" entries might be created if the user clicks the button repeatedly.
- **Severity:** Low.

---

## 3. Missing Scenarios in Tests

- **Unauthorized Access Test:** No test verifies that a non-admin user is rejected. (Because currently they aren't).
- **Schema Validation Tests:** No test verifies the behavior when `description` is not a list or when required fields are missing in the JSON payload.
- **Concurrent Update Test:** No test for what happens if two admins edit the same broker simultaneously (Last-write-wins is currently implemented, which is likely acceptable but should be noted).

---

## 4. Action Plan

1.  **Immediate Fix:** Add a `get_admin_user` dependency to all `/api/admin/*` endpoints in `backend/app/main.py`.
2.  **Schema Hardening:** Update `AffiliateBrokerCreate` and `AffiliateBrokerUpdate` to use an `Enum` or `Literal` for `region` to ensure consistency.
3.  **Frontend Improvement:** Add error toasts/notifications in `page.tsx` using the `onError` callback of `useMutation`.
4.  **Test Expansion:** Add a test file `backend/tests/test_affiliate_admin_security.py` to specifically verify that unauthorized requests return `401` or `403`.
5.  **Database Constraint:** Consider adding a unique constraint on `affiliate_url` in a future migration.
