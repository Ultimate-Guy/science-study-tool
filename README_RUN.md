Quick local run instructions

If the site appears blank when opened directly from the filesystem (file://), run a simple HTTP server and open http://127.0.0.1:8000 in your browser.

Python 3:

```bash
python3 -m http.server 8000
```

Node (http-server):

```bash
npm install -g http-server
http-server -p 8000
```

Then visit:

http://127.0.0.1:8000/index.html

Notes:
- Service workers and some proxy features require the site to be served over HTTP/HTTPS.
- If you still see a blank page, open Developer Tools (F12) and check the Console for errors. Paste them here and I'll diagnose further.
