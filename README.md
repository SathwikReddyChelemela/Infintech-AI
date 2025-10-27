# 🏥 RBAC-based Insurance Workflow System

A secure, role-based access control (RBAC) system for insurance workflows, powered by FastAPI and MongoDB.

![Thumbnail](./assets/thumbnail.png)

## 🧠 Overview

This project manages insurance applications end-to-end with role-based dashboards for Customers, Analysts, Underwriters, and Admins.

---

![Application Flow](./assets/applicationFlow.png)

![Core Modules](./assets/coreModules.png)

[📄 View Full Project Report (PDF)](./assets/projectReport.pdf)

---

## Deployed URL :

![Frontend] https://rbac-medicalassistant-vbs9bxxzjfnpab6dsrfwah.streamlit.app/
![Backend] https://rbac-medicalassistant.onrender.com

## ⚙️ Tech Stack

- Backend: FastAPI (modular)
- Database: MongoDB Atlas
- Authentication: JWT
- Frontend: React + MUI

---

## 🧩 Core Modules

| Module      | Responsibility                                              |
| ----------- | ----------------------------------------------------------- |
| `auth/`     | Handles authentication (signup, login), hashing with bcrypt |
| `chat/`     | Removed                                                      |
| `vectordb/` | Document loading and chunking (local processing)            |
| `database/` | MongoDB setup and user operations                           |
| `main.py`   | Entry point for FastAPI app with route inclusion            |

---

## 🔐 Role-Based Access Flow

- **Admin:** Uploads documents and assigns roles.
- **Doctor/Nurse:** Retrieves clinical documents specific to their role.
- **Patient:** Can query general medical info (restricted access).
- **Other/Guest:** Limited access to public health content.

---

## 📡 API Endpoints

| Method | Route          | Description                         |
| ------ | -------------- | ----------------------------------- |
| POST   | `/signup`      | Register new users                  |
| GET    | `/login`       | Login with HTTP Basic Auth          |
| POST   | `/upload_docs` | Admin-only endpoint to upload files |
| POST   | `/chat`        | Removed                             |

---

## 🚀 Getting Started

1. Clone the repo:

   ```bash
   git clone https://github.com/yourusername/rbac-medicalAssistant.git
   cd rbac-medicalAssistant
   ```

2. Create a single env file at `server/.env` (copy from `server/.env.example`):

    - Required:
       - MONGO_URI
       - DB_NAME
       - JWT_SECRET_KEY
    - Optional (to enable Groq LLM in support chat):
       - GROQ_API_KEY
       - GROQ_MODEL (defaults to llama3-70b-8192)

3. Create venv:

   ```bash
   uv venv
   .venv/Scripts/activate
   ```

4. Install dependencies:

   ```bash
   uv pip install -r requirements.txt
   ```

5. Run the app:

   ```bash
   uvicorn main:app --reload
   ```

---

## 🌱 Future Enhancements

- Document download/preview functionality
- Audit logs and compliance reporting
- Performance dashboards and alerts

---

© 2025 \[Supratim / sn dev] — All rights reserved.

---
