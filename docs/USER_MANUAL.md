# 📘 Edumark — User Manual

End-to-end workflow for instructors: faculty setup, user management, templates, marking jobs, and results.

This manual assumes the stack is already running and you have at least the bootstrap Super User credentials. For installation see the [README](../README.md); for environment configuration see [ENV.md](ENV.md).

---

## Table of contents

- [Roles & hierarchy](#-roles--hierarchy)
- [First-time setup](#-first-time-setup-super-user)
- [Add users](#-add-users)
- [Verify, promote, or delete a user](#-verify-promote-or-delete-a-user)
- [Templates](#-templates)
- [Create a marking job](#-create-a-marking-job)
- [View, edit, and verify results](#-view-edit-and-verify-results)
- [Downloads](#-downloads)

---

## 👥 Roles & hierarchy

| Role | Capabilities |
|---|---|
| **Super User** | Manages faculties (create / edit / delete). Manages users across all faculties (verify, change role, delete). **Cannot** create templates or marking jobs. |
| **Faculty Admin** | Manages users within their own faculty (verify, change role, delete). Creates templates and marking jobs. |
| **Basic User** | Creates templates and marking jobs. No user-management permissions. Must be admin-verified before the system lets them in. |

Authentication is cookie-based. Refresh tokens auto-renew via Next.js middleware — you stay signed in until you click **Sign out** or your refresh token expires (default 7 days).

---

## 🚀 First-time setup (Super User)

1. Go to `https://<your-domain>/auth/signin`.
2. Sign in with the bootstrap super-user credentials configured at deploy time (`SUPER_USER_EMAIL` / `SUPER_USER_PASSWORD` in `.env.app` — see [ENV.md](ENV.md)).
<img width="1920" height="904" alt="Screenshot (285)" src="https://github.com/user-attachments/assets/6204ee54-c7e8-4794-9304-9820323adb42" />

3. Sidebar → **Settings** → **Faculties** tab → **Add Faculty** → enter the faculty name → **Create Faculty**. (Repeat for every faculty)
<img width="1920" height="936" alt="Screenshot (286)" src="https://github.com/user-attachments/assets/f863dcc5-efcc-40fd-96c4-f7cdf976f0ba" />

4. Create the first Faculty Admin for each faculty: follow [Admin adds a user](#a-admin-adds-a-user) below, then promote the new account to `Faculty Admin` per [Verify, promote, or delete a user](#-verify-promote-or-delete-a-user).

---

## 👤 Add users

Both paths create a `Basic User`, unverified. An admin must verify them before they can use the system.

### A. Admin adds a user

*Super User or Faculty Admin.*

<img width="1920" height="893" alt="Screenshot (288)" src="https://github.com/user-attachments/assets/ac442816-e186-4c04-a123-381ea044395f" />

1. Sidebar → **Users** → **Add New User**.
2. Fill: First name, Last name, Email, Password (≥ 8 chars), Confirm password, **Faculty**.

3. **Create User**.

### B. Self-registration

*Anyone.*

<img width="1920" height="922" alt="Screenshot (289)" src="https://github.com/user-attachments/assets/f9e7755a-44cb-40db-bbdd-d0b5b25b40aa" />

1. From the sign-in page, click **Register**.
2. Fill the same fields and pick a faculty.
3. Submit. The account is created in the pending state.

---

## ✅ Verify, promote, or delete a user

Performed by the Super User, or the Faculty Admin of the user's own faculty.

<img width="1920" height="930" alt="Screenshot (291)" src="https://github.com/user-attachments/assets/86e6d5b0-16b6-4653-ad85-69f3e926ce99" />


1. Sidebar → **Users**.
2. Optional: filter by role or status (e.g. `Unverified`).
3. Row actions:
   - **Verify** → confirm. Status becomes `Admin Verified`; the user can now sign in.
   - **Toggle / change role** → choose `Basic User` or `Faculty Admin` (Super User only).
   - **Delete** → delete user
.

---

## 📐 Templates

Two distinct flows. Both require a **verified** Faculty Admin or Basic User. The Super User does **not** see these menu items.

### 5a. Generate a blank template (PDF)

Use this when you don't yet have a printed answer sheet.

<img width="1920" height="940" alt="Screenshot (309)" src="https://github.com/user-attachments/assets/c980270b-10ca-4754-804f-cefcdae3245c" />


1. Sidebar → **Generate Template**.
2. Fill:
   - **Template Title**.
   - **Number of Questions** (1–200).
   - **Options per Question** (2–10).
   - *Advanced* → **Max Questions per Column** (default 30) — controls layout density.
3. Click **Generate Template**. The PDF appears in the preview pane.
4. Click **Download**. Print copies for your candidates.

### 5b. Add (upload) a template

Use this when you already have a printed answer-sheet design and want the system to recognise it.


<img width="1920" height="929" alt="Screenshot (294)" src="https://github.com/user-attachments/assets/596dd338-31ee-4637-ab76-e6fe39a7488c" />


1. Sidebar → **My Templates** → **New Template**.

<img width="1920" height="933" alt="Screenshot (295)" src="https://github.com/user-attachments/assets/4c7ef016-1d1c-4c34-894f-3681e793a4f8" />

2. Fill:
   - **Template Name** (required).
   - **Description** (optional).
   - **Configuration Type**: `Grid Based` (uniform grid) or `Cluster Based` (irregular — per-column row counts).
   - *Cluster Based only*: **Number of Columns**, **Options per Question**, and **Rows per Column** (one number per column).
3. **Upload Template Image**:
   - **Accepted formats**: PNG, JPG, JPEG.
   - **Max size**: 10 MB.
   - Use a clean scan of a **blank** answer sheet.
4. Click **Create Template**. Wait a few seconds for backend bubble detection.

<img width="1920" height="900" alt="Screenshot (296)" src="https://github.com/user-attachments/assets/482e11db-0213-4fcf-9dc1-d45239fe4a3d" />

5. The **bubble verification** view opens:
   - Green dots overlay every detected bubble on the image.
   - **Grid Based**: drag any green bubble to shift its **entire column**; fine-tune with the **X Offset** and **Y Offset** sliders.
   - **Cluster Based**: drag bubbles individually.
6. When the grid lines up with the printed bubbles, click **Save & Continue**.
   - Use **Edit Configuration** only if you want to discard this template and re-upload from scratch.
7. You return to **My Templates**. The template is now selectable in marking jobs.

---

## 🧾 Create a marking job

Sidebar → **Marking Jobs** → **New Marking Job**
<img width="1920" height="921" alt="Screenshot (297)" src="https://github.com/user-attachments/assets/a1e101d9-c47a-4926-af13-7b3a7de4e569" />

### Step 1 — Job metadata

<img width="1920" height="939" alt="Screenshot (298)" src="https://github.com/user-attachments/assets/4ea57dbd-670c-47cd-a7f0-b0abc45bb042" />

- **Job Name** (required).
- **Description** (optional).
- **Priority**: `Normal` or `Urgent`.
- **Template**: dropdown of *configured* templates (only templates whose bubble-verification step is complete).
- **Save Audit Copy** (checkbox): when checked, every student's annotated image is preserved and downloadable later as an audit ZIP.

### Step 2 — Marking scheme
<img width="1920" height="946" alt="Screenshot (300)" src="https://github.com/user-attachments/assets/6ababeb8-de4f-4949-8dad-1b3f4dbae76b" />

Upload a **filled** copy of the answer sheet — one where you have shaded the *correct* answers. It acts as the answer key.

- **Accepted formats**: JPG, JPEG, PNG (single image).
- **Max size**: 10 MB.

Then:

1. Click **Configure Marking Scheme**. The system extracts bubble fills.

<img width="1920" height="917" alt="Screenshot (301)" src="https://github.com/user-attachments/assets/b02b9dee-ec03-4602-9b02-68245baa6c0b" />

2. Click **Verify Configuration**. A modal opens showing the scheme image with detected fills overlaid.
3. Click any bubble to toggle on/off if the detection is wrong. Footer shows `X of Y bubbles marked`.
4. Click **Verify** to save.

### Step 3 — Answer sheets

<img width="1920" height="933" alt="Screenshot (303)" src="https://github.com/user-attachments/assets/fe60c9fe-da4f-4728-961d-3259b6f41cc1" />

**Answer Sheets** (required)

- **Accepted format**: ZIP only.
- **Max size**: 500 MB.
- **Contents**: one image per student (JPG or PNG). Internal filenames don't matter — student identity comes from the written index number on each sheet.

**Index List** (optional, strongly recommended)

- **Accepted formats**: `.csv`, `.xlsx`.
- **Max size**: 5 MB.
- **Required column**: exactly one column named **`Index No`** containing the list of valid student index numbers. Other columns are ignored.
- When provided, OCR-detected indices are matched against this list; mismatches are **flagged** for review.

Click **Start Marking Process**. Status flows `Queued → Processing → Completed`. Live progress is streamed to the marking-jobs list via WebSocket.

### Marking-jobs list
<img width="1920" height="643" alt="Screenshot (304)" src="https://github.com/user-attachments/assets/3a057d66-71cb-4425-bf3d-3601cf533071" />

Sidebar → **Marking Jobs**. Columns: Job Name (+ID), Template, Status, Progress, Created.

Per-row actions:

- **View Results** — open the results page.
- **Edit** — modify metadata (only useful before marking starts).
- **Pause** — pause an ongoing marking job
- **Delete** — delete a marking job.

---

## 🔍 View, edit, and verify results

From the marking-jobs list, click **View Results** on a completed job.

The results table has one row per student with: Index No, Correct, Incorrect, More than one marked, Not marked, Score, Flag.
<img width="1920" height="936" alt="Screenshot (307)" src="https://github.com/user-attachments/assets/ec7e9b41-f41d-44b9-bf94-9cc56858601a" />

### Flag states

| Badge | Meaning |
|---|---|
| *(none)* | Clean row — no detected issues. |
| 🔴 **Flagged** | Issue detected: ambiguous index number, more than one bubble marked on a question, or unusual mark patterns. Hover for the reason. |
| 🟢 **Resolved** | Was flagged, then reviewed and confirmed by a user. Hover to see the original reason. |

### Edit a row

<img width="1920" height="918" alt="Screenshot (308)" src="https://github.com/user-attachments/assets/fe574936-8258-4d4e-9db9-40b6f89066c4" />

1. Click **View Paper** on the row. The Answer Sheet modal opens — scanned image on the left, result data on the right.
2. Click **Edit**.
3. Fix the **Index Number** if mis-recognised, or click bubbles on the image to toggle them. Correct picks turn green, wrong picks red. Counts and score recompute live.
4. For **flagged** rows only: in the **Resolution** sub-section, check **Mark this row as resolved** if the issue is fixed.
5. Click **Save**.
6. If the row was flagged and wasn't already resolved when you saved, a confirmation modal appears: **Mark as Resolved?** Choose **Mark resolved** or **Not now**.

The row's flag badge in the results table updates immediately.

---

## 📥 Downloads

From the results page header.

- **Download Results** *(always available)*: XLSX with one row per student. Columns: `Index No`, `Correct`, `Incorrect`, `More than one marked`, `Not marked`, `Score`, `Flag`, `Flag Reason`, **`Resolved`** (TRUE / FALSE). Open in Excel, LibreOffice Calc, or Google Sheets.
- **Download Audit** *(visible only when Save Audit Copy was ticked at job creation)*: ZIP containing the results XLSX, the template image, the marking-scheme image, and one annotated answer-sheet image per student showing the bubbles the system identified.
