"""CinemaForge Tips (Stripe) endpoint tests."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _register(session, suffix=None):
    suffix = suffix or uuid.uuid4().hex[:8]
    email = f"test_tip_{suffix}@cinemaforge.io"
    username = f"TEST_tip_{suffix}"
    r = session.post(f"{API}/auth/register",
                     json={"email": email, "password": "Pass1234!", "username": username})
    assert r.status_code == 200, r.text
    d = r.json()
    return {"email": email, "username": username, "token": d["token"], "user": d["user"]}


@pytest.fixture(scope="module")
def creator(session):
    # ensure seeded so we have movies
    session.post(f"{API}/seed", timeout=60)
    return _register(session)


@pytest.fixture(scope="module")
def viewer(session):
    return _register(session)


@pytest.fixture(scope="module")
def creator_movie(session, creator):
    headers = {"Authorization": f"Bearer {creator['token']}", "Content-Type": "application/json"}
    r = session.post(f"{API}/movies",
                     json={"prompt": "TEST_ tip-target movie", "genre": "Drama", "length": "trailer"},
                     headers=headers)
    assert r.status_code == 200, r.text
    return r.json()


# ---------- /tips/packages ----------
def test_tips_packages_returns_four(session):
    r = session.get(f"{API}/tips/packages")
    assert r.status_code == 200
    pkgs = r.json()
    assert isinstance(pkgs, list)
    assert len(pkgs) == 4
    ids = {p["id"] for p in pkgs}
    assert ids == {"spark", "ember", "blaze", "inferno"}
    amounts = {p["id"]: p["amount"] for p in pkgs}
    assert amounts["spark"] == 2.00
    assert amounts["ember"] == 5.00
    assert amounts["blaze"] == 10.00
    assert amounts["inferno"] == 25.00
    for p in pkgs:
        assert p["currency"] == "usd"
        assert "label" in p


# ---------- /tips/checkout ----------
def test_tips_checkout_requires_auth(session, creator_movie):
    r = session.post(f"{API}/tips/checkout",
                     json={"movie_id": creator_movie["id"], "package_id": "ember",
                           "origin_url": "https://example.com"})
    assert r.status_code == 401


def test_tips_checkout_invalid_package(session, viewer, creator_movie):
    headers = {"Authorization": f"Bearer {viewer['token']}", "Content-Type": "application/json"}
    r = session.post(f"{API}/tips/checkout",
                     json={"movie_id": creator_movie["id"], "package_id": "bogus_pkg",
                           "origin_url": "https://example.com"},
                     headers=headers)
    assert r.status_code == 400
    assert "Invalid" in r.json().get("detail", "") or "package" in r.json().get("detail", "").lower()


def test_tips_checkout_movie_not_found(session, viewer):
    headers = {"Authorization": f"Bearer {viewer['token']}", "Content-Type": "application/json"}
    r = session.post(f"{API}/tips/checkout",
                     json={"movie_id": "nope-does-not-exist", "package_id": "ember",
                           "origin_url": "https://example.com"},
                     headers=headers)
    assert r.status_code == 404


def test_tips_checkout_cannot_tip_own_movie(session, creator, creator_movie):
    headers = {"Authorization": f"Bearer {creator['token']}", "Content-Type": "application/json"}
    r = session.post(f"{API}/tips/checkout",
                     json={"movie_id": creator_movie["id"], "package_id": "ember",
                           "origin_url": "https://example.com"},
                     headers=headers)
    assert r.status_code == 400
    detail = r.json().get("detail", "").lower()
    assert "own" in detail


def test_tips_checkout_success(session, viewer, creator_movie):
    headers = {"Authorization": f"Bearer {viewer['token']}", "Content-Type": "application/json"}
    r = session.post(f"{API}/tips/checkout",
                     json={"movie_id": creator_movie["id"], "package_id": "spark",
                           "origin_url": "https://example.com"},
                     headers=headers)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "url" in data and "session_id" in data
    assert data["url"].startswith("https://checkout.stripe.com/") or "stripe.com" in data["url"]
    # store for next test
    pytest.tip_session_id = data["session_id"]


# ---------- /tips/status ----------
def test_tips_status_unpaid_session(session):
    sid = getattr(pytest, "tip_session_id", None)
    if not sid:
        pytest.skip("No session id from checkout test")
    r = session.get(f"{API}/tips/status/{sid}")
    assert r.status_code == 200
    data = r.json()
    assert "status" in data
    assert "payment_status" in data
    # Without completing payment, payment_status should NOT be 'paid'
    assert data["payment_status"] != "paid"


def test_tips_status_idempotent_does_not_double_credit(session, creator_movie):
    sid = getattr(pytest, "tip_session_id", None)
    if not sid:
        pytest.skip("No session id from checkout test")
    # Call status multiple times
    for _ in range(3):
        r = session.get(f"{API}/tips/status/{sid}")
        assert r.status_code == 200
    # Movie should still have no successful tips since payment never completed
    tr = session.get(f"{API}/movies/{creator_movie['id']}/tips")
    assert tr.status_code == 200
    data = tr.json()
    # No paid tips because we never completed payment
    assert data["count"] == 0
    assert data["total"] == 0


# ---------- /movies/{id}/tips ----------
def test_movie_tips_shape(session, creator_movie):
    r = session.get(f"{API}/movies/{creator_movie['id']}/tips")
    assert r.status_code == 200
    data = r.json()
    assert set(data.keys()) >= {"count", "total", "tips"}
    assert isinstance(data["tips"], list)
    assert isinstance(data["count"], int)


# ---------- /webhook/stripe ----------
def test_stripe_webhook_handles_bad_signature(session):
    # Send empty body / fake signature - should return 400 not 500
    r = session.post(f"{API}/webhook/stripe",
                     data=b"{}",
                     headers={"Stripe-Signature": "t=0,v1=fake"})
    # Should be a graceful error (4xx) not a server crash 5xx
    assert r.status_code in (400, 401, 403), f"Expected 4xx, got {r.status_code}: {r.text}"


# ---------- Payment transaction persistence ----------
def test_checkout_creates_payment_transaction_record(session, viewer, creator_movie):
    """Verify payment_transactions row is created with correct initial state."""
    headers = {"Authorization": f"Bearer {viewer['token']}", "Content-Type": "application/json"}
    r = session.post(f"{API}/tips/checkout",
                     json={"movie_id": creator_movie["id"], "package_id": "blaze",
                           "origin_url": "https://example.com"},
                     headers=headers)
    assert r.status_code == 200, r.text
    sid = r.json()["session_id"]
    # Status check returns OK -> indicates record exists and Stripe session is live
    s = session.get(f"{API}/tips/status/{sid}")
    assert s.status_code == 200
    # New session must NOT be credited
    assert s.json()["payment_status"] != "paid"
