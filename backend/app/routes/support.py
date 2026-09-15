from fastapi import APIRouter, Depends

from app.security import require_victim

router = APIRouter(tags=["Support services"])


@router.get("/support-services")
def support_services(_: dict = Depends(require_victim)):
    """Demo catalogue. Real deployments must use verified local service directories."""
    return [
        {"id": "counselling", "name": "Counselling support", "description": "A trained support professional can discuss the next step with you.", "availability": "By human referral"},
        {"id": "medical", "name": "Medical support", "description": "A reviewer can help connect you with appropriate healthcare services.", "availability": "By human referral"},
        {"id": "legal", "name": "Legal aid", "description": "A reviewer can help explain available legal support options.", "availability": "By human referral"},
        {"id": "rehabilitation", "name": "Rehabilitation support", "description": "A reviewer can help identify relevant rehabilitation assistance.", "availability": "By human referral"},
    ]
