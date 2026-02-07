# Base Path Support - Quick Reference

The Car Expense Tracker now supports deployment under a custom base path (subpath).

## Quick Setup

1. **Set environment variable:**
   ```env
   NEXT_PUBLIC_BASE_PATH=/car-tracker
   ```

2. **Rebuild:**
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```

3. **Access:**
   ```
   http://localhost:3000/car-tracker
   ```

## Files Modified

- `next.config.ts` - Added `basePath` and `assetPrefix` configuration
- `.env.local` - Added `NEXT_PUBLIC_BASE_PATH` variable
- `.env.example` - Documented the base path option
- `docker-compose.yml` - Added base path environment variable
- `app/BootstrapClient.tsx` - Fixed TypeScript error
- `src/components/MileageChart.tsx` - Fixed null safety
- `src/lib/services/authService.ts` - Fixed JWT type issues

## Files Created

- `docker-compose.traefik.yml` - Example with Traefik reverse proxy
- `nginx.conf.example` - Example nginx configuration
- `BASE_PATH.md` - Complete base path documentation
- `BASE_PATH_SUMMARY.md` - This file

## How It Works

- The `NEXT_PUBLIC_BASE_PATH` environment variable is read at build time
- Next.js automatically prefixes all routes and assets with the base path
- Navigation links use relative paths, so they work automatically
- API routes are also prefixed with the base path

## Important Notes

- Base path must start with `/` and NOT end with `/`
- Must rebuild after changing the base path (it's a build-time configuration)
- Works with all reverse proxies (nginx, Apache, Traefik, Caddy)
- Leave empty or omit the variable for root path deployment

## Examples

### Root Path (Default)
```env
# No base path variable needed
```
Access: `http://example.com/`

### With Base Path
```env
NEXT_PUBLIC_BASE_PATH=/car-tracker
```
Access: `http://example.com/car-tracker`

### Nested Path
```env
NEXT_PUBLIC_BASE_PATH=/apps/car-tracker
```
Access: `http://example.com/apps/car-tracker`

## Documentation

- Full guide: `BASE_PATH.md`
- Docker deployment: `DOCKER.md`
- Nginx example: `nginx.conf.example`
- Traefik example: `docker-compose.traefik.yml`
