import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from auth.routes import get_current_user

# Note: We will resolve GROQ_* on each request to allow hot-reload via .env

router = APIRouter()


class SupportMessage(BaseModel):
    message: str


def _normalize(text: str) -> str:
    return (text or "").lower()


# -------- Unified: Local context retrieval (was docs/context_search.py) --------
from typing import List, Tuple

PROJECT_ROOT = Path(__file__).resolve().parents[2]


def _candidate_files() -> List[Path]:
    names = [
        "README.md",
        "QUICK_START_GUIDE.md",
        "JWT_AUTHENTICATION_GUIDE.md",
        "JWT_QUICK_START.md",
        "AUTHENTICATION_FIX.md",
        "AUTH_FIX_GUIDE.md",
        "REVIEW_BUTTON_FIX.md",
        "REVIEW_BUTTON_DEBUGGING.md",
        "ANALYST_WORKFLOW_IMPLEMENTATION.md",
        "ANALYST_REVIEW_WORKFLOW.md",
        "REALTIME_STATUS_TRACKING.md",
        "IMPLEMENTATION_SUMMARY.md",
        "PROJECT_SUMMARY.md",
        "TROUBLESHOOTING_GUIDE.md",
        "DOCUMENTATION_INDEX.md",
        "ADMIN_SETUP.md",
        "MONGODB_QUICK_REFERENCE.md",
        "MONGODB_ATLAS_COLLECTIONS.md",
        "HIGH_VALUE_INSURANCE_IMPLEMENTATION.md",
        "TEST_REVIEW_BUTTON.md",
        "TEST_DATA_SAMPLES.md",
        "WORKFLOW_DIAGRAMS.md",
    ]
    files: List[Path] = []
    for n in names:
        p = PROJECT_ROOT / n
        if p.exists():
            files.append(p)
    return files


def _read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""


def _split_sections(text: str) -> List[Tuple[str, str]]:
    lines = text.splitlines()
    sections: List[Tuple[str, str]] = []
    buf: List[str] = []
    title = "Intro"
    for ln in lines:
        if ln.strip().startswith("#"):
            if buf:
                sections.append((title, "\n".join(buf).strip()))
                buf = []
            title = ln.strip().lstrip("# ")
        else:
            buf.append(ln)
    if buf:
        sections.append((title, "\n".join(buf).strip()))
    return sections


def _score(section: str, query_tokens: List[str]) -> int:
    text = section.lower()
    score = 0
    for tok in query_tokens:
        if not tok:
            continue
        score += text.count(tok)
    return score


def get_context_snippets(query: str, max_chars: int = 1800, max_sections: int = 6) -> str:
    q = (query or "").lower()
    tokens = [t for t in [w.strip(".,:;!?()[]{}\"'`)\n\t ") for w in q.split()] if len(t) > 2]
    if not tokens:
        return ""
    ranked: List[Tuple[int, str]] = []
    for path in _candidate_files():
        content = _read(path)
        if not content:
            continue
        for title, sec in _split_sections(content):
            s = _score(sec, tokens)
            if s > 0:
                header = f"From {path.name} > {title}:\n"
                snippet = header + sec
                ranked.append((s, snippet))
    if not ranked:
        return ""
    ranked.sort(key=lambda x: x[0], reverse=True)
    pieces: List[str] = []
    used = 0
    for _, snip in ranked[: max_sections * 3]:
        if used + len(snip) + 2 > max_chars:
            break
        pieces.append(snip)
        used += len(snip) + 2
    return "\n\n---\n\n".join(pieces)


# -------- Unified: Simple vectorstore upload (was docs/vectorstore.py) --------
UPLOAD_DIR = "./uploaded_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)


async def load_vectorstore(uploaded_files, role: str, doc_id: str):
    """Store uploaded files locally (embeddings removed in this build)."""
    for file in uploaded_files:
        save_path = Path(UPLOAD_DIR) / file.filename
        with open(save_path, "wb") as f:
            f.write(file.file.read())
    return {"saved": True, "count": len(uploaded_files), "doc_id": doc_id, "role": role}


