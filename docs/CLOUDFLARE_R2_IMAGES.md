# Product images on Cloudflare R2 — setup guide

The code is already fully wired. This doc covers only the Cloudflare side
plus the 5 env vars. Nothing to code.

## How the flow works (already implemented)

```
Dashboard                    Backend (/api)                  R2 bucket
   │  POST /products/:id/image/presign {filename}   │              │
   │ ─────────────────────────────────────────────▶ │              │
   │  ← { uploadUrl (5-min expiry), key, imageUrl } │              │
   │  PUT file bytes ────────────────────────────────────────────▶│ (direct, backend never touches bytes)
   │  PATCH /products/:id { imageKey: key }                        │
   │ ─────────────────────────────────────────────▶ │  stores imageKey only
                                                    │  imageUrl is DERIVED as R2_PUBLIC_URL + "/" + imageKey
```

- Object keys look like `products/<productId>/<uuid>.jpg` (`backend/src/images/r2.service.ts`).
- Replacing an image or deleting a product auto-deletes the old R2 object — no orphans.
- The register syncs `imageKey`/`imageUrl` and caches each image to per-user disk
  (`~/.config/register/images/`); the till works fully offline afterwards.

## 1. Create the bucket

Cloudflare dashboard → **R2 Object Storage** → **Create bucket**:

- Name: `pos-product-images` (must match `R2_BUCKET`)
- Location: **Automatic**

## 2. Enable public reads

Pick one. `R2_PUBLIC_URL` (no trailing slash) must match your choice.

**Option A — quick start (dev):** bucket → **Settings** → **Public access** →
**Allow Access**. You get `https://pub-<hash>.r2.dev`. Set:

```
R2_PUBLIC_URL="https://pub-<hash>.r2.dev"
```

**Option B — production:** bucket → **Settings** → **Custom Domains** →
**Connect Domain** (e.g. `images.yourdomain.com`; the domain must already be
on Cloudflare). Set:

```
R2_PUBLIC_URL="https://images.yourdomain.com"
```

Custom domains get Cloudflare caching; `r2.dev` does not. Use B for shops.

## 3. CORS policy (required for dashboard uploads)

The dashboard PUTs directly from the browser to the pre-signed URL, so the
bucket must allow it. Bucket → **Settings** → **CORS policy**, paste:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3001", "https://dashboard.yourdomain.com"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["content-type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Add every origin the dashboard is ever served from.

> Gotcha: the pre-signed URL signs the `Content-Type` derived from the
> filename extension (see `mimeFromExt` in `r2.service.ts`). The browser PUT
> **must** send that exact `Content-Type` header or R2 returns
> `SignatureDoesNotMatch`. Any dashboard uploader must set it explicitly —
> it cannot rely on fetch defaults.

## 4. API token

**R2** overview → **Manage R2 API Tokens** (account-level, separate from the
main API-tokens page) → **Create API token**:

- Permissions: **Object Read & Write**
- Scope: **Apply to specific buckets only** → `pos-product-images`
- TTL: leave permanent (or rotate on your own schedule)

Save three things (the secret is shown **once**):

| Value | Where |
|---|---|
| Access Key ID | `R2_ACCESS_KEY_ID` |
| Secret Access Key | `R2_SECRET_ACCESS_KEY` |
| Account ID (in the endpoint URL shown) | `R2_ACCOUNT_ID` |

Least privilege on purpose: this token can only touch the images bucket,
and the browser only ever sees 5-minute single-object PUT URLs — never the token.

## 5. Backend env

In `backend/.env`:

```
R2_ACCOUNT_ID="<from step 4>"
R2_ACCESS_KEY_ID="<from step 4>"
R2_SECRET_ACCESS_KEY="<from step 4>"
R2_BUCKET="pos-product-images"
R2_PUBLIC_URL="https://images.yourdomain.com"
```

Restart the backend (`npm run dev:backend`).

## 6. End-to-end test

```bash
API=http://localhost:3000/api
ID=<an existing product uuid>   # GET $API/products to pick one

# 1. Pre-sign
PRESIGN=$(curl -s -X POST $API/products/$ID/image/presign \
  -H 'Content-Type: application/json' -d '{"filename":"milk.jpg"}')
echo "$PRESIGN" | jq .
URL=$(echo "$PRESIGN" | jq -r .uploadUrl)
KEY=$(echo "$PRESIGN" | jq -r .key)

# 2. Upload bytes DIRECTLY to R2 (note the explicit Content-Type — see gotcha above)
curl -X PUT "$URL" -H 'Content-Type: image/jpeg' --data-binary @/path/to/milk.jpg

# 3. Attach key to the product
curl -s -X PATCH $API/products/$ID \
  -H 'Content-Type: application/json' -d "{\"imageKey\":\"$KEY\"}" | jq .imageUrl

# 4. Public read works?
curl -s -o /dev/null -w '%{http_code}\n' "$(curl -s $API/products/$ID | jq -r .imageUrl)"
# → 200

# 5. Register picks it up on next sync (≤30s) into ~/.config/register/images/
ls ~/.config/register/images/ | grep $ID
```

Cleanup test: `curl -X DELETE $API/products/$ID/image` clears the row and
deletes the R2 object.

## 7. Costs (approx, check current Cloudflare pricing)

R2 has no egress fees — the reason it beats S3 for image serving. Rough
free tier: ~10 GB storage, ~1M write / ~10M read ops per month. A grocery
catalog (a few thousand thumbnails) sits comfortably inside free.

## 8. Troubleshooting

| Symptom | Cause → fix |
|---|---|
| `presign` returns 500 | Wrong `R2_ACCOUNT_ID` / keys / `R2_BUCKET` name → recheck step 4–5, restart backend |
| Browser PUT 403 `SignatureDoesNotMatch` | `Content-Type` sent ≠ extension-derived type → set it explicitly |
| Browser PUT 403 CORS error | Bucket CORS policy missing the dashboard origin → step 3 |
| `imageUrl` is `null` on products | `R2_PUBLIC_URL` empty → step 5 |
| Image URL 403 on GET | Bucket not public / wrong `R2_PUBLIC_URL` → step 2 |
| Register never caches | Check register sync logs; needs backend reachable + `imageUrl` non-null |

## Still to build

The dashboard has **no upload UI yet** — nothing under `dashboard/src` calls
the presign flow. When you want it: file picker → `POST presign` →
`PUT` to R2 with matching `Content-Type` (+ 4 MB client-side size check,
which the backend intentionally does not enforce) → `PATCH` product.
