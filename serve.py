#!/usr/bin/env python3
"""
serve.py — Local dev server with Live Reload & Debounced Watch Gate
Dùng Python stdlib (không cần pip install), tự động reload trình duyệt khi sửa code.
"""

import os
import sys
import time
import queue
import threading
import webbrowser
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

# Đảm bảo UTF-8 trên Windows console
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Cấu hình mặc định
DEFAULT_PORT = 8080
TARGET_GAME_FILE = 'index.html'
WATCH_EXTENSIONS = {'.html', '.js', '.css', '.json', '.svg', '.png', '.jpg', '.mp3', '.ogg'}
DEBOUNCE_SEC = 0.35

clients = []
clients_lock = threading.Lock()

LIVE_RELOAD_SCRIPT = """
<!-- [LIVE RELOAD ACTIVE] -->
<script id="__live_reload_script">
(function() {
  // ponytail: DOMParser + sessionStorage hot swap, nâng cấp lên Vite/HMR khi tách nhiều bundle
  var lastSource = '';
  try {
    fetch(location.href, { cache: 'no-store' })
      .then(function(r) { return r.text(); })
      .then(function(t) { lastSource = t; })
      .catch(function() {});
  } catch(e) {}

  // Phục hồi state sau khi reload
  try {
    var raw = sessionStorage.getItem('__dev_state');
    if (raw) {
      sessionStorage.removeItem('__dev_state');
      var s = JSON.parse(raw);
      if (s.name1 && document.getElementById('name1')) document.getElementById('name1').value = s.name1;
      if (s.name2 && document.getElementById('name2')) document.getElementById('name2').value = s.name2;
      if (s.activeScreen === 'screen-game' && s.teams) {
        var startScr = document.getElementById('screen-start');
        var gameScr = document.getElementById('screen-game');
        if (startScr && gameScr) {
          startScr.classList.remove('active');
          gameScr.classList.add('active');
          if (typeof teams !== 'undefined') teams = s.teams;
          if (typeof qDone !== 'undefined') qDone = s.qDone;
          if (typeof curQ !== 'undefined') curQ = s.curQ;
          var t1 = (teams && teams[0]) ? teams[0].name : "Dãy 1";
          var t2 = (teams && teams[1]) ? teams[1].name : "Dãy 2";
          if (document.getElementById('btn-t1')) document.getElementById('btn-t1').textContent = t1 + " đúng ✅";
          if (document.getElementById('btn-t2')) document.getElementById('btn-t2').textContent = t2 + " đúng ✅";
          if (typeof renderAll === 'function') renderAll();
          if (s.inQ && typeof openQuestion === 'function' && typeof curQ === 'number') openQuestion(curQ);
        }
      }
      if (typeof s.scrollY === 'number') window.scrollTo(s.scrollX || 0, s.scrollY);
    }
  } catch (e) {}

  // Nút bật/tắt tự động tải lại trang
  var enabled = sessionStorage.getItem('__live_reload_enabled') !== '0';
  var badge = document.createElement('div');
  badge.id = '__live_badge';
  badge.style.cssText = 'position:fixed;bottom:12px;right:12px;z-index:99999;font-family:sans-serif;font-size:12px;background:rgba(40,40,40,0.85);color:#fff;padding:6px 12px;border-radius:20px;cursor:pointer;user-select:none;box-shadow:0 2px 8px rgba(0,0,0,0.25);';
  function syncBadge(pending) {
    if (!enabled) {
      badge.innerHTML = '⏸️ Live Reload: <b>TẮT</b>' + (pending ? ' <span style="background:#e67e22;padding:2px 6px;border-radius:8px;font-weight:bold;margin-left:4px;">Tải lại ngay 🔄</span>' : '');
      badge.style.background = pending ? '#a93226' : 'rgba(50,50,50,0.85)';
    } else {
      badge.innerHTML = '⚡ Hot Reload: <b>BẬT</b>';
      badge.style.background = 'rgba(40,40,40,0.85)';
    }
  }
  syncBadge(false);
  var pending = false;
  badge.onclick = function() {
    if (pending && !enabled) { doReload(); return; }
    enabled = !enabled;
    sessionStorage.setItem('__live_reload_enabled', enabled ? '1' : '0');
    syncBadge(pending);
  };
  document.body.appendChild(badge);

  function doReload() {
    try {
      var act = document.querySelector('.screen.active');
      var qp = document.getElementById('q-panel');
      sessionStorage.setItem('__dev_state', JSON.stringify({
        activeScreen: act ? act.id : 'screen-start',
        inQ: qp && qp.style.display !== 'none',
        name1: document.getElementById('name1') ? document.getElementById('name1').value : '',
        name2: document.getElementById('name2') ? document.getElementById('name2').value : '',
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        teams: typeof teams !== 'undefined' ? teams : null,
        qDone: typeof qDone !== 'undefined' ? qDone : null,
        curQ: typeof curQ !== 'undefined' ? curQ : null
      }));
    } catch(e) {}
    location.reload();
  }

  try {
    var es = new EventSource('/__live_reload');
    es.onmessage = function(e) {
      if (e.data !== 'reload') return;
      if (!enabled) { pending = true; syncBadge(true); return; }
      fetch(location.href, { cache: 'no-store' })
        .then(function(r) { return r.text(); })
        .then(function(newSrc) {
          if (!lastSource) { doReload(); return; }
          var dp = new DOMParser();
          var oDoc = dp.parseFromString(lastSource, 'text/html');
          var nDoc = dp.parseFromString(newSrc, 'text/html');
          var oS = oDoc.querySelector('script:not(#__live_reload_script)'), nS = nDoc.querySelector('script:not(#__live_reload_script)');
          var scriptChanged = (oS ? oS.textContent : '') !== (nS ? nS.textContent : '');
          var bodyChanged = (oDoc.body ? oDoc.body.innerHTML : '') !== (nDoc.body ? nDoc.body.innerHTML : '');
          var oCss = oDoc.querySelector('style'), nCss = nDoc.querySelector('style');
          var cssChanged = (oCss ? oCss.textContent : '') !== (nCss ? nCss.textContent : '');

          // Nếu chỉ sửa style CSS: thay trực tiếp không reload trang
          if (!scriptChanged && !bodyChanged && cssChanged && nCss) {
            var curStyle = document.querySelector('style');
            if (curStyle) {
              curStyle.textContent = nCss.textContent;
              lastSource = newSrc;
              if (typeof toast === 'function') toast('⚡ Đã cập nhật CSS (không tải lại trang)');
              return;
            }
          }
          doReload();
        })
        .catch(doReload);
    };
  } catch (err) {}
})();
</script>
</body>"""

