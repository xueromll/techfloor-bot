import os, socket, subprocess, sys, time

SUITES = ("drive.py", "done.py", "room.py", "auth.py", "race.py", "abuse.py", "web.py", "habits.py")
PORTS = {"faketg.py": 8799, "server.py": 8787}
os.chdir(os.path.dirname(os.path.abspath(__file__)))
env = {**os.environ, "PYTHONIOENCODING": "utf-8", "PYTHONUNBUFFERED": "1"}


def listening(port):
    with socket.socket() as s:
        return s.connect_ex(("127.0.0.1", port)) == 0


def stop(proc):
    if os.name == "nt":
        subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], capture_output=True)
    else:
        proc.terminate()
    proc.wait()


taken = [port for port in PORTS.values() if listening(port)]
if taken:
    sys.exit(f"Порт {', '.join(map(str, taken))} занят. Останови запущенные faketg.py и test:server — npm test поднимает их сам, каждый раз заново.")

servers = []
try:
    for script, port in PORTS.items():
        log = open(script.replace(".py", ".log"), "w", encoding="utf-8")
        proc = subprocess.Popen([sys.executable, script], env=env, stdout=log, stderr=subprocess.STDOUT)
        servers.append(proc)
        deadline = time.time() + 120
        while not listening(port):
            if proc.poll() is not None or time.time() > deadline:
                sys.exit(f"{script} не запустился, см. tests/{log.name}")
            time.sleep(0.2)
    for name in SUITES:
        print("=" * 30, name, flush=True)
        code = subprocess.run([sys.executable, name], env=env).returncode
        if code:
            sys.exit(code)
    print("ALL SUITES OK")
finally:
    for proc in reversed(servers):
        stop(proc)
