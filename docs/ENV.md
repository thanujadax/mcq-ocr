# 🔧 Environment Variable Reference

Every environment variable used by the Edumark stack, where it's read, and how to set it. The [README](../README.md) walks through *what* to do; this file is the exhaustive *which* and *why*.

---

## 🗂️ The three env files

| File | Read by | Purpose | Gitignored? |
|---|---|---|---|
| `.env` | `docker compose` (at the project root) | `${VAR}` interpolation inside `docker-compose.yml` and `docker-compose.override.yml`. | yes |
| `.env.app` | backend & worker containers, via `env_file:` in compose | Runtime application config — read by `app.config.Settings` (pydantic-settings). | yes |
| `next_frontend/.env.local` | `next dev` and `next build` | Local development overrides for `NEXT_PUBLIC_*` browser vars. | yes |

Templates with safe placeholders live next to each file: [.env.example](../.env.example), [.env.app.example](../.env.app.example), [next_frontend/.env.local.example](../next_frontend/.env.local.example). Start by copying them.

### Values that must match across files

A few credentials appear in both `.env` (where the broker/db containers are initialised) and `.env.app` (where the backend connects to them). If they drift, the backend will fail to connect.

| `.env` | matching `.env.app` |
|---|---|
| `POSTGRES_USER` | `DATABASE_USER` *and* the user-portion of `DATABASE_URL` |
| `POSTGRES_PASSWORD` | `DATABASE_PASSWORD` *and* the password-portion of `DATABASE_URL` |
| `POSTGRES_DB` | `DATABASE_NAME` *and* the db-portion of `DATABASE_URL` |
| `RABBITMQ_USER` | `RABBITMQ_USER` *and* the user-portion of `RABBITMQ_URL` |
| `RABBITMQ_PASSWORD` | `RABBITMQ_PASSWORD` *and* the password-portion of `RABBITMQ_URL` |

### Escaping `$` in `.env.app`

`docker compose` performs variable interpolation on `env_file:` values too, so any literal `$` (notably in bcrypt hashes like `$2b$12$…`) must be doubled to `$$`. At container runtime Compose un-escapes it back to a single `$`.

Example:
```bash
# Wrong — Compose treats $2b, $12, $Y0... as variable references
SUPER_USER_PASSWORD=$2b$12$Y0tzgY...

# Right
SUPER_USER_PASSWORD=$$2b$$12$$Y0tzgY...
```

---

## 🐳 `.env` — compose-time variables

These are only used by `docker compose` to substitute into the YAML before launching containers.

| Variable | Required | Example | Notes |
|---|---|---|---|
| `DOCKER_REGISTRY` | yes | `johndoe` | Registry namespace. Final image name is `${DOCKER_REGISTRY}/edumark:<service>-${IMAGE_TAG}`. In dev the override builds locally and the value is unused — set it to anything (e.g. `local`). In prod it must match where you pushed images with `build-and-push.sh`. |
| `IMAGE_TAG` | yes | `latest` | Tag appended to every image name. Use git SHAs in CI for traceable deploys; `latest` is fine for solo dev. |
| `DOMAIN_NAME` | yes | `edumark.example.com` | Public hostname. Substituted into `nginx/nginx.conf.template` as `server_name`. The dev override skips nginx, so set to `localhost` in dev. |
| `POSTGRES_DB` | yes | `edumark_database` | DB name created on first container start. Must equal `.env.app` `DATABASE_NAME` and the path in `DATABASE_URL`. |
| `POSTGRES_USER` | yes | `edumark_user` | DB role. Must equal `.env.app` `DATABASE_USER` and the user in `DATABASE_URL`. |
| `POSTGRES_PASSWORD` | yes | `strong-random-string` | DB password. Must equal `.env.app` `DATABASE_PASSWORD` and the password in `DATABASE_URL`. See [Generating secrets](#generating-secrets). |
| `POSTGRES_PORT` | dev only | `5432` | Host-side port the dev override binds Postgres to. Ignored in prod (no host port). |
| `RABBITMQ_USER` | yes | `admin` | Broker bootstrap user. Must equal the user in `.env.app` `RABBITMQ_URL` (and `RABBITMQ_USER`). |
| `RABBITMQ_PASSWORD` | yes | `strong-random-string` | Broker bootstrap password. Must equal the password in `.env.app` `RABBITMQ_URL` (and `RABBITMQ_PASSWORD`). |
| `RABBITMQ_PORT` | dev only | `5672` | Host-side AMQP port for the dev override. Ignored in prod. |
| `RABBITMQ_MANAGEMENT_PORT` | dev only | `15672` | Host-side port for the RabbitMQ management UI in dev. Ignored in prod. |

---

## 🐍 `.env.app` — application runtime configuration

Mounted into the backend and worker containers via `env_file: ./.env.app`. Read by `app.config.Settings` ([fastapi_backend/app/config.py](../fastapi_backend/app/config.py)). Missing required values cause the backend to **refuse to boot** — there are no insecure defaults.

### Database

| Variable | Required | Example | Notes |
|---|---|---|---|
| `DATABASE_URL` | yes | `postgresql://edumark_user:pw@postgres:5432/edumark_database` | Full SQLAlchemy connection URL. Hostname must be the compose service name (`postgres`), not `localhost`. |
| `DATABASE_HOST` | yes | `postgres` | Compose service hostname. |
| `DATABASE_PORT` | yes | `5432` | Internal Postgres port (does not depend on the host-side `POSTGRES_PORT`). |
| `DATABASE_NAME` | yes | `edumark_database` | Must equal `.env` `POSTGRES_DB`. |
| `DATABASE_USER` | yes | `edumark_user` | Must equal `.env` `POSTGRES_USER`. |
| `DATABASE_PASSWORD` | yes | `…` | Must equal `.env` `POSTGRES_PASSWORD`. |
| `DATABASE_POOL_SIZE` | no | `20` | SQLAlchemy connection-pool size. |
| `DATABASE_MAX_OVERFLOW` | no | `30` | Extra connections beyond the pool. |
| `DATABASE_POOL_RECYCLE` | no | `300` | Seconds before a pooled connection is recycled. |
| `DATABASE_ECHO` | no | `false` | When `true`, SQLAlchemy logs every SQL statement. Useful for debugging; noisy for prod. |

### Application

| Variable | Required | Example | Notes |
|---|---|---|---|
| `APP_NAME` | no | `Edumark` | Shown in the FastAPI OpenAPI doc title. |
| `APP_VERSION` | no | `1.0.0` | Shown in `/health`. |
| `DEBUG` | no | `false` | Toggles FastAPI debug mode. Set `true` in dev. |
| `ENVIRONMENT` | no | `production` | Free-form label exposed via `/health`. |
| `ALLOWED_HOSTS` | yes | `https://edumark.example.com` | Comma-separated CORS origins (full origins, with scheme). In dev: `http://localhost:3000`. |
| `MAX_UPLOAD_SIZE` | no | `104857600` | Max upload size in bytes (default 100 MiB). |
| `UPLOAD_DIR` | no | `uploads` | Subdirectory under `NFS_SHARED_PATH` for incoming files. |

### Shared storage

| Variable | Required | Example | Notes |
|---|---|---|---|
| `NFS_SHARED_PATH` | yes | `/shared` | Mount point of the `nfs_storage` volume inside backend and worker containers. The `shared-storage` init container pre-creates the subdirectory tree under this path. |

### RabbitMQ

| Variable | Required | Example | Notes |
|---|---|---|---|
| `RABBITMQ_URL` | yes | `amqp://admin:pw@rabbitmq:5672` | Full AMQP URL. Hostname must be the compose service name (`rabbitmq`). |
| `RABBITMQ_HOST` | yes | `rabbitmq` | Compose service hostname. |
| `RABBITMQ_PORT` | yes | `5672` | Internal AMQP port. |
| `RABBITMQ_USER` | yes | `admin` | Must equal `.env` `RABBITMQ_USER`. |
| `RABBITMQ_PASSWORD` | yes | `…` | Must equal `.env` `RABBITMQ_PASSWORD`. |

### Queues

These are queue names, not credentials. The defaults below are wired into the worker code; only override if you're running multiple Edumark stacks on the same broker.

| Variable | Default | Notes |
|---|---|---|
| `INDEX_TASK_QUEUE` | `index_tasks` | Backend → index-recognizer (work). |
| `INDEX_RESULTS_QUEUE` | `index_results` | index-recognizer → backend (results). |
| `TEMPLATE_CONFIG_QUEUE` | `template_config_queue` | Backend → marking worker (template setup). |
| `MARKING_JOB_QUEUE` | `marking_job_queue` | Backend → marking worker (per-sheet jobs). |
| `MARKING_CONFIG_QUEUE` | `marking_scheme_config_queue` | Backend → marking worker (scheme setup). |
| `MARKING_JOB_RESULTS_QUEUE` | `marking_job_results` | Marking worker → backend. |
| `TEMPLATE_CONFIG_RESULTS_QUEUE` | `template_config_results` | Marking worker → backend. |
| `MARKING_CONFIG_RESULTS_QUEUE` | `marking_scheme_config_results` | Marking worker → backend. |
| `RABBITMQ_INCOMING_QUEUE` | `index_tasks` | Alias `index-recognizer` reads from. Should equal `INDEX_TASK_QUEUE`. |
| `RABBITMQ_OUTGOING_QUEUE` | `index_results` | Alias `index-recognizer` writes to. Should equal `INDEX_RESULTS_QUEUE`. |

### Auth

| Variable | Required | Example | Notes |
|---|---|---|---|
| `SECRET_KEY` | yes | 48-char URL-safe string | JWT signing key. **Rotate** = invalidate every issued token. See [Generating secrets](#generating-secrets). |
| `JWT_ALGORITHM` | no | `HS256` | Signing algorithm. Stick with `HS256` unless you have a reason. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | no | `30` | Lifetime of access cookies. |
| `REFRESH_TOKEN_EXPIRE_DAYS` | no | `7` | Lifetime of refresh cookies. |
| `SUPER_USER_EMAIL` | yes | `admin@example.com` | Email used to sign in as the bootstrap super-user. Created on first DB init. |
| `SUPER_USER_PASSWORD` | yes | `$$2b$$12$$…` (bcrypt) | **Bcrypt hash** of the super-user password — not the plaintext. `$` must be doubled (see [Escaping `$`](#escaping--in-envapp)). See [Generating secrets](#generating-secrets). |

### Cookies

| Variable | Required | Dev value | Prod value | Notes |
|---|---|---|---|---|
| `COOKIE_SECURE` | yes | `false` | `true` | Restrict auth cookies to HTTPS. Must be `false` over plain HTTP (dev), `true` behind TLS (prod). |
| `COOKIE_SAMESITE` | yes | `lax` | `none` | `none` allows cross-origin (frontend ↔ API on different hostnames); requires `COOKIE_SECURE=true`. |
| `COOKIE_HTTPONLY` | yes | `true` | `true` | Always `true` — keeps cookies out of `document.cookie`. |

---

## 🌐 `next_frontend/.env.local` — frontend dev overrides

Used only when running `next dev` (i.e., inside the dev override container). In production these values are baked into the image at build time by `build-and-push.sh`.

| Variable | Required | Example | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | yes | `http://localhost:8000` | Backend URL the **browser** uses. Anything prefixed `NEXT_PUBLIC_` is shipped in the JS bundle. In prod this should be the public API URL behind nginx (e.g. `https://edumark.example.com`). |

### Frontend container env (set by compose, not the user)

These are wired into the frontend service via [docker-compose.yml](../docker-compose.yml) and [docker-compose.override.yml](../docker-compose.override.yml) — usually no need to touch.

| Variable | Where set | Notes |
|---|---|---|
| `INTERNAL_BACKEND_URL` | compose (both prod and dev override) | Backend URL the **Next.js server** (middleware, SSR) uses — i.e., `http://backend:8000` over the docker network. The browser cannot reach this hostname; that's why `NEXT_PUBLIC_BACKEND_URL` exists separately. |
| `NODE_ENV` | compose | `production` in prod, `development` in dev. |

---

## 🔨 Build-time shell variables (used by `build-and-push.sh`)

These aren't read by any container — they're consumed by the build script on the dev machine.

| Variable | Required | Source | Notes |
|---|---|---|---|
| `DOCKER_REGISTRY` | yes | exported from `.env` | First positional arg to the script. The registry namespace images are tagged under. |
| `IMAGE_TAG` | no (default `latest`) | exported from `.env` | Second positional arg. |
| `BACKEND_URL` | yes | exported from `.env` | Baked into the frontend bundle as `NEXT_PUBLIC_BACKEND_URL` at `docker build` time. Must equal the public URL the browser will use to reach the API in prod (e.g. `https://edumark.example.com`). The script aborts if unset. |

Typical invocation on a dev machine:
```bash
export $(grep -v '^#' .env | xargs)
./build-and-push.sh "$DOCKER_REGISTRY" "$IMAGE_TAG"
```

---

## 🔐 Generating secrets

All secret-quality values should be freshly generated, not copied from an example. One-liners using Docker (no host Python required):

**`SECRET_KEY`** — 48-byte URL-safe random string:
```bash
docker run --rm python:3.12-slim python -c \
  "import secrets; print(secrets.token_urlsafe(48))"
```

**`SUPER_USER_PASSWORD`** — bcrypt hash of a chosen plaintext (replace `admin123`):
```bash
docker run --rm python:3.12-slim sh -c \
  "pip install -q bcrypt && python -c 'import bcrypt;print(bcrypt.hashpw(b\"admin123\", bcrypt.gensalt(12)).decode())'"
```
Paste the output into `.env.app` with `$` doubled to `$$`.

**`POSTGRES_PASSWORD`, `RABBITMQ_PASSWORD`** — any strong random string:
```bash
openssl rand -base64 32 | tr -d '/+=' | head -c 32
```

---

## 🔁 How values flow

```
.env  ──┐
        ├──►  docker compose interpolation  ──►  service env (postgres, rabbitmq, nginx)
        │                                        image names: ${DOCKER_REGISTRY}/edumark:…
        │                                        nginx DOMAIN_NAME via envsubst

.env.app ──►  env_file: mount  ──►  backend + worker containers
                                    │
                                    └──►  app.config.Settings (fail-fast on missing fields)

next_frontend/.env.local  ──►  next dev  ──►  bundled into JS (browser-visible)
```

---

## ➕ Adding a new variable

To keep things in sync:

1. **Add the new variable to the right example file** — `.env.example` for compose-time, `.env.app.example` for runtime, `next_frontend/.env.local.example` for the frontend.
2. **If it's a runtime app var**, declare it as a `Field(...)` in [fastapi_backend/app/config.py](../fastapi_backend/app/config.py). Use `Field(...)` (no default) for required values so the app fails loud if it's missing.
3. **Document it in this file** under the right table.
4. **Reference it in docker-compose.yml** if it's a compose-time var that needs to be wired through to a service.
