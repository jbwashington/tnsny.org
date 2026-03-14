# The Neighborhood School (PS363M) Website

A Hugo static site for The Neighborhood School, a progressive public elementary school in NYC's East Village. Content is managed via Decap CMS by non-technical editors.

## Tech Stack

- **Hugo** — Static site generator
- **Decap CMS** — Visual content editor at `/admin/`
- **Tailwind CSS** — Styling via CDN (no build step)
- **Cloudflare Pages** — Free hosting + Functions
- **Cloudflare Access** — Authentication for the CMS (no GitHub accounts needed)

## How It Works

```
Editor visits tnsny.org/admin/
        │
        ▼
Cloudflare Access gates the route
(email OTP or Google login)
        │
        ▼
Decap CMS loads, calls /auth function
        │
        ▼
Cloudflare Pages Function returns
a GitHub bot token (env secret)
        │
        ▼
Editor uses visual CMS → changes commit to GitHub → auto-deploy
```

Editors never touch git, the terminal, or code. They see a WordPress-like UI.

## Local Development

```bash
# Requires Hugo (https://gohugo.io/installation/)
hugo server -D
```

Site available at `http://localhost:1313/`.

## Deployment to Cloudflare Pages

### 1. Create the GitHub repo

```bash
gh repo create tns-pta/tnsny.org --public --source=. --push
```

### 2. Create a GitHub fine-grained PAT

Go to https://github.com/settings/tokens?type=beta and create a token:
- **Name:** `tnsny-cms-bot`
- **Repository access:** Only select `tns-pta/tnsny.org`
- **Permissions → Repository → Contents:** Read and write
- Copy the token — you'll need it in step 4

### 3. Connect to Cloudflare Pages

1. Cloudflare Dashboard → **Pages** → **Create a project** → **Connect to Git**
2. Select the `tns-pta/tnsny.org` repository
3. Build settings:
   - **Framework preset:** Hugo
   - **Build command:** `hugo`
   - **Build output directory:** `public`
4. Environment variables:
   - `HUGO_VERSION` = `0.157.0`
   - `GITHUB_TOKEN` = *(the PAT from step 2)* — **mark as encrypted/secret**
5. Deploy

### 4. Set up custom domain

Since DNS is already on Cloudflare:
1. Pages project → **Custom domains** → Add `tnsny.org`
2. Cloudflare auto-configures the DNS record
3. SSL is automatic

### 5. Set up Cloudflare Access (CMS authentication)

This protects `/admin/` and `/auth` so only approved people can reach the CMS.

1. Cloudflare Dashboard → **Zero Trust** → **Access** → **Applications** → **Add an application**
2. Choose **Self-hosted**
3. Configure:
   - **Application name:** `TNS Website CMS`
   - **Application domain:** `tnsny.org`
   - **Path:** `admin` (this also covers `/auth` since Access uses path prefix matching)
4. Add a second rule for the auth endpoint:
   - **Path:** `auth`
5. Create an **Access Policy**:
   - **Policy name:** `Approved Editors`
   - **Action:** Allow
   - **Include rule → Emails:**
     - `sparker@tnsny.org` (Assistant Principal)
     - `ptapresident@tnsny.org` (PTA)
     - *(add parent volunteer emails as needed)*
   - OR **Include rule → Email domain:** `tnsny.org` (all school staff)
6. **Authentication method:** One-time PIN (simplest — editors get an email code)
   - Or connect Google as an IdP if you want "Sign in with Google"
7. Save

### 6. Test

1. Visit `tnsny.org/admin/`
2. Cloudflare Access prompts for authentication
3. After auth, Decap CMS loads
4. Click "Login" — the `/auth` function returns the bot token
5. Edit a page, save — change commits to GitHub, site auto-deploys in ~30 seconds

## Adding/Removing Editors

Cloudflare Dashboard → Zero Trust → Access → Applications → TNS Website CMS → Policies

Add or remove email addresses. No GitHub accounts, no passwords to manage. Changes take effect immediately.

## Content Management

### For editors (via CMS)

1. Go to `tnsny.org/admin/`
2. Authenticate via email code
3. Use the visual editor to update pages, create news posts, manage staff
4. Click "Publish" — changes go live in ~30 seconds

### For developers (via files)

Content is in `content/` as Markdown. Staff data is in `data/staff.json`.

## Site Structure

```
content/
  _index.md              # Homepage
  about/                 # About TNS, Mission, Principal's Message, Donate
  academics/             # Admissions, Classes, Curriculum, After School
  families/              # Forms, Links, PTA, OMNY Cards, Volunteer
  news/                  # News posts
  staff/                 # Staff directory page
  contact/               # Contact page
data/
  staff.json             # Staff directory data
functions/
  auth/index.js          # Cloudflare Pages Function (CMS auth)
layouts/                 # Hugo templates
static/
  admin/                 # Decap CMS config
  images/                # Uploaded images
```

## Costs

| Service | Cost |
|---|---|
| Cloudflare Pages | Free (500 builds/month) |
| Cloudflare Access | Free (up to 50 users) |
| Decap CMS | Free (open source) |
| Hugo | Free (open source) |
| GitHub | Free |
| **Total** | **$0/month** |

## Handoff Checklist

When transferring ownership to a new maintainer:

- [ ] Transfer the GitHub repo (or add them as admin)
- [ ] Add their email to the Cloudflare Access policy
- [ ] Rotate the `GITHUB_TOKEN` PAT (create new one, update in Cloudflare Pages env vars)
- [ ] (Optional) Transfer Cloudflare account or add them as a member
