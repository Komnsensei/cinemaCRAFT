"""CinemaForge backend regression tests."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://cinemacraft-31.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def seeded(session):
    r = session.post(f"{API}/seed", timeout=60)
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture(scope="session")
def test_user(session, seeded):
    suffix = uuid.uuid4().hex[:8]
    email = f"test_user_{suffix}@cinemaforge.io"
    password = "Pass1234!"
    username = f"TEST_{suffix}"
    r = session.post(f"{API}/auth/register", json={"email": email, "password": password, "username": username})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data and "user" in data
    return {"email": email, "password": password, "username": username, "token": data["token"], "user": data["user"]}


@pytest.fixture(scope="session")
def auth_headers(test_user):
    return {"Authorization": f"Bearer {test_user['token']}", "Content-Type": "application/json"}


# ---------- Seed ----------
def test_seed_idempotent(session):
    r1 = session.post(f"{API}/seed")
    r2 = session.post(f"{API}/seed")
    assert r1.status_code == 200
    assert r2.status_code == 200
    # second call should be skipped
    assert r2.json().get("skipped") is True


# ---------- Auth ----------
def test_login_success(session, test_user):
    r = session.post(f"{API}/auth/login", json={"email": test_user["email"], "password": test_user["password"]})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data and data["user"]["email"] == test_user["email"]


def test_login_invalid(session):
    r = session.post(f"{API}/auth/login", json={"email": "nope@cinemaforge.io", "password": "wrong"})
    assert r.status_code == 401


def test_register_duplicate(session, test_user):
    r = session.post(f"{API}/auth/register", json={"email": test_user["email"], "password": "x", "username": "dupe"})
    assert r.status_code == 400


def test_auth_me(session, auth_headers, test_user):
    r = session.get(f"{API}/auth/me", headers=auth_headers)
    assert r.status_code == 200
    me = r.json()
    assert me["email"] == test_user["email"]
    assert "_id" not in me
    assert "password" not in me


def test_auth_me_unauth(session):
    r = session.get(f"{API}/auth/me")
    assert r.status_code == 401


# ---------- Catalog ----------
def test_prompts(session):
    r = session.get(f"{API}/prompts")
    assert r.status_code == 200
    arr = r.json()
    assert isinstance(arr, list) and len(arr) == 12
    assert {"id", "title", "blurb", "genre"} <= set(arr[0].keys())


def test_actors(session):
    r = session.get(f"{API}/actors")
    assert r.status_code == 200
    arr = r.json()
    assert isinstance(arr, list) and len(arr) == 8
    assert {"id", "name", "img"} <= set(arr[0].keys())


# ---------- Movies listing/filters ----------
def test_movies_list_default(session, seeded):
    r = session.get(f"{API}/movies")
    assert r.status_code == 200
    arr = r.json()
    assert isinstance(arr, list) and len(arr) > 0
    m = arr[0]
    assert "_id" not in m
    assert {"id", "title", "genre", "creator_id", "poster_url"} <= set(m.keys())


@pytest.mark.parametrize("sort", ["new", "rating", "watches", "clicks"])
def test_movies_sort(session, sort):
    r = session.get(f"{API}/movies", params={"sort": sort})
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_movies_genre_filter(session):
    r = session.get(f"{API}/movies", params={"genre": "Sci-Fi"})
    assert r.status_code == 200
    arr = r.json()
    assert all(m["genre"] == "Sci-Fi" for m in arr)


def test_movies_search(session):
    r = session.get(f"{API}/movies", params={"q": "Mars"})
    assert r.status_code == 200


def test_movies_coming_soon(session):
    r = session.get(f"{API}/movies", params={"coming_soon": "true"})
    assert r.status_code == 200
    arr = r.json()
    assert all(m["coming_soon"] is True for m in arr)


def test_leaderboard(session):
    r = session.get(f"{API}/movies/leaderboard")
    assert r.status_code == 200
    data = r.json()
    assert set(data.keys()) == {"best_rated", "most_watched", "most_clicked"}
    for k in data:
        assert isinstance(data[k], list)


# ---------- Movie detail clicks ----------
def test_movie_detail_increments_clicks(session):
    arr = session.get(f"{API}/movies").json()
    mid = arr[0]["id"]
    before = arr[0]["clicks"]
    r = session.get(f"{API}/movies/{mid}")
    assert r.status_code == 200
    m = r.json()
    assert m["id"] == mid
    assert m["clicks"] == before + 1
    assert "_id" not in m


def test_movie_detail_not_found(session):
    r = session.get(f"{API}/movies/does-not-exist")
    assert r.status_code == 404


# ---------- Movie CRUD/Interactions ----------
def test_create_movie_requires_auth(session):
    r = session.post(f"{API}/movies", json={"prompt": "TEST prompt"})
    assert r.status_code == 401


def test_create_movie_and_persist(session, auth_headers, test_user):
    payload = {"prompt": "TEST_ A neon-soaked rebellion in 2099 Lagos", "genre": "Sci-Fi",
               "length": "trailer", "format": "movie", "actors": ["a1", "a2"]}
    r = session.post(f"{API}/movies", json=payload, headers=auth_headers)
    assert r.status_code == 200, r.text
    m = r.json()
    assert m["creator_id"] == test_user["user"]["id"]
    assert m["is_original"] is True
    assert "_id" not in m
    # GET verify
    g = session.get(f"{API}/movies/{m['id']}")
    assert g.status_code == 200
    assert g.json()["title"] == m["title"]


def test_like_toggle(session, auth_headers):
    arr = session.get(f"{API}/movies").json()
    mid = arr[0]["id"]
    r1 = session.post(f"{API}/movies/{mid}/like", headers=auth_headers)
    assert r1.status_code == 200
    assert r1.json()["liked"] is True
    r2 = session.post(f"{API}/movies/{mid}/like", headers=auth_headers)
    assert r2.json()["liked"] is False


def test_watch_increments(session):
    arr = session.get(f"{API}/movies").json()
    mid = arr[0]["id"]
    before = session.get(f"{API}/movies/{mid}").json()["watches"]
    r = session.post(f"{API}/movies/{mid}/watch")
    assert r.status_code == 200
    after = session.get(f"{API}/movies/{mid}").json()["watches"]
    assert after >= before + 1


def test_rate_movie(session, auth_headers):
    arr = session.get(f"{API}/movies").json()
    mid = arr[0]["id"]
    r = session.post(f"{API}/movies/{mid}/rate", json={"rating": 5}, headers=auth_headers)
    assert r.status_code == 200
    # invalid
    r2 = session.post(f"{API}/movies/{mid}/rate", json={"rating": 9}, headers=auth_headers)
    assert r2.status_code == 400


def test_fork_movie(session, auth_headers, test_user):
    arr = session.get(f"{API}/movies").json()
    orig_id = arr[0]["id"]
    r = session.post(f"{API}/movies/{orig_id}/fork", headers=auth_headers)
    assert r.status_code == 200, r.text
    f = r.json()
    assert f["fork_of"] == orig_id
    assert f["is_original"] is False
    assert f["creator_id"] == test_user["user"]["id"]
    # listing fork_of filter
    lst = session.get(f"{API}/movies", params={"fork_of": orig_id}).json()
    assert any(x["id"] == f["id"] for x in lst)


def test_archive_only_creator(session, auth_headers):
    # Create my own movie
    create = session.post(f"{API}/movies", json={"prompt": "TEST archive me"}, headers=auth_headers).json()
    r = session.post(f"{API}/movies/{create['id']}/archive", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["archived"] is True
    # Archive someone else's seed movie -> 403
    seeded_id = session.get(f"{API}/movies", params={"creator_id": "system-curator"}).json()[0]["id"]
    r2 = session.post(f"{API}/movies/{seeded_id}/archive", headers=auth_headers)
    assert r2.status_code == 403


# ---------- AI Chat ----------
def test_ai_chat(session):
    r = session.post(f"{API}/ai/chat", json={"message": "Say hi in 5 words."}, timeout=60)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "reply" in data and "session_id" in data
    assert isinstance(data["reply"], str) and len(data["reply"]) > 0
