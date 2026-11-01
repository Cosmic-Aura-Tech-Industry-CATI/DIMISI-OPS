export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #070707; color: #f5f5f5; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2.5rem; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 1.5rem; backdrop-filter: blur(16px); }
      h1 { font-size: 1.25rem; font-weight: 600; margin: 0 0 0.5rem; color: #fff; }
      p { color: #a1a1aa; margin: 0 0 1.5rem; font-size: 0.875rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1.25rem; border-radius: 9999px; font: inherit; font-size: 0.875rem; font-weight: 500; cursor: pointer; text-decoration: none; border: 1px solid transparent; transition: all 0.2s; }
      .primary { background: #d4af37; color: #000; font-weight: 600; }
      .primary:hover { opacity: 0.9; }
      .secondary { background: rgba(255, 255, 255, 0.06); color: #f5f5f5; border-color: rgba(255, 255, 255, 0.15); }
      .secondary:hover { background: rgba(255, 255, 255, 0.1); }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/" onclick="event.preventDefault(); try { var u = JSON.parse(localStorage.getItem('poll-auth-user')||'{}'); var r = (u.role||'').toLowerCase(); if(r==='admin'||r==='director'){location.href='/admin';return;} if(r==='employee'||r==='intern'){location.href='/employee';return;} }catch(e){} location.href='/login';">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
