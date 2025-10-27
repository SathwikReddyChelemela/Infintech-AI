from pydantic import BaseModel

class SignupRequest(BaseModel):
    username: str
    password: str
    role: str
    security_code: str | None = None

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict