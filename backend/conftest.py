"""Configuración de pruebas: BD y uploads temporales, sin rate limit HTTP ni claves reales."""
import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

_tmp = Path(tempfile.mkdtemp(prefix="civic_test_"))
os.environ["DATABASE_URL"] = f"sqlite:///{(_tmp / 'test.db').as_posix()}"
os.environ["UPLOAD_DIR"] = str(_tmp / "uploads")
os.environ["RATE_LIMIT_ENABLED"] = "false"
os.environ["JWT_SECRET"] = "secreto-de-pruebas"
os.environ["AUTO_APPROVE_DEV"] = "true"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from db import Base, engine  # noqa: E402
from main import app  # noqa: E402


@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture()
def client():
    return TestClient(app)


@pytest.fixture()
def make_user(client):
    def _make(email="ana@example.com", nombre="Ana Pérez", password="clave12345"):
        r = client.post("/api/auth/register", json={"nombre": nombre, "email": email, "password": password})
        assert r.status_code == 201, r.text
        return {"Authorization": f"Bearer {r.json()['access_token']}"}

    return _make
