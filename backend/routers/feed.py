"""GET /feed (F6)."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from deps import get_current_user, get_db
from models import User
from schemas import FeedPage
from services import feed as feed_service

router = APIRouter(tags=["feed"])


@router.get("/feed", response_model=FeedPage)
def feed(
    cursor: str | None = None,
    categoria: str | None = None,
    limit: int = Query(feed_service.DEFAULT_LIMIT),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, next_cursor = feed_service.get_feed(db, user, cursor, categoria, limit)
    return FeedPage(items=items, next_cursor=next_cursor)
