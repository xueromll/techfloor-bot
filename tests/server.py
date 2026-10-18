import os, subprocess, sys
from common import STATE

os.chdir(os.path.dirname(os.path.abspath(__file__)))
env = {**os.environ, "X_LOCAL_OBSERVABILITY": "false", "X_LOCAL_EXPLORER": "false"}
cmd = ["npx", "wrangler", "dev", "--local", "--test-scheduled", "--port", "8787", "--ip", "127.0.0.1", "--persist-to", STATE]
sys.exit(subprocess.run(cmd, env=env, shell=os.name == "nt").returncode)
