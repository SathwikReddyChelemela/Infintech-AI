from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from auth.routes import get_current_user

router = APIRouter()


def _serialize_dt(dt):
    if dt is None:
        return None
    try:
        return dt.isoformat()
    except Exception:
        return str(dt)


def _sanitize(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return doc
    d = dict(doc)
    d.pop('_id', None)
    if 'created_at' in d:
        d['created_at'] = _serialize_dt(d['created_at'])
    if 'updated_at' in d:
        d['updated_at'] = _serialize_dt(d['updated_at'])
    return d


@router.get("/dashboard")
async def auditor_dashboard(user=Depends(get_current_user)):
    """Auditor dashboard: overview stats, recent events, integrity/compliance snapshot"""
    if user["role"] != "auditor":
        raise HTTPException(status_code=403, detail="Only auditors can access this dashboard")

    try:
        from config.db import (
            audit_events_collection,
            applications_collection,
            users_collection,
        )

        total_audit_events = audit_events_collection.count_documents({})
        total_users = users_collection.count_documents({})
        total_applications = applications_collection.count_documents({})

        # recent audit events
        recent = list(audit_events_collection.find({}, sort=[("created_at", -1)], limit=20))
        recent = [_sanitize(a) for a in recent]

        # simple integrity checks on a sample of apps
        sample_apps = list(applications_collection.find({}, sort=[("created_at", -1)], limit=200))
        missing_trail = 0
        for app in sample_apps:
            app_id = app.get("id")
            if not audit_events_collection.find_one({"application_id": app_id}):
                missing_trail += 1

        # Compliance snapshot
        # - ensure audit events have required fields and timestamps
        issues: List[Dict[str, Any]] = []
        check_sample = list(audit_events_collection.find({}, sort=[("created_at", -1)], limit=200))
        for ev in check_sample:
            if not ev.get("action"):
                issues.append({"type": "missing_field", "field": "action", "id": ev.get("id")})
            if not ev.get("actor_role"):
                issues.append({"type": "missing_field", "field": "actor_role", "id": ev.get("id")})
            if 'created_at' not in ev or ev.get('created_at') is None:
                issues.append({"type": "missing_field", "field": "created_at", "id": ev.get("id")})

        compliance = {
            "data_integrity_ok": missing_trail == 0,
            "required_fields_ok": len([i for i in issues if i.get("type") == "missing_field"]) == 0,
            "total_issues": len(issues)
        }

        return {
            "stats": {
                "total_users": total_users,
                "total_applications": total_applications,
                "total_audit_events": total_audit_events,
                "applications_missing_audit_trail_sample": missing_trail,
            },
            "recent_events": recent,
            "compliance": compliance,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching auditor dashboard: {str(e)}")


@router.get("/audit-events")
async def list_audit_events(
    user=Depends(get_current_user),
    limit: int = Query(100, ge=1, le=2000),
    action: Optional[str] = None,
    actor_role: Optional[str] = None,
    application_id: Optional[str] = None,
):
    """List audit events with basic filters and pagination"""
    if user["role"] != "auditor":
        raise HTTPException(status_code=403, detail="Only auditors can list audit events")

    try:
        from config.db import audit_events_collection
        q: Dict[str, Any] = {}
        if action:
            q["action"] = action
        if actor_role:
            q["actor_role"] = actor_role
        if application_id:
            q["application_id"] = application_id

        events = list(audit_events_collection.find(q, sort=[("created_at", -1)], limit=limit))
        events = [_sanitize(e) for e in events]
        return {"events": events, "count": len(events)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing audit events: {str(e)}")


@router.get("/application/{application_id}/audit")
async def get_application_audit(application_id: str, user=Depends(get_current_user)):
    """Get audit trail for a specific application"""
    if user["role"] != "auditor":
        raise HTTPException(status_code=403, detail="Only auditors can view application audit")

    try:
        from config.db import audit_events_collection
        events = list(audit_events_collection.find({"application_id": application_id}, sort=[("created_at", 1)]))
        events = [_sanitize(e) for e in events]
        return {"application_id": application_id, "events": events}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching application audit: {str(e)}")


@router.get("/integrity-check")
async def run_integrity_check(user=Depends(get_current_user)):
    """Run integrity checks and return any detected issues"""
    if user["role"] != "auditor":
        raise HTTPException(status_code=403, detail="Only auditors can run integrity checks")

    try:
        from config.db import applications_collection, audit_events_collection
        issues: List[Dict[str, Any]] = []

        # Applications with no audit events
        recent_apps = list(applications_collection.find({}, sort=[("created_at", -1)], limit=500))
        for app in recent_apps:
            app_id = app.get("id")
            if not audit_events_collection.find_one({"application_id": app_id}):
                issues.append({
                    "type": "missing_audit_trail",
                    "application_id": app_id
                })

        # Events missing required fields (sample)
        sample_events = list(audit_events_collection.find({}, sort=[("created_at", -1)], limit=500))
        for ev in sample_events:
            if not ev.get("action"):
                issues.append({"type": "missing_field", "field": "action", "id": ev.get("id")})
            if not ev.get("actor_role"):
                issues.append({"type": "missing_field", "field": "actor_role", "id": ev.get("id")})
            if 'created_at' not in ev or ev.get('created_at') is None:
                issues.append({"type": "missing_field", "field": "created_at", "id": ev.get("id")})

        return {"issues": issues, "count": len(issues)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error running integrity check: {str(e)}")
