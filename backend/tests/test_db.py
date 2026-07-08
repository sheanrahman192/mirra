from app import db


def test_get_db_creates_fresh_client(monkeypatch):
    created: list[object] = []

    def fake_create_client(url: str, key: str):
        client = object()
        created.append((url, key, client))
        return client

    monkeypatch.setattr(db, "create_client", fake_create_client)

    first = db.get_db()
    second = db.get_db()

    assert first is not second
    assert len(created) == 2
