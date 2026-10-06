"""Pruebas de la Fase 1: auth mínima, F2 (envío de reportes) y F6 (feed, likes, comentarios)."""
import io
from datetime import timedelta

from PIL import Image

from db import SessionLocal
from models import Report, User, utcnow

BOGOTA = {"lat": "5.5353", "lng": "-73.3678"}
DESC = "Hay un hueco enorme en la vía del barrio San Antonio"


def img_bytes(kind: str = "v") -> bytes:
    """Imágenes estructuralmente distintas (hash perceptual diferente)."""
    img = Image.new("RGB", (64, 64))
    px = img.load()
    for x in range(64):
        for y in range(64):
            if kind == "v":
                v = y * 4
            elif kind == "h":
                v = x * 4
            else:
                v = 255 if ((x // 16) + (y // 16)) % 2 else 0
            px[x, y] = (v, v, v)
    buf = io.BytesIO()
    img.save(buf, "PNG")
    return buf.getvalue()


def post_report(client, headers, kind="v", desc=DESC, coords=BOGOTA, **extra):
    return client.post(
        "/api/reports",
        headers=headers,
        files={"foto": ("foto.png", img_bytes(kind), "image/png")},
        data={"descripcion": desc, **coords, **extra},
    )


def insert_reports(n, user_id=1, categoria="Infraestructura", estado="aprobado"):
    base = utcnow() - timedelta(hours=1)
    with SessionLocal() as db:
        for i in range(n):
            db.add(Report(
                user_id=user_id, foto_url=f"/uploads/{i}.png", descripcion=f"Reporte número {i} de prueba",
                lat=5.5, lng=-73.3, hash_imagen="0" * 16, estado=estado, categoria=categoria,
                color="#F59E0B", creado_en=base + timedelta(seconds=i // 2),  # empates de segundo
            ))
        db.commit()


# ───────────────────────── Auth ─────────────────────────
def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}


def test_register_login_me(client):
    r = client.post("/api/auth/register", json={"nombre": "Ana", "email": "Ana@Example.com", "password": "clave12345"})
    assert r.status_code == 201
    body = r.json()
    assert body["user"]["email"] == "ana@example.com" and body["user"]["nivel"] == "Vecino"
    assert "password" not in str(body)
    r = client.post("/api/auth/login", json={"email": "ana@example.com", "password": "clave12345"})
    token = r.json()["access_token"]
    me = client.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200 and me.json()["puntos"] == 0 and me.json()["medallas"] == []


def test_register_duplicate_and_bad_login(client, make_user):
    make_user()
    r = client.post("/api/auth/register", json={"nombre": "Otra", "email": "ana@example.com", "password": "clave12345"})
    assert r.status_code == 409 and r.json()["code"] == "EMAIL_EXISTE"
    r = client.post("/api/auth/login", json={"email": "ana@example.com", "password": "mala-clave"})
    assert r.status_code == 401 and r.json()["code"] == "CREDENCIALES_INVALIDAS"


def test_register_validation_error_format(client):
    r = client.post("/api/auth/register", json={"nombre": "A", "email": "no-es-email", "password": "123"})
    assert r.status_code == 422 and set(r.json()) == {"detail", "code"}


def test_protected_routes_require_valid_token(client):
    assert client.get("/api/feed").json()["code"] == "NO_AUTENTICADO"
    r = client.get("/api/feed", headers={"Authorization": "Bearer basura"})
    assert r.status_code == 401 and r.json()["code"] == "TOKEN_INVALIDO"


# ───────────────────────── F2: reportes ─────────────────────────
def test_create_report_ok_and_saved(client, make_user):
    h = make_user()
    r = post_report(client, h)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["estado"] == "aprobado" and body["puntos_ganados"] == 0 and body["medallas_nuevas"] == []
    detail = client.get(f"/api/reports/{body['id']}", headers=h).json()
    assert detail["foto_url"].startswith("/uploads/") and detail["color"] == "#6366F1"
    assert client.get(detail["foto_url"]).status_code == 200  # imagen realmente en disco


def test_description_sanitized(client, make_user):
    h = make_user()
    r = post_report(client, h, desc="<script>alert(1)</script>Basura acumulada en la esquina")
    rid = r.json()["id"]
    desc = client.get(f"/api/reports/{rid}", headers=h).json()["descripcion"]
    assert "<" not in desc and desc.endswith("Basura acumulada en la esquina")


def test_invalid_description(client, make_user):
    h = make_user()
    assert post_report(client, h, desc="corto").json()["code"] == "DESCRIPCION_INVALIDA"
    assert post_report(client, h, desc="x" * 501).json()["code"] == "DESCRIPCION_INVALIDA"


def test_invalid_location(client, make_user):
    h = make_user()
    for coords in ({"lat": "40.4", "lng": "-3.7"}, {"lat": "95", "lng": "-73"}, {"lat": "5", "lng": "200"}):
        r = post_report(client, h, coords=coords)
        assert r.status_code == 422 and r.json()["code"] == "UBICACION_INVALIDA", coords
    r = client.post(  # sin ubicación no hay reporte
        "/api/reports", headers=h,
        files={"foto": ("f.png", img_bytes(), "image/png")}, data={"descripcion": DESC},
    )
    assert r.status_code == 422


def test_invalid_photo(client, make_user):
    h = make_user()
    r = client.post("/api/reports", headers=h, data={"descripcion": DESC, **BOGOTA},
                    files={"foto": ("x.png", b"esto no es una imagen", "image/png")})
    assert r.json()["code"] == "FOTO_INVALIDA"
    r = client.post("/api/reports", headers=h, data={"descripcion": DESC, **BOGOTA},
                    files={"foto": ("x.png", b"x" * (5 * 1024 * 1024 + 1), "image/png")})
    assert r.status_code == 413 and r.json()["code"] == "FOTO_MUY_GRANDE"
    gif = io.BytesIO()
    Image.new("RGB", (8, 8)).save(gif, "GIF")
    r = client.post("/api/reports", headers=h, data={"descripcion": DESC, **BOGOTA},
                    files={"foto": ("x.gif", gif.getvalue(), "image/gif")})
    assert r.json()["code"] == "FOTO_INVALIDA"


def test_requires_auth_to_report(client):
    r = client.post("/api/reports", files={"foto": ("f.png", img_bytes(), "image/png")},
                    data={"descripcion": DESC, **BOGOTA})
    assert r.status_code == 401


def test_duplicate_same_user_rejected(client, make_user):
    h = make_user()
    assert post_report(client, h).json()["estado"] == "aprobado"
    r = post_report(client, h).json()
    assert r["estado"] == "rechazado" and r["motivo_rechazo"] == "Reporte duplicado"
    items = client.get("/api/feed", headers=h).json()["items"]
    assert len(items) == 1  # el duplicado no llega al feed


def test_duplicate_other_user_only_if_within_100m(client, make_user):
    a, b = make_user("a@example.com"), make_user("b@example.com")
    post_report(client, a)
    near = {"lat": "5.5356", "lng": "-73.3678"}   # ~33 m
    far = {"lat": "5.5453", "lng": "-73.3678"}    # ~1,1 km
    assert post_report(client, b, coords=far).json()["estado"] == "aprobado"
    assert post_report(client, b, coords=near).json()["estado"] == "rechazado"


def test_hourly_limit(client, make_user):
    h = make_user()
    for _ in range(5):  # el primero se aprueba y los demás cuentan como duplicados
        assert post_report(client, h).status_code == 201
    r = post_report(client, h, kind="h")
    assert r.status_code == 429 and r.json()["code"] == "LIMITE_HORA"


# ───────────────────────── F6: feed ─────────────────────────
def test_feed_cursor_pagination_no_duplicates(client, make_user):
    h = make_user()
    insert_reports(25)
    seen, cursor, pages = [], None, 0
    while True:
        url = "/api/feed?limit=10" + (f"&cursor={cursor}" if cursor else "")
        page = client.get(url, headers=h).json()
        seen += [i["id"] for i in page["items"]]
        pages += 1
        cursor = page["next_cursor"]
        if not cursor:
            break
    assert pages == 3 and len(seen) == 25 and len(set(seen)) == 25
    assert seen == sorted(seen, reverse=True)  # orden creado_en desc, id desc


def test_feed_new_report_does_not_duplicate_pages(client, make_user):
    h = make_user()
    insert_reports(12)
    p1 = client.get("/api/feed?limit=10", headers=h).json()
    insert_reports(3)  # llegan reportes nuevos entre páginas
    p2 = client.get(f"/api/feed?limit=10&cursor={p1['next_cursor']}", headers=h).json()
    ids1 = {i["id"] for i in p1["items"]}
    assert not ids1 & {i["id"] for i in p2["items"]}


def test_feed_limit_cap_and_default(client, make_user):
    h = make_user()
    insert_reports(35)
    assert len(client.get("/api/feed", headers=h).json()["items"]) == 10
    assert len(client.get("/api/feed?limit=100", headers=h).json()["items"]) == 30


def test_feed_filters_and_visibility(client, make_user):
    h = make_user()
    insert_reports(3, categoria="Aseo")
    insert_reports(2, categoria="Alumbrado")
    insert_reports(2, estado="pendiente")
    insert_reports(2, estado="rechazado")
    assert len(client.get("/api/feed", headers=h).json()["items"]) == 5
    assert len(client.get("/api/feed?categoria=Aseo", headers=h).json()["items"]) == 3
    assert client.get("/api/feed?categoria=Inventada", headers=h).json()["code"] == "CATEGORIA_INVALIDA"
    assert client.get("/api/feed?cursor=xxx", headers=h).json()["code"] == "CURSOR_INVALIDO"


def test_feed_item_contract_and_anonymity(client, make_user):
    h = make_user()
    post_report(client, h, publicado_anonimo="true")
    item = client.get("/api/feed", headers=h).json()["items"][0]
    assert set(item) == {"id", "autor", "foto_url", "descripcion", "categoria", "color", "severidad",
                         "lat", "lng", "barrio", "likes", "comentarios", "liked_por_mi", "creado_en"}
    assert item["autor"] == {"nombre": "Anónimo", "nivel": "Vecino", "anonimo": True}
    assert item["creado_en"].endswith("Z")


def test_pending_report_visible_only_to_owner_or_admin(client, make_user):
    a, b = make_user("a@example.com"), make_user("b@example.com")
    insert_reports(1, user_id=1, estado="pendiente")
    assert client.get("/api/reports/1", headers=a).status_code == 200
    r = client.get("/api/reports/1", headers=b)
    assert r.status_code == 404 and r.json()["code"] == "REPORTE_NO_ENCONTRADO"
    with SessionLocal() as db:
        db.get(User, 2).rol = "admin"
        db.commit()
    assert client.get("/api/reports/1", headers=b).status_code == 200


# ───────────────────────── F6: likes y comentarios ─────────────────────────
def test_like_toggle_persists(client, make_user):
    h = make_user()
    rid = post_report(client, h).json()["id"]
    assert client.post(f"/api/reports/{rid}/like", headers=h).json() == {"liked": True, "likes": 1}
    item = client.get("/api/feed", headers=h).json()["items"][0]
    assert item["likes"] == 1 and item["liked_por_mi"] is True
    assert client.post(f"/api/reports/{rid}/like", headers=h).json() == {"liked": False, "likes": 0}


def test_like_on_hidden_report_404(client, make_user):
    a, b = make_user("a@example.com"), make_user("b@example.com")
    insert_reports(1, user_id=1, estado="pendiente")
    assert client.post("/api/reports/1/like", headers=b).status_code == 404


def test_comments_create_list_and_sanitize(client, make_user):
    h = make_user()
    rid = post_report(client, h).json()["id"]
    r = client.post(f"/api/reports/{rid}/comments", headers=h, json={"texto": "<b>Yo también</b> lo vi"})
    assert r.status_code == 201 and r.json()["texto"] == "Yo también lo vi"
    assert client.post(f"/api/reports/{rid}/comments", headers=h, json={"texto": "<i></i>"}).status_code == 422
    assert client.post(f"/api/reports/{rid}/comments", headers=h, json={"texto": "x" * 301}).status_code == 422
    lst = client.get(f"/api/reports/{rid}/comments", headers=h).json()
    assert len(lst) == 1 and lst[0]["autor"]["nombre"] == "Ana Pérez"
    assert client.get("/api/feed", headers=h).json()["items"][0]["comentarios"] == 1
