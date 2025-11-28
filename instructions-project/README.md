# Instructions Project

Fullstack Node.js application with Vite/React frontend and Express backend.

## Docker Development Setup

### Prerequisites

- [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
- Git
- Your Supabase credentials

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/andrebids/instructions.git
   cd instructions
   ```

2. **Create your `.env` file**
   ```bash
   copy .env.example .env
   ```
   
   Edit `.env` and fill in your actual values:
   - Supabase credentials (`DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
   - Authentication secrets (`AUTH_SECRET`, `VITE_CLERK_PUBLISHABLE_KEY`)
   - Email SMTP settings (`EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASSWORD`)

3. **Start the development environment**
   ```bash
   docker compose -f docker-compose.dev.yml up
   ```

4. **Access the application**
   - Frontend: http://localhost:3003
   - Backend API: http://localhost:5001

### Development Commands

```bash
# Start containers (with logs)
docker compose -f docker-compose.dev.yml up

# Start containers in background
docker compose -f docker-compose.dev.yml up -d

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Stop containers
docker compose -f docker-compose.dev.yml down

# Stop and remove volumes (WARNING: deletes uploads!)
docker compose -f docker-compose.dev.yml down -v

# Rebuild after dependency changes
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up
```

### Hot Reload

The development setup includes hot reload for both client and server:
- **Client**: Vite dev server with HMR (Hot Module Replacement)
- **Server**: Nodemon watches for file changes and restarts automatically
- **Windows compatibility**: Uses polling (`CHOKIDAR_USEPOLLING=true`) for reliable file watching

### Persistent Uploads

Uploads are stored in a Docker volume named `instructions-uploads`. This ensures your uploaded files persist across container restarts.

To backup uploads:
```bash
# Find the volume location
docker volume inspect instructions-uploads

# Copy files from volume to local directory
docker run --rm -v instructions-uploads:/source -v ${PWD}/backup:/backup alpine cp -r /source /backup
```

### Troubleshooting

**Port conflicts:**
- If ports 5001 or 3003 are in use, edit `docker-compose.dev.yml` and change the port mappings
- Format: `"HOST_PORT:CONTAINER_PORT"`

**File changes not detected:**
- Ensure `CHOKIDAR_USEPOLLING=true` is set in `docker-compose.dev.yml`
- Try increasing polling interval if CPU usage is high

**Dependencies not updating:**
- Rebuild the container: `docker compose -f docker-compose.dev.yml build --no-cache`

**Database connection issues:**
- Verify your `DATABASE_URL` in `.env` is correct
- Check Supabase project is active and accessible
- Ensure `NODE_OPTIONS=--dns-result-order=ipv4first` is set

**Container won't start:**
- Check logs: `docker compose -f docker-compose.dev.yml logs`
- Verify `.env` file exists and has all required variables
- Ensure Docker Desktop is running

## Production Deployment

### Build Production Image

```bash
docker build -t instructions-prod .
```

### Run Production Container

```bash
docker run -d \
  --name instructions-app \
  -p 5000:5000 \
  --env-file .env \
  -v instructions-uploads:/app/server/public/uploads \
  instructions-prod
```

### GitHub Container Registry

The project includes a GitHub Actions workflow for building multi-architecture images:

1. Go to your repository on GitHub
2. Navigate to **Actions** tab
3. Select **Build and Push Docker Image** workflow
4. Click **Run workflow**
5. The image will be pushed to `ghcr.io/andrebids/instructions`

Pull and run the image:
```bash
docker pull ghcr.io/andrebids/instructions:latest
docker run -d -p 5000:5000 --env-file .env ghcr.io/andrebids/instructions:latest
```

## Environment Variables

See `.env.example` for all required environment variables. Key variables:

- `DATABASE_URL`: Supabase connection string
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)
- `AUTH_URL`: Backend URL for authentication
- `FRONTEND_URL`: Frontend URL for CORS and redirects
- `EMAIL_*`: SMTP configuration for emails

## Project Structure

```
instructions-project/
├── client/              # Vite/React frontend
├── server/              # Express backend
├── scripts/             # Deployment and utility scripts
├── Dockerfile           # Production build
├── Dockerfile.dev       # Development build
├── docker-compose.dev.yml  # Development orchestration
└── .env.example         # Environment template
```

## License

Private project - All rights reserved
