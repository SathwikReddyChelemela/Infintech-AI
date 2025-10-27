# Infintech AI 

## Overview
Infintech AI is a modern, full-stack insurance and financial technology platform designed to simplify insurance management, comparison, and support using advanced AI. The project leverages a microservices architecture, secure JWT authentication, a React frontend, FastAPI backend, Dockerized deployment, and integrated LLM-powered chat support.

---

## Architecture & Flow
- **Frontend:** React (Material UI, custom dark theme)
- **Backend:** FastAPI (Python)
- **Microservices:** Modular services for authentication, chat, document management, and business logic
- **Database:** MongoDB Atlas
- **Deployment:** Docker (multi-container), Render
- **LLM Chat:** Integrated support chat using Groq LLM with fallback to rule-based responses

### User Flow
1. **Landing & Welcome:** Users are greeted with a modern, branded UI and can read about the platform.
2. **Authentication:** Secure login/signup using JWT tokens. Loading progress bar for slow/cold starts.
3. **Role-Based Dashboards:** Admin, Analyst, Customer, Underwriter, and Support roles with tailored homepages and workflows.
4. **Insurance Management:** Users can view, compare, and manage insurance products (auto, health, life, property, etc.).
5. **Document Upload & Verification:** Secure upload and verification of insurance documents.
6. **LLM Chat Support:** Users can access AI-powered support for insurance/financial queries, with blue-accented chat UI.

---

## JWT Authentication
- **JWT (JSON Web Token):** Used for stateless, secure authentication across all services.
- **Token Storage:** Securely stored in HTTP-only cookies/localStorage.
- **Protected APIs:** All sensitive endpoints require valid JWTs; role-based access enforced.
- **Token Refresh:** Support for token refresh and session management.

---

## APIs & Microservices
- **FastAPI:** High-performance Python API framework for all backend services.
- **Service Modules:**
  - `auth`: Handles registration, login, JWT issuance, and user management
  - `chat`: LLM and rule-based support chat
  - `docs`: Document upload, storage, and verification
  - `routes`: Business logic for insurance workflows
  - `services`: Application and document services
- **API Docs:** Interactive Swagger UI available at `/docs` when running locally

---

## LLM Chat Support
- **Groq LLM Integration:** Real-time, AI-powered support for insurance and financial queries
- **Fallback:** Rule-based responses if LLM is unavailable
- **Frontend:** Blue-accented chat dialog, persistent history, and clear user/AI separation
- **Backend:** FastAPI route for chat, with environment-based LLM key management

---

## Frontend (React)
- **Material UI:** Custom black/blue theme, Inter font, elegant cards and buttons
- **Role-Based Routing:** Dynamic homepages and navigation for each user type
- **Progress Feedback:** Animated loading bar for login/auth
- **Responsive Design:** Works across desktop and mobile

---

## Backend (FastAPI)
- **Microservices:** Modular, maintainable codebase with clear separation of concerns
- **MongoDB Atlas:** Cloud database for user, policy, and document data
- **Environment Variables:** `.env` for API keys, DB URIs, and LLM config
- **Logging:** Centralized server logs for debugging and monitoring

---

## Docker & Deployment
- **Docker Compose:** Multi-container setup for backend, frontend, and database
- **Production Ready:** Easily deployable to Render, AWS, or any Docker-compatible host
- **Environment Management:** Secure secrets and config via environment variables

---

## Concepts & Best Practices
- **Security:** JWT, HTTPS, CORS, and secure storage
- **Scalability:** Microservices, stateless APIs, and containerization
- **Extensibility:** Modular code, easy to add new insurance products or roles
- **AI Integration:** LLM support for user queries, fallback to rules for reliability
- **User Experience:** Modern UI, clear feedback, and accessible design

---

## Getting Started
1. Clone the repo and review the `/client-react` and `/server` folders
2. Set up your `.env` files for backend and frontend
3. Use Docker Compose or run services individually
4. Access the app at `localhost:3000` (frontend) and `localhost:8000` (backend)
5. Explore the API docs at `/docs` (FastAPI)

---

## More Information
- See the `/server` folder for backend code and service modules
- See the `/client-react` folder for React frontend
- See the various `*_GUIDE.md` and `*_WORKFLOW.md` files for detailed implementation and troubleshooting

---

## Project Structure & Key Files

```
medicalAssistant-main/
│
├── assets/                  # Project diagrams, images, and PDFs
│   ├── applicationFlow.png
│   ├── coreModules.png
│   └── ...
│
├── client-react/            # React frontend app
│   ├── Dockerfile
│   ├── package.json
│   ├── public/              # Static assets (index.html, icons, etc.)
│   ├── src/                 # Main React source code
│   │   ├── App.js, index.js, theme.js
│   │   ├── components/      # All UI components
│   │   │   ├── Auth.js, WelcomePage.js, SupportChatDialog.js, ...
│   │   │   └── (role-based dashboards, forms, dialogs)
│   │   └── ...
│   └── ...
│
├── server/                  # FastAPI backend
│   ├── Dockerfile
│   ├── main.py              # FastAPI entrypoint
│   ├── requirements.txt
│   ├── auth/                # Auth microservice (JWT, utils, routes)
│   ├── chat/                # LLM chat microservice
│   ├── config/              # DB config
│   ├── docs/                # Document management
│   ├── routes/              # Business logic routes (admin, analyst, etc.)
│   ├── services/            # Application & document services
│   ├── uploaded_docs/       # Uploaded user documents
│   └── ...
│
├── docker-compose.yml       # Multi-container orchestration
├── requirements.txt         # Top-level Python dependencies
├── *.md                     # Documentation, guides, and workflow files
│
└── README.md                # Project overview and documentation
```

### Notable Documentation & Guides
- `ADMIN_SETUP.md`, `ANALYST_REVIEW_WORKFLOW.md`, `AUTH_FIX_GUIDE.md`, etc.: Step-by-step guides for setup, workflows, and troubleshooting
- `JWT_AUTHENTICATION_GUIDE.md`, `JWT_QUICK_START.md`: JWT usage and integration
- `DOCKER.md`: Docker usage and deployment
- `PROJECT_SUMMARY.md`, `IMPLEMENTATION_SUMMARY.md`: High-level project and implementation details
- `TROUBLESHOOTING_GUIDE.md`: Common issues and solutions
- `WORKFLOW_DIAGRAMS.md`: Visual diagrams of system flows

### Key Concepts by Folder
- **assets/**: Visuals and reference documents
- **client-react/src/components/**: All React UI components, including role-based dashboards, authentication, chat, and forms
- **server/auth/**: JWT logic, password hashing, and authentication routes
- **server/chat/**: LLM and rule-based chat logic
- **server/docs/**: Document upload, search, and vector storage
- **server/routes/**: All API endpoints for different user roles and workflows
- **server/services/**: Core business logic for applications and document verification

---

## Future Works

- **Java Spring Server:**
  - Build a new backend server using Java Spring to add advanced features such as centralized logging, system health monitoring, and enterprise-grade integrations.
  - Enable seamless interoperability between the existing FastAPI services and the new Java-based modules.

- **Additional Microservices:**
  - Expand the microservices architecture to include more specialized services (e.g., analytics, notifications, audit trails, payment processing).
  - Improve scalability, maintainability, and fault tolerance by further decoupling business logic.

- **More Functionalities:**
  - Add advanced insurance product comparison tools, personalized recommendations, and financial planning modules.
  - Enhance LLM chat support with multilingual capabilities and deeper insurance/finance expertise.
  - Integrate real-time system health dashboards and user activity analytics.
  - Support for more user roles and workflow automation.

---


