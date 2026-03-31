/**
 * Cloudflare Pages Function: /auth
 *
 * Decap CMS GitHub backend auth endpoint.
 * Instead of redirecting to GitHub OAuth (which would require each editor
 * to have a GitHub account), this returns a bot token stored as an
 * environment secret. Cloudflare Access protects this route so only
 * approved editors can reach it.
 *
 * Handles two scenarios:
 * 1. Popup mode (window.opener exists) — sends postMessage back to CMS
 * 2. Redirect mode (popup blocked) — stores token and redirects to /admin/
 *
 * Required env var (set in Cloudflare Pages → Settings → Environment Variables):
 *   GITHUB_TOKEN — a fine-grained GitHub PAT with Contents read/write on the site repo
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
<head><title>Authenticating...</title></head>
<body>
<p>Authenticating with the CMS&hellip;</p>
<script>
(function() {
  var token = ${JSON.stringify(token)};
  var provider = "github";
  var payload = JSON.stringify({ token: token, provider: provider });
  var message = "authorization:" + provider + ":success:" + payload;
  var origin = window.location.origin;

  // Case 1: Opened as a popup by Decap CMS
  if (window.opener) {
    window.opener.postMessage(message, origin);
    window.close();
    return;
  }

  // Case 2: Popup was blocked — navigated directly.
  // Store the token so the CMS can pick it up, then redirect back.
  // Decap CMS checks for the auth token in the URL hash on load.
  document.body.innerHTML = "<p>Redirecting to CMS&hellip;</p>";

  // Store in sessionStorage as a backup
  try {
    sessionStorage.setItem("decap-cms-auth", payload);
  } catch(e) {}

  // Use the message channel approach: open /admin/ and postMessage from there
  var adminUrl = origin + "/admin/";
  var newWindow = window.open(adminUrl, "_self");

  // Also try dispatching a message event after a short delay
  // in case the page loads in the same context
  setTimeout(function() {
    try {
      window.postMessage(message, origin);
    } catch(e) {}
  }, 500);
})();
</script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=UTF-8" },
  });
}
