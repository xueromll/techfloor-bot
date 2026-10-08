import io
import json
import os

IMPORT = 'import PAGE from "../webapp/index.html";'
ROOT = os.path.dirname(os.path.abspath(__file__))


def read(*parts):
    return io.open(os.path.join(ROOT, *parts), encoding="utf-8", newline="").read()


page = read("webapp", "index.html")
worker = read("src", "worker.js")

if not worker.startswith(IMPORT):
    raise SystemExit("src/worker.js must start with:\n" + IMPORT)

bundle = "const PAGE = " + json.dumps(page, ensure_ascii=True) + ";" + worker[len(IMPORT):]

os.makedirs(os.path.join(ROOT, "dist"), exist_ok=True)
out = os.path.join(ROOT, "dist", "worker.js")
io.open(out, "w", encoding="utf-8", newline="").write(bundle)

print("dist/worker.js - %d bytes, no imports" % len(bundle.encode("utf-8")))
