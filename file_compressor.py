import os
from PIL import Image

s = "D:\\New folder (2)"
d = "D:\\New folder\\compressed"
os.makedirs(d, exist_ok=True)

for f in os.listdir(s):
    if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
        p = os.path.join(s, f)
        n = os.path.splitext(f)[0] + ".webp"
        o = os.path.join(d, n)
        with Image.open(p) as i:
            i.save(o, "WEBP", quality=69)