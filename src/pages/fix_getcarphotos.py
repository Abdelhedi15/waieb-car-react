#!/usr/bin/env python3
"""
Run from: C:\Users\Abdou\Desktop\waieb-car-rent\src\pages
Command: python fix_getcarphotos.py
"""
import os

files = {
    "Reservations.jsx": "const getCarPhoto = (vehicle) => IMMAT_PHOTOS[vehicle?.immatriculation] || (vehicle?.photo ? `https://web-production-e6e97.up.railway.app${vehicle.photo}` : null) || CAR_PHOTOS[(vehicle?.marque || '').toLowerCase()] || CAR_PHOTOS.default;",
    "ReservationsList.jsx": "const getCarPhoto = (v) => IMMAT_PHOTOS[v?.immatriculation] || (v?.photo ? `https://web-production-e6e97.up.railway.app${v.photo}` : null) || CAR_PHOTOS[(v?.marque||'').toLowerCase()] || CAR_PHOTOS.default;",
}

new_funcs = {
    "Reservations.jsx": "const getCarPhoto = (vehicle) => {\n  if (IMMAT_PHOTOS[vehicle?.immatriculation]) return IMMAT_PHOTOS[vehicle?.immatriculation];\n  if (vehicle?.photo) {\n    const p = String(vehicle.photo);\n    if (p.startsWith('http')) return p;\n    return `https://web-production-e6e97.up.railway.app${p}`;\n  }\n  return CAR_PHOTOS[(vehicle?.marque||'').toLowerCase()] || CAR_PHOTOS.default;\n};",
    "ReservationsList.jsx": "const getCarPhoto = (v) => {\n  if (IMMAT_PHOTOS[v?.immatriculation]) return IMMAT_PHOTOS[v?.immatriculation];\n  if (v?.photo) {\n    const p = String(v.photo);\n    if (p.startsWith('http')) return p;\n    return `https://web-production-e6e97.up.railway.app${p}`;\n  }\n  return CAR_PHOTOS[(v?.marque||'').toLowerCase()] || CAR_PHOTOS.default;\n};",
}

for fname, old in files.items():
    if not os.path.exists(fname):
        print(f"SKIP {fname}")
        continue
    with open(fname, "r", encoding="utf-8") as f:
        content = f.read()
    if "startsWith(\'http\')" in content or "startsWith('http')" in content:
        print(f"OK {fname} - already fixed")
        continue
    if old in content:
        content = content.replace(old, new_funcs[fname])
        with open(fname, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"FIXED {fname}")
    else:
        # Try to find and show what's there
        idx = content.find("const getCarPhoto")
        if idx >= 0:
            print(f"WARN {fname} - pattern not matched, found:")
            print(repr(content[idx:idx+250]))
        else:
            print(f"WARN {fname} - getCarPhoto not found at all")

print("\nDone! Run: git add -A && git commit -m \'fix: getCarPhoto external URLs\' && git push")