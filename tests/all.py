import os, subprocess, sys

SUITES = ("drive.py", "done.py", "room.py", "auth.py", "race.py", "abuse.py")
os.chdir(os.path.dirname(os.path.abspath(__file__)))
env = {**os.environ, "PYTHONIOENCODING": "utf-8"}
for name in SUITES:
    print("=" * 30, name, flush=True)
    code = subprocess.run([sys.executable, name], env=env).returncode
    if code: sys.exit(code)
print("ALL SUITES OK")
