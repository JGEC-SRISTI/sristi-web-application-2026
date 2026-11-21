import os
from PIL import Image

s = "C:\\Users\\HP\\Desktop\\proj_github\\sristi-web-application-2026\\frontend\\src\\assets\\images\\gallery"
d = "C:\\Users\\HP\\Desktop\\proj_github\\sristi-web-application-2026\\frontend\\src\\assets\\images\\gallery_compressed"
os.makedirs(d, exist_ok=True)

for f in os.listdir(s):
    if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
        p = os.path.join(s, f)
        n = os.path.splitext(f)[0] + ".webp"
        o = os.path.join(d, n)
        with Image.open(p) as i:
            i.save(o, "WEBP", quality=69)