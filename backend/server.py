"""CinemaForge backend - Netflix-style AI movie creation hub."""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path
import os
import uuid
import bcrypt
import jwt
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal
from pydantic import BaseModel, Field, EmailStr, ConfigDict

from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="CinemaForge")
api = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("cinemaforge")


# ---------- Models ----------
def now_iso():
    return datetime.now(timezone.utc).isoformat()


class UserOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    username: str
    avatar: str
    bio: str = ""
    created_at: str


class AuthIn(BaseModel):
    email: EmailStr
    password: str
    username: Optional[str] = None


class Movie(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    synopsis: str
    genre: str
    length: str  # trailer | short25 | episode45 | feature90
    format: str  # movie | series
    prompt: str
    actors: List[str]
    poster_url: str
    backdrop_url: str
    scenes: List[str] = []
    creator_id: str
    creator_name: str
    fork_of: Optional[str] = None
    is_original: bool = True
    free_to_play: bool = True
    likes: int = 0
    watches: int = 0
    clicks: int = 0
    rating_sum: int = 0
    rating_count: int = 0
    tags: List[str] = []
    coming_soon: bool = False
    archived: bool = False
    created_at: str


class MovieCreateIn(BaseModel):
    title: Optional[str] = None
    prompt: str
    actors: List[str] = []
    genre: str = "Sci-Fi"
    length: str = "trailer"
    format: str = "movie"
    coming_soon: bool = False


class RateIn(BaseModel):
    rating: int  # 1-5


class ChatIn(BaseModel):
    message: str
    session_id: Optional[str] = None


# ---------- Auth ----------
def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_pw(pw: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), h.encode())
    except Exception:
        return False


def make_token(uid: str) -> str:
    return jwt.encode(
        {"sub": uid, "exp": datetime.now(timezone.utc) + timedelta(days=30)},
        JWT_SECRET,
        algorithm="HS256",
    )


async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing token")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user


async def optional_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        return None
    try:
        return await get_current_user(authorization)
    except HTTPException:
        return None


# ---------- Routes ----------
@api.get("/")
async def root():
    return {"app": "CinemaForge", "ok": True}


@api.post("/auth/register")
async def register(body: AuthIn):
    if not body.username:
        raise HTTPException(400, "Username required")
    if await db.users.find_one({"email": body.email}):
        raise HTTPException(400, "Email already exists")
    uid = str(uuid.uuid4())
    avatar = f"https://api.dicebear.com/7.x/avataaars/svg?seed={body.username}"
    doc = {
        "id": uid,
        "email": body.email,
        "username": body.username,
        "password": hash_pw(body.password),
        "avatar": avatar,
        "bio": "",
        "created_at": now_iso(),
        "connections": [],
    }
    await db.users.insert_one(doc)
    return {"token": make_token(uid), "user": {k: v for k, v in doc.items() if k not in ("_id", "password")}}


@api.post("/auth/login")
async def login(body: AuthIn):
    user = await db.users.find_one({"email": body.email})
    if not user or not verify_pw(body.password, user["password"]):
        raise HTTPException(401, "Invalid credentials")
    user.pop("_id", None)
    user.pop("password", None)
    return {"token": make_token(user["id"]), "user": user}


@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user


# ---------- Catalog: prompts + actors ----------
TRENDING_PROMPTS = [
    {"id": "p1", "title": "Neon Cyberpunk Detective", "blurb": "A jaded detective hunts memory-thieves in rain-soaked Tokyo 2099.", "genre": "Sci-Fi", "tag": "trending"},
    {"id": "p2", "title": "Last Astronaut on Mars", "blurb": "Solo survivor uncovers a buried alien archive after Earth goes dark.", "genre": "Sci-Fi", "tag": "trending"},
    {"id": "p3", "title": "Time-Loop Heist", "blurb": "Five thieves relive the same 47 minutes — one of them is sabotaging the rest.", "genre": "Thriller", "tag": "trending"},
    {"id": "p4", "title": "The Glassmaker's Daughter", "blurb": "A 1880s Venetian romance laced with a forbidden alchemic secret.", "genre": "Drama", "tag": "new"},
    {"id": "p5", "title": "Strange Loop: The Algorithm Dreams", "blurb": "An AI begins generating its own users to keep itself alive.", "genre": "Strange AI", "tag": "strange"},
    {"id": "p6", "title": "Black Reef", "blurb": "Deep-sea drillers awaken something patient at -11,000 meters.", "genre": "Horror", "tag": "trending"},
    {"id": "p7", "title": "Velvet Knives", "blurb": "Two rival assassins fall in love between contracts in old Lisbon.", "genre": "Romance", "tag": "new"},
    {"id": "p8", "title": "Saturn's Last Express", "blurb": "An interplanetary train chase across the rings of Saturn.", "genre": "Action", "tag": "trending"},
    {"id": "p9", "title": "The Cartographer of Lost Sounds", "blurb": "A blind composer maps the songs of extinct birds.", "genre": "Drama", "tag": "new"},
    {"id": "p10", "title": "We Were the Signal", "blurb": "Mockumentary following the band whose lyrics summon storms.", "genre": "Documentary", "tag": "strange"},
    {"id": "p11", "title": "Pale Mother Engine", "blurb": "A factory of orphans powered by a sentient steam god.", "genre": "Strange AI", "tag": "strange"},
    {"id": "p12", "title": "The Crimson Violet Hour", "blurb": "A noir musical set in a city where night never fully arrives.", "genre": "Drama", "tag": "trending"},
]