def _build_response(message: str, role: str) -> str:
    q = _normalize(message)

    # Common intents
    if any(k in q for k in ["status", "application status", "track", "timeline"]):
        return (
            "You can check your Application Status from the dashboard.\n"
            "- Customers: Home > Application Status tab, or search by Application ID.\n"
            "- Analysts/Underwriters: Use your dashboard’s case queues to view status."
        )

    if any(k in q for k in ["upload", "document", "file", "attach"]):
        if role == "customer":
            return (
                "To upload documents: Start an application and use the ‘Upload Requested Documents’ area.\n"
                "Supported types: PDF/JPG/PNG. Max size limits may apply."
            )
        if role == "admin":
            return (
                "Admins can manage knowledge or verification documents via the admin or docs endpoints.\n"
                "If you need bulk ingestion, coordinate with the backend team."
            )
        return (
            "Upload guidance depends on your role. Customers attach docs in their application.\n"
            "Analysts/Underwriters review documents attached to each application."
        )

    if any(k in q for k in ["login", "auth", "jwt", "token"]):
        return (
            "Authentication uses JWT. Login via the app, the token is stored client-side and sent on each API call.\n"
            "If your token expires, re-login to continue."
        )

    if any(k in q for k in ["review", "analyst", "underwriter", "approve", "decline"]):
        return (
            "Workflow overview: Customer submits -> Analyst review -> Underwriter decision.\n"
            "Analysts verify info and mark cases ready; Underwriters set the final decision and premium."
        )

    if any(k in q for k in ["error", "bug", "issue", "fail", "problem"]):
        return (
            "Please share a brief description and any error message you see.\n"
            "You can also check the Troubleshooting Guide in the repo for common fixes."
        )

    # Role-specific quick help
    if role == "analyst" and any(k in q for k in ["queue", "cases", "ready", "inputs"]):
        return (
            "Analyst queue shows submitted applications. Use the review dialog to add notes and mark input_ready."
        )
    if role == "underwriter" and any(k in q for k in ["risk", "premium", "decision"]):
        return (
            "Underwriters can open a case, view risk/context, and make a decision (approve/decline/pend) with premium."
        )
    if role == "admin" and any(k in q for k in ["users", "reset", "database", "manage"]):
        return (
            "Admins can manage users and data. Use the admin routes or dashboards; database reset is restricted to admins."
        )

    # Default fallback
    return (
        "Hi! I can help with application status, document uploads, workflow steps, and authentication.\n"
        "Try asking: ‘How do I check my application status?’ or ‘How to upload documents?’"
    )


@router.post("/chat")
def support_chat(payload: SupportMessage, user=Depends(get_current_user)):
    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message is required")
    role = user.get("role", "user")

    # Deterministic reply for name inquiries
    lower_msg = payload.message.strip().lower()
    if any(k in lower_msg for k in [
        "your name",
        "what is your name",
        "what's your name",
        "whats your name",
        "who are you",
        "name?",
        "name"
    ]):
        return {"answer": "Infintech AI developed by Sathwik Reddy Chelemela."}

    # Deterministic reply for model inquiries (before LLM), to avoid ambiguity
    if any(k in lower_msg for k in ["which model", "what model", "model are you using", "groq model", "llama model", "using now?"]):
        # Ensure latest env
        load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env", override=True)
        groq_api_key = os.getenv("GROQ_API_KEY")
        model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        if groq_api_key:
            return {"answer": f"Groq model: {model}"}
        else:
            return {"answer": "Rule-based support (LLM disabled)."}

    # Reload .env on each request so new GROQ_* values take effect without restart
    load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env", override=True)

    # If Groq is configured, use LLM with a constrained system prompt and retrieved context
    groq_api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "llama-3.1-70b-versatile")
    if groq_api_key:
        try:
            from groq import Groq  # type: ignore

            client = Groq(api_key=groq_api_key)

            context = get_context_snippets(payload.message)
            identity_line = "Identity: Infintech AI developed by Sathwik Reddy Chelemela."
            # Always include identity inside the LLM context; append doc snippets if available
            ctx_text = identity_line + (f"\n\n{context}" if context else "")
            context_block = f"\n\nContext (use if relevant):\n{ctx_text}\n"
            identity_block = "\n\nIdentity: Infintech AI developed by Sathwik Reddy Chelemela.\n"

            system_prompt = (
                "You are a concise support assistant for an insurance app (health, auto, home, life, and more). "
                "Answer briefly (<= 3 sentences) and avoid hallucinations. "
                "Do not assume medical-only; keep guidance applicable across insurance lines and adapt to any user-provided context. "
                "Use these rules when applicable: "
                "1) Status: Direct users to dashboard status areas by role. "
                "2) Upload: Customers upload in application; staff review attachments. "
                "3) Auth: JWT-based login; re-login on expiry. "
                "4) Workflow: Customer -> Analyst -> Underwriter. "
                f"User role: {role}."
                f"{identity_block}"
                f"{context_block}"
            )
            user_msg = payload.message.strip()

            resp = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_msg},
                ],
                temperature=0.2,
                max_tokens=256,
            )
            text = (resp.choices[0].message.content or "").strip()
            if text:
                return {"answer": text}
            # If empty, fall through to rule-based
        except Exception:
            # Fall back silently to rule-based on any LLM error
            pass

    # Fallback rule-based support with best-effort context snippet
    answer = _build_response(payload.message, role)
    ctx = get_context_snippets(payload.message, max_chars=600, max_sections=2)
    identity_line = "Identity: Infintech AI developed by Sathwik Reddy Chelemela."
    if ctx:
        answer = answer + "\n\nReference:\n" + identity_line + "\n\n" + ctx
    else:
        answer = answer + "\n\n" + identity_line
    return {"answer": answer}
