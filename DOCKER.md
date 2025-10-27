# Containerizing the Project

This project runs as two containers: FastAPI server and a static React client (served by Nginx). MongoDB Atlas remains the database.

## Prerequisites
- Docker and Docker Compose
- A MongoDB Atlas URI and DB name in `server/.env`:

```
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
DB_NAME=<your_db>
JWT_SECRET=<your_secret>
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=120
```

## Build and Run

```bash
# From repo root
docker compose build
docker compose up -d
```

- API: http://localhost:8000/docs
- Client: http://localhost:3000

## Notes
- The client expects the API at the same host. Your axios logic already auto-detects http://localhost:8000.
- If you need to proxy API via Nginx, edit `client-react/nginx.conf` and rebuild.
- CORS is permissive in dev; for production, lock down `allow_origins` in `server/main.py`.

## Stop and Clean
```bash
docker compose down
```

## Troubleshooting
- If server can’t reach MongoDB Atlas, ensure your IP is allowed in Atlas Network Access and credentials are correct.
- To view logs:
```bash
docker compose logs -f server
```