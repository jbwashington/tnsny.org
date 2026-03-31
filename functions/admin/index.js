/**
 * Cloudflare Pages Function: /admin/
 *
 * Serves the Decap CMS admin page with the GitHub token pre-injected.
 * This eliminates the popup auth flow entirely — the CMS loads already
 * authenticated. Cloudflare Access should protect this route in production.
 */
export async function onRequestGet(context) {
  const token = context.env.GITHUB_TOKEN;

  if (!token) {
    return new Response("Server misconfiguration: GITHUB_TOKEN not set", {
      status: 500,
    });
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex" />
  <title>TNS Content Manager</title>
  <style>
    body { margin: 0; }
    .loading {
      display: flex; align-items: center; justify-content: center;
      height: 100vh; font-family: -apple-system, system-ui, sans-serif;
      color: #1e3a5f; font-size: 18px;
    }
    .loading::after {
      content: "Loading CMS...";
    }
  </style>
</head>
<body>
  <div class="loading" id="loading"></div>
  <script>
    // Pre-authenticate Decap CMS with the GitHub backend token.
    // This runs before Decap loads, so when init() fires it finds
    // a valid token and skips the login screen entirely.
    window.CMS_MANUAL_INIT = true;
  </script>
  <script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
  <script>
    (function() {
      var token = ${JSON.stringify(token)};

      // Decap CMS stores GitHub auth in localStorage under this key
      var backendKey = "netlify-cms-user";
      var authData = JSON.stringify({
        token: token,
        name: "TNS Editor",
        login: "tns-cms-bot",
        avatar_url: "",
        backendName: "github"
      });
      localStorage.setItem(backendKey, authData);

      // Remove loading indicator
      var el = document.getElementById("loading");
      if (el) el.remove();

      // Initialize CMS
      if (window.CMS) {
        window.CMS.init();
      }
    })();
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html;charset=UTF-8",
      "Cache-Control": "no-store",
    },
  });
}
