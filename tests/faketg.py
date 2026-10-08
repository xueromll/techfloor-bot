import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from common import ADMIN_UID, BAD_THREAD, DM_BLOCKED_UID, OUTSIDER_UID
n = [100]
class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def reply(self, data):
        out = json.dumps(data).encode()
        self.send_response(200); self.send_header("Content-Type", "application/json"); self.end_headers(); self.wfile.write(out)
    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
        method = self.path.rsplit("/", 1)[-1]
        res = True
        if method == "getMe": res = {"id": 1, "username": "technical_floor_bot"}
        elif method == "getChatMember":
            uid = body["user_id"]
            res = {"status": "administrator" if uid == ADMIN_UID else "member" if uid < OUTSIDER_UID else "left"}
        elif method == "sendMessage":
            th = body.get("message_thread_id")
            if body["chat_id"] == DM_BLOCKED_UID:
                return self.reply({"ok": False, "error_code": 403, "description": "Forbidden: bot can't initiate conversation with a user"})
            if th == BAD_THREAD:
                return self.reply({"ok": False, "error_code": 400, "description": "Bad Request: message thread not found"})
            n[0] += 1; res = {"message_id": n[0]}
            if th: res.update(message_thread_id=th, is_topic_message=True)
            where = "DM " + str(body["chat_id"]) if body["chat_id"] > 0 else f"CHAT[topic {th or 'General'}]"
            print(f"{where}: " + body["text"].replace("\n", " | ")[:90], flush=True)
        if method.startswith("setMy"): print("TG", method, json.dumps(body, ensure_ascii=False)[:140], flush=True)
        self.reply({"ok": True, "result": res})
ThreadingHTTPServer(("127.0.0.1", 8799), H).serve_forever()
