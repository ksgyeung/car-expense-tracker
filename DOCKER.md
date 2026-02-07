# Docker Deployment Guide

This guide explains how to deploy the Car Expense Tracker using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose (optional, but recommended)

## Quick Start with Docker Compose

1. **Clone the repository and navigate to the project directory:**
   ```bash
   cd car-expense-tracker
   ```

2. **Create a `.env` file (optional):**
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file to set your configuration:
   ```env
   APP_PASSWORD=your-secure-password
   JWT_SECRET=your-very-secure-random-secret-key
   JWT_EXPIRES_IN=24h
   ```

3. **Start the application:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   Open your browser and navigate to `http://localhost:3000`

5. **View logs:**
   ```bash
   docker-compose logs -f
   ```

6. **Stop the application:**
   ```bash
   docker-compose down
   ```

## Manual Docker Build and Run

If you prefer not to use Docker Compose:

1. **Build the Docker image:**
   ```bash
   docker build -t car-expense-tracker .
   ```

2. **Run the container:**
   ```bash
   docker run -d \
     --name car-expense-tracker \
     -p 3000:3000 \
     -e APP_PASSWORD=123 \
     -e JWT_SECRET=your-secret-key-change-this \
     -e JWT_EXPIRES_IN=24h \
     -e DB_PATH=/app/data/car-expense-tracker.db \
     -v car-expense-data:/app/data \
     car-expense-tracker
   ```

3. **Stop the container:**
   ```bash
   docker stop car-expense-tracker
   docker rm car-expense-tracker
   ```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `APP_PASSWORD` | Password for authentication | `123` | Yes |
| `JWT_SECRET` | Secret key for JWT signing | - | Yes |
| `JWT_EXPIRES_IN` | JWT token expiration time | `24h` | No |
| `NEXT_PUBLIC_BASE_PATH` | Base path for deployment (e.g., `/car-tracker`) | `` (root) | No |
| `DB_PATH` | Path to SQLite database | `/app/data/car-expense-tracker.db` | No |

### JWT_EXPIRES_IN Format

Supports the following formats:
- `60s` - 60 seconds
- `5m` - 5 minutes
- `1h` - 1 hour
- `24h` - 24 hours
- `7d` - 7 days
- `30d` - 30 days

### NEXT_PUBLIC_BASE_PATH

If you want to deploy the application under a subpath (e.g., behind a reverse proxy at `/car-tracker`), set this variable:

```env
NEXT_PUBLIC_BASE_PATH=/car-tracker
```

**Important Notes:**
- The base path must start with `/` and should NOT end with `/`
- Valid: `/car-tracker`, `/apps/expenses`
- Invalid: `car-tracker`, `/car-tracker/`
- After changing the base path, you must rebuild the Docker image
- Access the app at: `http://localhost:3000/car-tracker`

## Data Persistence

The SQLite database is stored in a Docker volume named `car-expense-data`. This ensures your data persists even if the container is removed.

### Backup Database

To backup your database:

```bash
docker run --rm \
  -v car-expense-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/car-expense-backup.tar.gz -C /data .
```

### Restore Database

To restore from a backup:

```bash
docker run --rm \
  -v car-expense-data:/data \
  -v $(pwd):/backup \
  alpine sh -c "cd /data && tar xzf /backup/car-expense-backup.tar.gz"
```

## Production Deployment

For production deployment, make sure to:

1. **Change the default password:**
   ```env
   APP_PASSWORD=your-very-secure-password
   ```

2. **Use a strong JWT secret:**
   ```bash
   # Generate a random secret
   openssl rand -base64 32
   ```
   
   Then set it in your `.env`:
   ```env
   JWT_SECRET=<generated-secret>
   ```

3. **Use a reverse proxy (nginx, Traefik, etc.) for HTTPS**

4. **Set appropriate JWT expiration time:**
   ```env
   JWT_EXPIRES_IN=1h  # More secure for production
   ```

5. **Regular backups of the database volume**

### Deploying Under a Subpath

If you're deploying behind a reverse proxy under a subpath (e.g., `https://example.com/car-tracker`):

1. **Set the base path in your `.env` file:**
   ```env
   NEXT_PUBLIC_BASE_PATH=/car-tracker
   ```

2. **Rebuild the Docker image:**
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```

3. **Configure your reverse proxy:**

   **Option A: Nginx** (see `nginx.conf.example` for full configuration)
   ```nginx
   location /car-tracker/ {
       proxy_pass http://localhost:3000/car-tracker/;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```

   **Option B: Traefik** (see `docker-compose.traefik.yml` for full configuration)
   ```yaml
   labels:
     - "traefik.enable=true"
     - "traefik.http.routers.car-expense.rule=PathPrefix(`/car-tracker`)"
     - "traefik.http.services.car-expense.loadbalancer.server.port=3000"
   ```

   **Option C: Apache**
   ```apache
   ProxyPass /car-tracker http://localhost:3000/car-tracker
   ProxyPassReverse /car-tracker http://localhost:3000/car-tracker
   ```

4. **Access your application at:**
   ```
   https://example.com/car-tracker
   ```

**Example files provided:**
- `nginx.conf.example` - Complete nginx configuration
- `docker-compose.traefik.yml` - Traefik setup with base path

## Troubleshooting

### Container won't start

Check the logs:
```bash
docker-compose logs car-expense-tracker
```

### Database permission issues

Ensure the volume has proper permissions:
```bash
docker-compose down
docker volume rm car-expense-data
docker-compose up -d
```

### Port already in use

Change the port mapping in `docker-compose.yml`:
```yaml
ports:
  - "8080:3000"  # Use port 8080 instead
```

## Health Check

The container includes a health check that runs every 30 seconds. Check the health status:

```bash
docker ps
# Look for the STATUS column showing "healthy"
```

## Updating the Application

1. Pull the latest changes
2. Rebuild and restart:
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

## Development with Docker

For development, you can mount the source code:

```bash
docker run -d \
  --name car-expense-tracker-dev \
  -p 3000:3000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  -e NODE_ENV=development \
  car-expense-tracker \
  npm run dev
```
