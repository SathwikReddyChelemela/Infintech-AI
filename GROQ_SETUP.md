# Optional Groq LLM Integration

This app supports an optional Groq-backed support chatbot. If not configured, the existing rule-based replies are used.

## Configure

1. Install server dependencies:
   - In the `server` environment, install pip packages from `requirements.txt` (includes `groq`).

2. Set variables in `server/.env` (single env file used by the app):
   - `GROQ_API_KEY` (required to enable LLM)
   - `GROQ_MODEL` (optional, default: `llama3-70b-8192`). Other options include `mixtral-8x7b-32768`.

Example `server/.env`:

```
GROQ_API_KEY=<your_api_key>
GROQ_MODEL=llama3-70b-8192
```

## Behavior
- When `GROQ_API_KEY` is set, `/support/chat` calls the Groq chat completion API with a tight system prompt.
- On any error or if the key is missing, it falls back to the built-in rule-based responses.
- No PII or secrets beyond the user message/role are sent.

## Frontend
No changes needed. The React `SupportChatDialog` posts to `/support/chat` the same way.

## Safety & Limits
- Responses are constrained to be concise and aligned with the app’s documented behaviors.
- Temperature=0.2 and max_tokens=256 to reduce drift and cost.