def get_watched_files(root_dir='.'):
    """Lấy danh sách các file cần theo dõi cùng mtime."""
    file_mtimes = {}
    for dirpath, _, filenames in os.walk(root_dir):
        if any(ignored in dirpath for ignored in ('.git', '__pycache__', '.vscode')):
            continue
        for fn in filenames:
            ext = os.path.splitext(fn)[1].lower()
            if ext in WATCH_EXTENSIONS:
                fp = os.path.join(dirpath, fn)
                try:
                    file_mtimes[fp] = os.path.getmtime(fp)
                except OSError:
                    pass
    return file_mtimes

def inject_live_reload(html_content: str) -> str:
    """Tiêm script EventSource vào trước thẻ đóng </body> hoặc </html>."""
    if '</body>' in html_content:
        return html_content.replace('</body>', LIVE_RELOAD_SCRIPT, 1)
    if '</html>' in html_content:
        return html_content.replace('</html>', LIVE_RELOAD_SCRIPT + '</html>', 1)
    return html_content + LIVE_RELOAD_SCRIPT

def broadcast_reload():
    """Gửi tín hiệu nạp lại trang tới toàn bộ tab trình duyệt đang mở."""
    with clients_lock:
        stale = []
        for q in clients:
            try:
                q.put_nowait('reload')
            except Exception:
                stale.append(q)
        for s in stale:
            clients.remove(s)

def watch_gate_loop(root_dir='.'):
    """Vòng lặp Watch Gate với cơ chế Debounce chống dồn sự kiện lưu file."""
    last_mtimes = get_watched_files(root_dir)
    while True:
        time.sleep(0.2)
        curr_mtimes = get_watched_files(root_dir)
        changed = [f for f, mt in curr_mtimes.items() if f not in last_mtimes or mt > last_mtimes.get(f, 0)]
        
        if changed:
            # ponytail: sleep debounce đơn giản bằng time.sleep, nâng cấp lên asyncio/watchdog khi dự án vượt 10k files
            time.sleep(DEBOUNCE_SEC)
            curr_mtimes = get_watched_files(root_dir)
            all_changed = [f for f, mt in curr_mtimes.items() if f not in last_mtimes or mt > last_mtimes.get(f, 0)]
            last_mtimes = curr_mtimes
            
            names = ", ".join(os.path.basename(f) for f in all_changed)
            print(f"\033[93m[WATCH GATE]\033[0m Sửa đổi ({len(all_changed)} tệp: {names}) -> Tự động reload trình duyệt!")
            broadcast_reload()

class GameHTTPHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        # Ẩn bớt log truy cập tĩnh thông thường để console gọn gàng
        if args and str(args[0]).startswith(('200', '304')) and '/__live_reload' in str(self.path):
            return
        super().log_message(format, *args)

    def do_GET(self):
        clean_path = self.path.split('?')[0]

        # 1. Endpoint Server-Sent Events cho Live Reload
        if clean_path == '/__live_reload':
            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream; charset=utf-8')
            self.send_header('Cache-Control', 'no-cache, no-transform')
            self.send_header('Connection', 'keep-alive')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            q = queue.Queue()
            with clients_lock:
                clients.append(q)
            try:
                self.wfile.write(b": connected\n\n")
                self.wfile.flush()
                while True:
                    msg = q.get()
                    if msg is None:
                        break
                    self.wfile.write(f"data: {msg}\n\n".encode('utf-8'))
                    self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError, OSError):
                pass
            finally:
                with clients_lock:
                    if q in clients:
                        clients.remove(q)
            return

        # 2. Điều hướng trang chủ '/' hoặc '/index.html' vào file game
        target_file = None
        if clean_path in ('/', '/index.html', '/ban-lang-kieu-mau.html', '/ban-lang-kieu-mau'):
            target_file = TARGET_GAME_FILE
        elif clean_path.endswith('.html'):
            local_fp = clean_path.lstrip('/')
            if os.path.exists(local_fp):
                target_file = local_fp

        if target_file and os.path.exists(target_file):
            try:
                with open(target_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                injected = inject_live_reload(content)
                encoded = injected.encode('utf-8')

                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', str(len(encoded)))
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                self.end_headers()
                self.wfile.write(encoded)
                return
            except Exception as e:
                self.send_error(500, f"Error reading {target_file}: {e}")
                return

        return super().do_GET()

def run_self_check():
    """Kiểm tra logic cốt lõi (test không dùng framework)."""
    print("[TEST] Bắt đầu tự kiểm tra...")
    assert os.path.exists(TARGET_GAME_FILE), f"File {TARGET_GAME_FILE} phải tồn tại"
    sample = "<html><body><h1>Test</h1></body></html>"
    injected = inject_live_reload(sample)
    assert "__live_reload_script" in injected, "Phải tiêm được script reload"
    assert "__dev_state" in injected, "Phải hỗ trợ lưu và phục hồi dev state"
    assert "Hot Reload" in injected, "Phải hỗ trợ hot reload CSS"
    assert "</body>" in injected, "Thẻ body phải được giữ nguyên"
    
    # Kiểm tra cổng ngẫu nhiên
    import urllib.request
    test_port = 8999
    server = ThreadingHTTPServer(('127.0.0.1', test_port), GameHTTPHandler)
    server.daemon_threads = True
    th = threading.Thread(target=server.serve_forever, daemon=True)
    th.start()
    try:
        url = f"http://127.0.0.1:{test_port}/"
        with urllib.request.urlopen(url, timeout=3) as resp:
            data = resp.read().decode('utf-8')
            assert resp.status == 200
            assert "__live_reload_script" in data
            print(f"[TEST] Kết nối HTTP và tiêm script thành công (Status: {resp.status})")
    finally:
        server.shutdown()
        server.server_close()
    print("[TEST] Toàn bộ kiểm tra vượt qua thành công!")
    return True

def main():
    args = sys.argv[1:]
    if '--test' in args:
        success = run_self_check()
        sys.exit(0 if success else 1)

    port = DEFAULT_PORT
    for i, a in enumerate(args):
        if a in ('--port', '-p') and i + 1 < len(args):
            try:
                port = int(args[i + 1])
            except ValueError:
                pass
        elif a.isdigit():
            port = int(a)

    # ponytail: tự chọn cổng tiếp theo nếu cổng bận, nâng cấp sang port-manager socket nếu cần chia sẻ multi-service
    server = None
    for p in range(port, port + 10):
        try:
            server = ThreadingHTTPServer(('0.0.0.0', p), GameHTTPHandler)
            server.daemon_threads = True
            port = p
            break
        except OSError:
            continue

    if not server:
        print(f"\033[91m[LỖI]\033[0m Không thể mở cổng từ {port} đến {port + 9}. Vui lòng tắt bớt ứng dụng đang chạy.")
        sys.exit(1)

    # Bật luồng theo dõi file Watch Gate
    watch_th = threading.Thread(target=watch_gate_loop, daemon=True)
    watch_th.start()

    url = f"http://localhost:{port}/"
    print("\033[92m==========================================================\033[0m")
    print("\033[92m       BẢN LÀNG KIỂU MẪU — SERVER ĐANG CHẠY\033[0m")
    print("\033[92m==========================================================\033[0m")
    print(f" \033[96m• Địa chỉ game :\033[0m {url}")
    print(f" \033[96m• Tệp chính   :\033[0m {TARGET_GAME_FILE}")
    print(f" \033[96m• Tự cập nhật :\033[0m Watch Gate (Debounce {int(DEBOUNCE_SEC*1000)}ms) + Live Reload")
    print(" \033[90m(Mỗi khi lưu file HTML/CSS/JS, trình duyệt sẽ tự động làm mới)\033[0m")
    print("\033[92m==========================================================\033[0m")
    print("Nhấn \033[93mCtrl+C\033[0m để dừng máy chủ.\n")

    # Tự động mở trình duyệt nếu không có cờ --no-open
    if '--no-open' not in args:
        try:
            webbrowser.open(url)
        except Exception:
            pass

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\033[93m[ĐÃ DỪNG]\033[0m Máy chủ đã kết thúc an toàn.")
        server.server_close()

if __name__ == '__main__':
    main()
