/**
 * Cloudflare Pages Function: /auth
 *
 * Decap CMS GitHub backend auth endpoint.
 * Instead of redirecting to GitHub OAuth (which would require each editor
 * to have a GitHub account), this returns a bot token stored as an
 * environment secret. Cloudflare Access protects this route so only
 * approved editors can reach it.
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

  // Decap CMS opens this URL in a popup and listens for a postMessage
  // containing the auth token. We short-circuit the OAuth flow and just
  // send back the bot token immediately.
  const html = `<!DOCTYPE html>
<html>
<head><title>Authenticating...</title></head>
<body>
<p>Authenticating with the CMS&hellip;</p>
<script>
(function() {
  var token = ${JSON.stringify(token)};
  var payload = JSON.stringify({ token: token, provider: "github" });
  var origin = document.referrer
    ? new URL(document.referrer).origin
    : window.location.origin;

  if (window.opener) {
    window.opener.postMessage(
      "authorization:github:success:" + payload,
      origin
    );
    window.close();
  }
})();
</script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=UTF-8" },
  });
}
