import http.server, os, sys
ROOT='/Users/fche/Desktop/lire-marx'
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT,**k)
    def end_headers(s):
        s.send_header('Cache-Control','no-store'); super().end_headers()
    def send_head(s):
        path=s.path.split('?')[0].split('#')[0]
        fs=os.path.join(ROOT,path.lstrip('/'))
        if path.endswith('.html') and os.path.isfile(fs):
            new=path[:-5]
            if new.endswith('/index'): new=new[:-5]
            s.send_response(308); s.send_header('Location',new); s.end_headers(); return None
        if not path.endswith('/') and os.path.isfile(fs+'.html'):
            s.path=path+'.html'+(('?'+s.path.split('?',1)[1]) if '?' in s.path else '')
            return super().send_head()
        if os.path.isdir(fs) and not path.endswith('/'):
            s.send_response(308); s.send_header('Location',path+'/'); s.end_headers(); return None
        return super().send_head()
    def log_message(s,*a): pass
http.server.ThreadingHTTPServer(('127.0.0.1',int(os.environ.get('PORT') or sys.argv[1])),H).serve_forever()
