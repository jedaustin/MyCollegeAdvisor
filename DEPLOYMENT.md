# Docker Deployment Guide

This guide explains how to deploy the Personal College Advisor application using Docker.

## Prerequisites

- Docker Engine 24.0+ ([Install Docker](https://docs.docker.com/engine/install/))
- Docker Compose 2.20+ (included with Docker Desktop)
- A Perplexity API key ([Get one here](https://www.perplexity.ai/api))

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd <your-repo-directory>
```

### 2. Configure Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and set your values:

```bash
# Required: Add your Perplexity API key
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxx

# Required: Generate a random session secret
SESSION_SECRET=$(openssl rand -base64 32)

# Optional: Change database credentials
POSTGRES_PASSWORD=your_secure_password_here
```

### 3. Build and Run

```bash
# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f app

# Check status
docker compose ps
```

### 4. Run Database Migrations

Use the dedicated migrations compose file to set up the database schema:

```bash
# Run migrations (this uses the builder stage with drizzle-kit)
docker compose -f docker-compose.yml -f docker-compose.migrations.yml run --rm migrations
```

This command:
- Uses the builder stage which has drizzle-kit installed
- Connects to the PostgreSQL database
- Runs `npm run db:push` to sync the schema
- Automatically removes the container when done

### 5. Access the Application

Open your browser to:
- **Application**: http://localhost:5000

## Production Deployment

### Security Checklist

Before deploying to production:

1. **Environment Variables**
   - ✅ Set a strong `SESSION_SECRET` (at least 32 random characters)
   - ✅ Use a secure `POSTGRES_PASSWORD`
   - ✅ Never commit `.env` to version control

2. **Network Configuration**
   - ✅ Use a reverse proxy (nginx/Caddy) with HTTPS
   - ✅ Configure firewall rules
   - ✅ Enable rate limiting

3. **Database**
   - ✅ Regular backups of `postgres_data` volume
   - ✅ Use managed PostgreSQL in production if possible

### Reverse Proxy Setup (nginx example)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Common Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f app
docker compose logs -f postgres

# Restart application
docker compose restart app

# Rebuild after code changes
docker compose up -d --build app

# Run migrations (after schema changes)
docker compose -f docker-compose.yml -f docker-compose.migrations.yml run --rm migrations

# Access database
docker compose exec postgres psql -U postgres -d college_advisor

# Backup database
docker compose exec postgres pg_dump -U postgres college_advisor > backup.sql

# Restore database
docker compose exec -T postgres psql -U postgres college_advisor < backup.sql

# Clean everything (WARNING: deletes data)
docker compose down -v --rmi all
```

## Monitoring

### Health Checks

The application includes health check endpoints:

```bash
# Check application health
curl http://localhost:5000/api/health

# Check database health
docker compose exec postgres pg_isready -U postgres
```

### View Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df
```

## Troubleshooting

### Application won't start

1. Check logs: `docker compose logs app`
2. Verify environment variables: `docker compose config`
3. Ensure database is healthy: `docker compose ps postgres`

### Database connection errors

1. Wait for PostgreSQL to fully start: `docker compose logs postgres`
2. Verify `DATABASE_URL` is correct
3. Run migrations: `docker compose -f docker-compose.yml -f docker-compose.migrations.yml run --rm migrations`

### Port already in use

Change the port in `docker-compose.yml`:

```yaml
services:
  app:
    ports:
      - "8080:5000"  # Change 8080 to any available port
```

## Scaling

To run multiple application instances behind a load balancer:

```bash
# Scale to 3 instances
docker compose up -d --scale app=3

# Use nginx or HAProxy for load balancing
```

## Updates

### Updating the Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose up -d --build app

# Run any new migrations
docker compose -f docker-compose.yml -f docker-compose.migrations.yml run --rm migrations
```

## Backup Strategy

### Automated Backups

Create a cron job for regular backups:

```bash
# Add to crontab (runs daily at 2 AM)
0 2 * * * docker compose -f /path/to/docker-compose.yml exec -T postgres pg_dump -U postgres college_advisor | gzip > /backups/college_advisor_$(date +\%Y\%m\%d).sql.gz
```

### Volume Backup

```bash
# Backup postgres data volume
docker run --rm \
  -v college_advisor_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres_data_backup.tar.gz /data
```

## Performance Tuning

### PostgreSQL Configuration

For production workloads, tune PostgreSQL by creating a custom config:

```yaml
# In docker-compose.yml
postgres:
  command: 
    - "postgres"
    - "-c"
    - "shared_buffers=256MB"
    - "-c"
    - "max_connections=200"
```

### Application Scaling

- Use `PM2` or cluster mode for multi-core support
- Add Redis for session storage
- Implement caching for AI responses

## Support

For issues specific to Docker deployment, check:
- Application logs: `docker compose logs app`
- Database logs: `docker compose logs postgres`
- Container status: `docker compose ps`

---

**Note**: This setup is production-ready but should be customized based on your infrastructure and security requirements.