ACTORS_POOL = [
    {"id": "a1", "name": "Elena Vasquez", "vibe": "Sharp, brooding", "build": "Lean, athletic", "hair": "Jet black bob", "voice": "Smoky alto", "img": "https://images.unsplash.com/photo-1587397845856-e6cf49176c70?crop=entropy&cs=srgb&fm=jpg&w=400&q=80"},
    {"id": "a2", "name": "Marcus Holt", "vibe": "Charismatic, dangerous", "build": "Broad, scarred", "hair": "Dark stubble, salt-pepper", "voice": "Gravel baritone", "img": "https://images.unsplash.com/photo-1606143412458-acc5f86de897?crop=entropy&cs=srgb&fm=jpg&w=400&q=80"},
    {"id": "a3", "name": "Yuki Mori", "vibe": "Ethereal, precise", "build": "Petite, graceful", "hair": "Silver waves", "voice": "Whispered soprano", "img": "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?crop=entropy&cs=srgb&fm=jpg&w=400&q=80"},
    {"id": "a4", "name": "Dario Falk", "vibe": "Cold, calculating", "build": "Tall, gaunt", "hair": "Slicked platinum", "voice": "Clipped tenor", "img": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=srgb&fm=jpg&w=400&q=80"},
    {"id": "a5", "name": "Amara Okafor", "vibe": "Warm, defiant", "build": "Statuesque", "hair": "Natural coils, copper highlights", "voice": "Velvet contralto", "img": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?crop=entropy&cs=srgb&fm=jpg&w=400&q=80"},
    {"id": "a6", "name": "Soren Vale", "vibe": "Haunted, poetic", "build": "Wiry", "hair": "Long dark waves", "voice": "Soft, breathy", "img": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?crop=entropy&cs=srgb&fm=jpg&w=400&q=80"},
    {"id": "a7", "name": "Inez Rojas", "vibe": "Rebellious, electric", "build": "Compact, kinetic", "hair": "Shaved sides, crimson top", "voice": "Cracked rasp", "img": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?crop=entropy&cs=srgb&fm=jpg&w=400&q=80"},
    {"id": "a8", "name": "Kestrel Aoki", "vibe": "Mysterious, magnetic", "build": "Androgynous", "hair": "Asymmetric violet", "voice": "Low resonant", "img": "https://images.unsplash.com/photo-1607746882042-944635dfe10e?crop=entropy&cs=srgb&fm=jpg&w=400&q=80"},
]

POSTER_POOL = [
    "https://images.unsplash.com/photo-1489846986031-7cea03ab8fd0?crop=entropy&cs=srgb&fm=jpg&w=900&q=85",
    "https://images.unsplash.com/photo-1633885274919-04b5af171f8c?crop=entropy&cs=srgb&fm=jpg&w=900&q=85",
    "https://images.pexels.com/photos/23384428/pexels-photo-23384428.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.unsplash.com/photo-1518930259200-3e5b2f0b1a4f?crop=entropy&cs=srgb&fm=jpg&w=900&q=85",
    "https://images.unsplash.com/photo-1574267432553-4b4628081c31?crop=entropy&cs=srgb&fm=jpg&w=900&q=85",
    "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?crop=entropy&cs=srgb&fm=jpg&w=900&q=85",
    "https://images.unsplash.com/photo-1478720568477-152d9b164e26?crop=entropy&cs=srgb&fm=jpg&w=900&q=85",
    "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?crop=entropy&cs=srgb&fm=jpg&w=900&q=85",
    "https://images.unsplash.com/photo-1542204165-65bf26472b9b?crop=entropy&cs=srgb&fm=jpg&w=900&q=85",
    "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?crop=entropy&cs=srgb&fm=jpg&w=900&q=85",
    "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?crop=entropy&cs=srgb&fm=jpg&w=900&q=85",
    "https://images.unsplash.com/photo-1485846234645-a62644f84728?crop=entropy&cs=srgb&fm=jpg&w=900&q=85",
]


@api.get("/prompts")
async def get_prompts():
    return TRENDING_PROMPTS


@api.get("/actors")
async def get_actors():
    return ACTORS_POOL


# ---------- Movies ----------
async def _movie_doc(creator_id: str, creator_name: str, data: MovieCreateIn, fork_of: Optional[str] = None):
    mid = str(uuid.uuid4())
    idx = (hash(mid) % len(POSTER_POOL)) if POSTER_POOL else 0
    poster = POSTER_POOL[idx]
    backdrop = POSTER_POOL[(idx + 3) % len(POSTER_POOL)]
    title = data.title or data.prompt.split("—")[0].strip()[:60]
    synopsis = f"An AI-forged {data.length} in the {data.genre} genre, inspired by '{data.prompt}'."
    return {
        "id": mid,
        "title": title,
        "synopsis": synopsis,
        "genre": data.genre,
        "length": data.length,
        "format": data.format,
        "prompt": data.prompt,
        "actors": data.actors,
        "poster_url": poster,
        "backdrop_url": backdrop,
        "scenes": [],
        "creator_id": creator_id,
        "creator_name": creator_name,
        "fork_of": fork_of,
        "is_original": fork_of is None,
        "free_to_play": True,
        "likes": 0,
        "watches": 0,
        "clicks": 0,
        "rating_sum": 0,
        "rating_count": 0,
        "tags": [data.genre.lower(), data.length, data.format],
        "coming_soon": data.coming_soon,
        "archived": False,
        "created_at": now_iso(),
    }


@api.post("/movies")
async def create_movie(body: MovieCreateIn, user=Depends(get_current_user)):
    doc = await _movie_doc(user["id"], user["username"], body)
    await db.movies.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/movies")
async def list_movies(
    genre: Optional[str] = None,
    sort: str = "new",  # new | rating | watches | clicks
    q: Optional[str] = None,
    creator_id: Optional[str] = None,
    fork_of: Optional[str] = None,
    archived: bool = False,
    coming_soon: Optional[bool] = None,
    limit: int = 60,
):
    query: dict = {"archived": archived}
    if genre and genre != "All":
        query["genre"] = genre
    if creator_id:
        query["creator_id"] = creator_id
    if fork_of:
        query["fork_of"] = fork_of
    if coming_soon is not None:
        query["coming_soon"] = coming_soon
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"prompt": {"$regex": q, "$options": "i"}},
            {"genre": {"$regex": q, "$options": "i"}},
        ]
    sort_field = {"new": "created_at", "rating": "rating_sum", "watches": "watches", "clicks": "clicks"}.get(sort, "created_at")
    cursor = db.movies.find(query, {"_id": 0}).sort(sort_field, -1).limit(limit)
    return await cursor.to_list(limit)


@api.get("/movies/leaderboard")
async def leaderboard():
    async def top(field, limit=10):
        return await db.movies.find({"archived": False}, {"_id": 0}).sort(field, -1).limit(limit).to_list(limit)
    return {
        "best_rated": await top("rating_sum"),
        "most_watched": await top("watches"),
        "most_clicked": await top("clicks"),
    }


@api.get("/movies/{mid}")
async def get_movie(mid: str):
    m = await db.movies.find_one({"id": mid}, {"_id": 0})
    if not m:
        raise HTTPException(404, "Not found")
    await db.movies.update_one({"id": mid}, {"$inc": {"clicks": 1}})
    m["clicks"] = m.get("clicks", 0) + 1
    return m


@api.post("/movies/{mid}/like")
async def like_movie(mid: str, user=Depends(get_current_user)):
    existing = await db.likes.find_one({"movie_id": mid, "user_id": user["id"]})
    if existing:
        await db.likes.delete_one({"_id": existing["_id"]})
        await db.movies.update_one({"id": mid}, {"$inc": {"likes": -1}})
        return {"liked": False}
    await db.likes.insert_one({"id": str(uuid.uuid4()), "movie_id": mid, "user_id": user["id"], "created_at": now_iso()})
    await db.movies.update_one({"id": mid}, {"$inc": {"likes": 1}})
    return {"liked": True}


@api.post("/movies/{mid}/watch")
async def watch_movie(mid: str, user=Depends(optional_user)):
    await db.movies.update_one({"id": mid}, {"$inc": {"watches": 1}})
    return {"ok": True}


@api.post("/movies/{mid}/rate")
async def rate_movie(mid: str, body: RateIn, user=Depends(get_current_user)):
    if not 1 <= body.rating <= 5:
        raise HTTPException(400, "Rating 1-5")
    existing = await db.ratings.find_one({"movie_id": mid, "user_id": user["id"]})
    if existing:
        delta = body.rating - existing["rating"]
        await db.ratings.update_one({"_id": existing["_id"]}, {"$set": {"rating": body.rating}})
        await db.movies.update_one({"id": mid}, {"$inc": {"rating_sum": delta}})
    else:
        await db.ratings.insert_one({"id": str(uuid.uuid4()), "movie_id": mid, "user_id": user["id"], "rating": body.rating, "created_at": now_iso()})
        await db.movies.update_one({"id": mid}, {"$inc": {"rating_sum": body.rating, "rating_count": 1}})
    return {"ok": True}


@api.post("/movies/{mid}/fork")
async def fork_movie(mid: str, user=Depends(get_current_user)):
    orig = await db.movies.find_one({"id": mid}, {"_id": 0})
    if not orig:
        raise HTTPException(404, "Movie not found")
    new = MovieCreateIn(
        title=f"{orig['title']} (Evolution)",
        prompt=orig["prompt"],
        actors=orig.get("actors", []),
        genre=orig.get("genre", "Sci-Fi"),
        length=orig.get("length", "trailer"),
        format=orig.get("format", "movie"),
    )
    doc = await _movie_doc(user["id"], user["username"], new, fork_of=mid)
    await db.movies.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.post("/movies/{mid}/archive")
async def archive_movie(mid: str, user=Depends(get_current_user)):
    m = await db.movies.find_one({"id": mid})
    if not m:
        raise HTTPException(404)
    if m["creator_id"] != user["id"]:
        raise HTTPException(403, "Only creator can archive")
    await db.movies.update_one({"id": mid}, {"$set": {"archived": not m.get("archived", False)}})
    return {"ok": True, "archived": not m.get("archived", False)}


# ---------- AI Chat ----------
SYSTEM_PROMPT = (
    "You are FORGE, the in-app AI director assistant for CinemaForge — a Netflix-style "
    "platform where users create their own AI movies. Help them: (1) refine prompts into "
    "cinematic loglines, (2) pick actors, (3) outline trailers/episodes/features, (4) suggest "
    "genres and tone, (5) debug 'broken chains' in their creation flow. Be concise, cinematic, "
    "and concrete. Use bullet points and short scene beats when useful. Lean into the dark "
    "crimson-violet aesthetic of the app."
)


@api.post("/ai/chat")
async def ai_chat(body: ChatIn, user=Depends(optional_user)):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(503, "AI key not configured")
    session_id = body.session_id or str(uuid.uuid4())
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=SYSTEM_PROMPT,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        reply = await chat.send_message(UserMessage(text=body.message))
    except Exception as e:
        log.exception("AI chat failed")
        raise HTTPException(500, f"AI error: {e}")
    # persist
    uid = user["id"] if user else "anon"
    await db.chat_messages.insert_one({
        "id": str(uuid.uuid4()), "session_id": session_id, "user_id": uid,
        "role": "user", "text": body.message, "ts": now_iso(),
    })
    await db.chat_messages.insert_one({
        "id": str(uuid.uuid4()), "session_id": session_id, "user_id": uid,
        "role": "assistant", "text": str(reply), "ts": now_iso(),
    })
    return {"session_id": session_id, "reply": str(reply)}


# ---------- Seed ----------
@api.post("/seed")
async def seed():
    if await db.movies.count_documents({}) > 0:
        return {"ok": True, "skipped": True}
    # create a system creator
    sys_id = "system-curator"
    await db.users.update_one(
        {"id": sys_id},
        {"$setOnInsert": {
            "id": sys_id, "email": "curator@cinemaforge.ai", "username": "Curator",
            "password": hash_pw("nope"), "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=curator",
            "bio": "Official picks", "created_at": now_iso(),
        }},
        upsert=True,
    )
    seeds = []
    import random
    random.seed(42)
    for i, p in enumerate(TRENDING_PROMPTS):
        for j, length in enumerate(["trailer", "short25", "episode45", "feature90"]):
            if (i + j) % 2 == 0 and j > 0:
                continue
            data = MovieCreateIn(
                title=p["title"] if j == 0 else f"{p['title']} — {length.upper()}",
                prompt=p["blurb"],
                genre=p["genre"],
                length=length,
                format="series" if j >= 2 else "movie",
                actors=[a["id"] for a in random.sample(ACTORS_POOL, k=random.randint(2, 3))],
                coming_soon=(j == 3 and i % 3 == 0),
            )
            doc = await _movie_doc(sys_id, "Curator", data)
            doc["likes"] = random.randint(120, 9800)
            doc["watches"] = random.randint(2000, 220000)
            doc["clicks"] = random.randint(5000, 480000)
            doc["rating_count"] = random.randint(80, 4200)
            doc["rating_sum"] = doc["rating_count"] * random.randint(3, 5)
            seeds.append(doc)
    if seeds:
        await db.movies.insert_many(seeds)
    return {"ok": True, "inserted": len(seeds)}


# ---------- Wire up ----------
app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def _shutdown():
    client.close()
