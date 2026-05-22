"""CinemaForge Marketplace (Characters, Worlds, Licenses, Earnings) tests."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"


# ---------- helpers ----------
@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _register(session, prefix="mkt"):
    suffix = uuid.uuid4().hex[:8]
    email = f"test_{prefix}_{suffix}@cinemaforge.io"
    username = f"TEST_{prefix}_{suffix}"
    r = session.post(f"{API}/auth/register",
                     json={"email": email, "password": "Pass1234!", "username": username})
    assert r.status_code == 200, r.text
    d = r.json()
    return {"email": email, "username": username, "token": d["token"], "user": d["user"]}


def _auth(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def seeded(session):
    r = session.post(f"{API}/seed", timeout=60)
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture(scope="module")
def buyer(session, seeded):
    return _register(session, prefix="buyer")


@pytest.fixture(scope="module")
def seller(session, seeded):
    return _register(session, prefix="seller")


# ---------- Seed / list endpoints ----------
class TestSeedAndList:
    def test_seed_creates_characters_and_worlds(self, session, seeded):
        # call seed again; should be idempotent
        r = session.post(f"{API}/seed", timeout=60)
        assert r.status_code == 200, r.text

    def test_list_characters_returns_8(self, session, seeded):
        r = session.get(f"{API}/characters")
        assert r.status_code == 200
        chars = r.json()
        assert isinstance(chars, list)
        # at least the 8 seeded ones (may have user-created ones from prior runs)
        assert len(chars) >= 8, f"expected >=8 characters, got {len(chars)}"
        for c in chars:
            assert "id" in c and "name" in c and "creator_id" in c
            assert "_id" not in c

    def test_list_worlds_returns_6(self, session, seeded):
        r = session.get(f"{API}/worlds")
        assert r.status_code == 200
        worlds = r.json()
        assert len(worlds) >= 6, f"expected >=6 worlds, got {len(worlds)}"

    def test_character_detail_200(self, session, seeded):
        chars = session.get(f"{API}/characters").json()
        cid = chars[0]["id"]
        r = session.get(f"{API}/characters/{cid}")
        assert r.status_code == 200
        assert r.json()["id"] == cid

    def test_character_detail_404(self, session, seeded):
        r = session.get(f"{API}/characters/nope-{uuid.uuid4().hex}")
        assert r.status_code == 404

    def test_world_detail_200(self, session, seeded):
        worlds = session.get(f"{API}/worlds").json()
        wid = worlds[0]["id"]
        r = session.get(f"{API}/worlds/{wid}")
        assert r.status_code == 200
        assert r.json()["id"] == wid

    def test_world_detail_404(self, session, seeded):
        r = session.get(f"{API}/worlds/nope-{uuid.uuid4().hex}")
        assert r.status_code == 404


# ---------- Tiers ----------
class TestTiers:
    def test_tiers_structure_and_amounts(self, session):
        r = session.get(f"{API}/marketplace/tiers")
        assert r.status_code == 200
        d = r.json()
        assert "character" in d and "world" in d
        assert len(d["character"]) == 4
        assert len(d["world"]) == 4
        char_by_id = {t["id"]: t for t in d["character"]}
        world_by_id = {t["id"]: t for t in d["world"]}
        # character: 3/8/15/40
        assert char_by_id["one_time"]["amount"] == 3.00
        assert char_by_id["series"]["amount"] == 8.00
        assert char_by_id["feature"]["amount"] == 15.00
        assert char_by_id["lifetime"]["amount"] == 40.00
        # world: 5/15/25/75
        assert world_by_id["one_time"]["amount"] == 5.00
        assert world_by_id["series"]["amount"] == 15.00
        assert world_by_id["feature"]["amount"] == 25.00
        assert world_by_id["lifetime"]["amount"] == 75.00


# ---------- Create assets ----------
class TestCreateAssets:
    def test_create_character_requires_auth(self, session):
        r = session.post(f"{API}/characters", json={
            "name": "TEST_char_x", "tagline": "t", "description": "d", "image_url": "https://x", "tags": []
        })
        assert r.status_code in (401, 403)

    def test_create_character(self, session, seller):
        r = session.post(f"{API}/characters",
                         json={"name": f"TEST_char_{uuid.uuid4().hex[:6]}",
                               "tagline": "t", "description": "d",
                               "image_url": "https://x", "tags": ["test"],
                               "vibe": "vibe", "voice": "voice"},
                         headers=_auth(seller["token"]))
        assert r.status_code == 200, r.text
        d = r.json()
        assert "id" in d and d["creator_id"] == seller["user"]["id"]
        assert d["license_count"] == 0
        # persisted
        r2 = session.get(f"{API}/characters/{d['id']}")
        assert r2.status_code == 200
        assert r2.json()["name"] == d["name"]

    def test_create_world(self, session, seller):
        r = session.post(f"{API}/worlds",
                         json={"name": f"TEST_world_{uuid.uuid4().hex[:6]}",
                               "tagline": "t", "description": "d",
                               "image_url": "https://x", "tags": ["test"],
                               "era": "1999", "palette": "x"},
                         headers=_auth(seller["token"]))
        assert r.status_code == 200, r.text
        d = r.json()
        assert "id" in d and d["creator_id"] == seller["user"]["id"]


# ---------- License checkout ----------
@pytest.fixture(scope="module")
def seller_character(session, seller):
    r = session.post(f"{API}/characters",
                     json={"name": f"TEST_char_target_{uuid.uuid4().hex[:6]}",
                           "tagline": "t", "description": "d",
                           "image_url": "https://x", "tags": []},
                     headers=_auth(seller["token"]))
    assert r.status_code == 200, r.text
    return r.json()


class TestLicenseCheckout:
    def test_checkout_requires_auth(self, session, seller_character):
        r = session.post(f"{API}/licenses/checkout", json={
            "asset_type": "character", "asset_id": seller_character["id"],
            "tier": "one_time", "origin_url": BASE_URL,
        })
        assert r.status_code in (401, 403)

    def test_checkout_invalid_asset_type(self, session, buyer, seller_character):
        r = session.post(f"{API}/licenses/checkout",
                         json={"asset_type": "ghost",
                               "asset_id": seller_character["id"],
                               "tier": "one_time", "origin_url": BASE_URL},
                         headers=_auth(buyer["token"]))
        assert r.status_code == 400

    def test_checkout_invalid_tier(self, session, buyer, seller_character):
        r = session.post(f"{API}/licenses/checkout",
                         json={"asset_type": "character",
                               "asset_id": seller_character["id"],
                               "tier": "ultra", "origin_url": BASE_URL},
                         headers=_auth(buyer["token"]))
        assert r.status_code == 400

    def test_checkout_rejects_owner_buying_own_asset(self, session, seller, seller_character):
        r = session.post(f"{API}/licenses/checkout",
                         json={"asset_type": "character",
                               "asset_id": seller_character["id"],
                               "tier": "one_time", "origin_url": BASE_URL},
                         headers=_auth(seller["token"]))
        assert r.status_code == 400

    def test_checkout_returns_url_and_session_id(self, session, buyer, seller_character):
        r = session.post(f"{API}/licenses/checkout",
                         json={"asset_type": "character",
                               "asset_id": seller_character["id"],
                               "tier": "one_time", "origin_url": BASE_URL},
                         headers=_auth(buyer["token"]))
        assert r.status_code == 200, r.text
        d = r.json()
        assert "url" in d and "session_id" in d
        assert "stripe.com" in d["url"]
        # save for downstream tests
        pytest._mkt_session = d["session_id"]

    def test_checkout_unknown_asset_returns_404(self, session, buyer):
        r = session.post(f"{API}/licenses/checkout",
                         json={"asset_type": "character",
                               "asset_id": f"nope-{uuid.uuid4().hex}",
                               "tier": "one_time", "origin_url": BASE_URL},
                         headers=_auth(buyer["token"]))
        assert r.status_code == 404


# ---------- License status ----------
class TestLicenseStatus:
    def test_status_for_just_created_session_no_500(self, session):
        sid = getattr(pytest, "_mkt_session", None)
        assert sid, "previous checkout test did not set session id"
        r = session.get(f"{API}/licenses/status/{sid}")
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["source"] in ("stripe", "db_fallback")
        assert d["payment_status"] in ("initiated", "unpaid", "open", "no_payment_required")

    def test_status_unknown_session_returns_404(self, session):
        r = session.get(f"{API}/licenses/status/cs_fake_{uuid.uuid4().hex}")
        assert r.status_code == 404

    def test_status_idempotent_no_double_credit(self, session, buyer, seller_character):
        # call status 5 times; license count should not increment (payment not paid)
        sid = getattr(pytest, "_mkt_session", None)
        char_id = seller_character["id"]
        before = session.get(f"{API}/characters/{char_id}").json()
        for _ in range(5):
            r = session.get(f"{API}/licenses/status/{sid}")
            assert r.status_code == 200
        after = session.get(f"{API}/characters/{char_id}").json()
        assert before.get("license_count", 0) == after.get("license_count", 0)
        # buyer's licenses still empty (not paid)
        r = session.get(f"{API}/licenses/my", headers=_auth(buyer["token"]))
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------- My licenses / Earnings ----------
class TestLicensesMyAndEarnings:
    def test_my_licenses_requires_auth(self, session):
        r = session.get(f"{API}/licenses/my")
        assert r.status_code in (401, 403)

    def test_my_licenses_empty_for_new_user(self, session):
        u = _register(session, prefix="fresh")
        r = session.get(f"{API}/licenses/my", headers=_auth(u["token"]))
        assert r.status_code == 200
        assert r.json() == []

    def test_earnings_requires_auth(self, session):
        r = session.get(f"{API}/creator/earnings")
        assert r.status_code in (401, 403)

    def test_earnings_zero_for_new_user(self, session):
        u = _register(session, prefix="freshcreator")
        r = session.get(f"{API}/creator/earnings", headers=_auth(u["token"]))
        assert r.status_code == 200
        d = r.json()
        assert d["tips"]["count"] == 0 and d["tips"]["total"] == 0
        assert d["licenses"]["count"] == 0 and d["licenses"]["total"] == 0
        assert d["grand_total"] == 0
        assert isinstance(d["tips"]["recent"], list)
        assert isinstance(d["licenses"]["recent"], list)
