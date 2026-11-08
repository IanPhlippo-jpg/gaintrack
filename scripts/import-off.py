"""
Supermarktproducten (België en Nederland) uit Open Food Facts naar src/data/foods-off.json.

Gebruik:  python scripts/import-off.py [aantal]      (standaard 8000)

- Bron: search.openfoodfacts.org (open data, ODbL), gesorteerd op het aantal scans: de populairste producten eerst.
- Enkel producten met volledige voedingswaarden per 100 g (kcal, eiwit, koolhydraten, vet) die met elkaar kloppen.
- Producten die al in de lijst stonden blijven staan (favorieten en recent verwijzen naar hun id).
- Compact formaat: n = naam · merk, k/p/c/f per 100 g, q = portie (g), l = portielabel, b = barcode, a = aliassen.
"""
import json
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

DOEL = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
OUT = Path(__file__).resolve().parent.parent / "src" / "data" / "foods-off.json"
API = "https://search.openfoodfacts.org/search"
UA = "GainTrack-food-import/1.0"
FIELDS = "code,product_name,product_name_nl,product_name_fr,product_name_en,brands,nutriments,serving_quantity,unique_scans_n"


def haal(land: str, pagina: int):
    q = urllib.parse.urlencode({"q": f'countries_tags:"en:{land}"', "page_size": 100, "page": pagina, "fields": FIELDS, "sort_by": "-unique_scans_n"})
    for poging in range(4):
        try:
            req = urllib.request.Request(f"{API}?{q}", headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r).get("hits", [])
        except Exception as e:  # noqa: BLE001 - netwerkfout: even wachten en opnieuw
            print(f"  {land} p{pagina}: {e}, opnieuw", flush=True)
            time.sleep(5 * (poging + 1))
    return []


def getal(v):
    try:
        x = float(v)
        return x if x == x else None
    except (TypeError, ValueError):
        return None


def naam_van(h):
    for k in ("product_name_nl", "product_name", "product_name_fr", "product_name_en"):
        v = (h.get(k) or "").strip()
        if v:
            return re.sub(r"\s+", " ", v)[:70]
    return ""


def merk_van(h):
    b = h.get("brands")
    if isinstance(b, list):
        b = b[0] if b else ""
    b = (b or "").split(",")[0].strip()
    return b[:40]


def sleutel(s: str):
    s = unicodedata.normalize("NFKD", s.lower())
    return re.sub(r"[^a-z0-9]", "", "".join(c for c in s if not unicodedata.combining(c)))


def rij(h):
    code = str(h.get("code") or "").strip()
    if not re.fullmatch(r"\d{8,14}", code):
        return None
    n = h.get("nutriments") or {}
    k, p, c, f = (getal(n.get(x)) for x in ("energy-kcal_100g", "proteins_100g", "carbohydrates_100g", "fat_100g"))
    if None in (k, p, c, f):
        return None
    if not (0 <= k <= 900 and 0 <= p <= 100 and 0 <= c <= 100 and 0 <= f <= 100 and p + c + f <= 101):
        return None
    # kcal moet ongeveer kloppen met de macro's (vezels en alcohol laten wat speling)
    if abs(k - (4 * p + 4 * c + 9 * f)) > max(40, 0.35 * k):
        return None
    naam = naam_van(h)
    if len(naam) < 2:
        return None
    merk = merk_van(h)
    q = getal(h.get("serving_quantity"))
    q = round(q) if q and 1 <= q <= 1000 else 100
    r = {"id": f"off-{code}", "n": f"{naam} · {merk}" if merk and sleutel(merk) not in sleutel(naam) else naam, "k": round(k), "p": round(p, 1), "c": round(c, 1), "f": round(f, 1), "q": q, "b": code}
    if q != 100:
        r["l"] = f"1 portie ({q} g)"
    if merk:
        r["a"] = [merk]
    return r


def main():
    oud = json.loads(OUT.read_text(encoding="utf8")) if OUT.exists() else []
    lijst = {r["b"]: r for r in oud}
    namen = {sleutel(r["n"]) for r in oud}
    print(f"bestaand: {len(lijst)}", flush=True)
    per_land = {"belgium": 0, "netherlands": 0}
    pagina = 1
    while len(lijst) < DOEL and pagina <= 100:
        nieuw = 0
        for land in per_land:
            for h in haal(land, pagina):
                r = rij(h)
                if not r or r["b"] in lijst or sleutel(r["n"]) in namen:
                    continue
                lijst[r["b"]] = r
                namen.add(sleutel(r["n"]))
                nieuw += 1
                per_land[land] += 1
            time.sleep(1.2)
        print(f"pagina {pagina}: +{nieuw} -> {len(lijst)}", flush=True)
        if nieuw == 0 and pagina > 60:
            break
        pagina += 1
    rows = list(lijst.values())[: max(DOEL, len(oud))]
    OUT.write_text(json.dumps(rows, ensure_ascii=False, separators=(",", ":")), encoding="utf8")
    print(f"klaar: {len(rows)} producten ({OUT.stat().st_size // 1024} KB), nieuw per land: {per_land}")


if __name__ == "__main__":
    main()
