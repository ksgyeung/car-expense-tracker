# Base Path Configuration Guide

This guide explains how to deploy the Car Expense Tracker under a subpath (e.g., `/car-tracker` instead of the root path `/`).

## Why Use a Base Path?

You might want to use a base path when:
- Deploying multiple applications on the same domain
- Running behind a reverse proxy that routes different paths to different services
- Organizing applications under a common URL structure (e.g., `example.com/apps/car-tracker`)

## Configuration

### 1. Set the Environment Variable

Add the following to your `.env` file:

```env
NEXT_PUBLIC_BASE_PATH=/car-tracker
```

**Important Rules:**
- Must start with `/`
- Must NOT end with `/`
- Can have multiple segments: `/apps/car-tracker`
- Cannot be empty string if set (just omit the variable for root path)

**Valid Examples:**
```env
NEXT_PUBLIC_BASE_PATH=/car-tracker
NEXT_PUBLIC_BASE_PATH=/apps/expenses
NEXT_PUBLIC_BASE_PATH=/my-apps/car-expense-tracker
```

**Invalid Examples:**
```env
NEXT_PUBLIC_BASE_PATH=car-tracker      # Missing leading /
NEXT_PUBLIC_BASE_PATH=/car-tracker/    # Trailing / not allowed
NEXT_PUBLIC_BASE_PATH=                 # Empty string not allowed
```

### 2. Rebuild the Application

The base path is set at build time, so you must rebuild after changing it:

**For Docker:**
```bash
docker-compose build --no-cache
docker-compose up -d
```

**For Local Development:**
```bash
npm run build
npm start
```

### 3. Configure Your Reverse Proxy

Choose your reverse proxy and configure it accordingly:

#### Nginx

Create or edit your nginx configuration:

```nginx
location /car-tracker/ {
    proxy_pass http://localhost:3000/car-tracker/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

Reload nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

#### Apache

Enable required modules:
```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
```

Add to your Apache configuration:
```apache
ProxyPass /car-tracker http://localhost:3000/car-tracker
ProxyPassReverse /car-tracker http://localhost:3000/car-tracker
```

Reload Apache:
```bash
sudo systemctl reload apache2
```

#### Traefik

Use the provided `docker-compose.traefik.yml` or add labels to your service:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.car-expense.rule=PathPrefix(`/car-tracker`)"
  - "traefik.http.services.car-expense.loadbalancer.server.port=3000"
```

#### Caddy

Add to your Caddyfile:
```
example.com {
    handle_path /car-tracker/* {
        reverse_proxy localhost:3000
    }
}
```

## Testing

After configuration, test your deployment:

1. **Access the application:**
   ```
   http://your-domain.com/car-tracker
   ```

2. **Check the login page loads correctly**

3. **Verify all navigation links work:**
   - Dashboard link
   - API calls
   - Logout functionality

4. **Check browser console for errors:**
   - Open Developer Tools (F12)
   - Look for 404 errors or failed requests
   - All assets should load from `/car-tracker/...`

## Troubleshooting

### Issue: 404 Not Found

**Symptoms:** Page shows 404 error

**Solutions:**
1. Verify the base path matches in both the app and reverse proxy
2. Check that you rebuilt the application after changing the base path
3. Ensure the reverse proxy is forwarding to the correct port

### Issue: Assets Not Loading (CSS, JS, Images)

**Symptoms:** Page loads but looks broken, no styling

**Solutions:**
1. Check browser console for 404 errors on asset files
2. Verify `assetPrefix` is set in `next.config.ts`
3. Clear browser cache and hard reload (Ctrl+Shift+R)

### Issue: API Calls Failing

**Symptoms:** Login doesn't work, data doesn't load

**Solutions:**
1. Check browser Network tab for failed API requests
2. Verify API routes are being called with the correct base path
3. Check that the reverse proxy is forwarding API routes correctly

### Issue: Redirect Loops

**Symptoms:** Browser keeps redirecting, never loads the page

**Solutions:**
1. Check reverse proxy headers, especially `X-Forwarded-Proto`
2. Verify the base path doesn't have a trailing slash
3. Check middleware configuration in the app

## Development with Base Path

To test base path locally during development:

1. **Set the environment variable:**
   ```bash
   export NEXT_PUBLIC_BASE_PATH=/car-tracker
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Access at:**
   ```
   http://localhost:3000/car-tracker
   ```

**Note:** You'll need to manually navigate to the base path URL. The root path (`http://localhost:3000`) will show a 404.

## Removing Base Path

To deploy at the root path again:

1. **Remove or comment out the environment variable:**
   ```env
   # NEXT_PUBLIC_BASE_PATH=/car-tracker
   ```

2. **Rebuild the application:**
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```

3. **Update your reverse proxy configuration** to remove the path prefix

4. **Access at the root:**
   ```
   http://your-domain.com/
   ```

## Examples

### Example 1: Single Application with Base Path

```
Domain: example.com
Base Path: /car-tracker
Access URL: https://example.com/car-tracker
```

Configuration:
```env
NEXT_PUBLIC_BASE_PATH=/car-tracker
```

### Example 2: Multiple Applications

```
Domain: example.com
Apps:
  - Main site: https://example.com/
  - Car Tracker: https://example.com/apps/car-tracker
  - Other App: https://example.com/apps/other
```

Configuration:
```env
NEXT_PUBLIC_BASE_PATH=/apps/car-tracker
```

### Example 3: Subdomain with Base Path

```
Domain: apps.example.com
Base Path: /car-tracker
Access URL: https://apps.example.com/car-tracker
```

Configuration:
```env
NEXT_PUBLIC_BASE_PATH=/car-tracker
```

## Best Practices

1. **Use consistent paths:** Keep the base path the same across all environments
2. **Document your setup:** Note the base path in your deployment documentation
3. **Test thoroughly:** Verify all features work with the base path
4. **Use HTTPS:** Always use HTTPS in production, especially with authentication
5. **Monitor logs:** Check application and reverse proxy logs for issues
6. **Backup before changes:** Always backup your database before changing configuration

## Additional Resources

- [Next.js Base Path Documentation](https://nextjs.org/docs/app/api-reference/next-config-js/basePath)
- [Nginx Reverse Proxy Guide](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Apache Reverse Proxy Guide](https://httpd.apache.org/docs/2.4/howto/reverse_proxy.html)
