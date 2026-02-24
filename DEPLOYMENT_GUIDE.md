# Production Deployment Guide

## Current Status

✅ Frontend built with production configuration
✅ API configured to work with `index.php` in URL path
✅ Production environment files configured
✅ Migration script ready

## Deployment Steps

### 1. Upload Frontend Files

Upload the contents of `frontend/dist/` to your website root:
- Source: `frontend/dist/*`
- Destination: `/home/u189823124/domains/coreysmaller.com/public_html/`

This will deploy:
- `index.html`
- `assets/` folder with all JS and CSS files

### 2. Run Database Migration

Visit this URL in your browser:
```
https://coreysmaller.com/api/run-migration.php?password=TomBradyIsGod12
```

This will:
- Fix/create the migrations table
- Run all Laravel migrations
- Seed the admin user
- Import all 47 blog posts from markdown files

Expected output: Green checkmarks indicating success

### 3. Test the Deployment

After uploading and running migrations:

1. Visit: `https://coreysmaller.com`
2. Navigate to blog, music, video, and audio pages
3. Test login at: `https://coreysmaller.com/admin`
   - Email: `coreysmaller@gmail.com`
   - Password: `Vi$ions1`
4. Verify admin dashboard loads and shows content

### 4. Clean Up (IMPORTANT!)

Delete these debug/migration files from the server:
- `/api/run-migration.php`
- `/api/test.php` (if exists)
- `/api/debug.php` (if exists)

These files expose sensitive information and should not remain on production.

## Server Configuration

### Current Setup
- **Laravel Backend**: `/home/u189823124/domains/coreysmaller.com/public_html/laravel/`
- **API Endpoint**: `/home/u189823124/domains/coreysmaller.com/public_html/api/`
- **Frontend**: `/home/u189823124/domains/coreysmaller.com/public_html/`
- **API URL**: `https://coreysmaller.com/api/index.php/api`

### Known Issues
- `.htaccess` rewrite rules are not working on LiteSpeed server
- API requires `index.php` in the URL path
- This is a server configuration issue, not a code issue

### Optional: Fix Clean URLs

If you want to remove `index.php` from the API URL:

1. Contact your hosting provider (Hostinger)
2. Ask them to enable mod_rewrite/.htaccess processing for the `/api` directory
3. Verify that `AllowOverride All` is set for the directory
4. Once fixed, update environment files to use: `https://coreysmaller.com/api/api`

## Database Information

- **Database**: `u189823124_coreysmaller`
- **Username**: `u189823124_admin`
- **Password**: `TomBradyIsGod12`
- **Host**: `localhost`

## Admin Credentials

- **Email**: `coreysmaller@gmail.com`
- **Password**: `Vi$ions1`
- **Role**: `admin`

## Troubleshooting

### API Returns 404
- Verify `index.php` is in the API folder
- Check that `.htaccess` is present
- Ensure the URL includes `index.php`: `https://coreysmaller.com/api/index.php/api/blog`

### API Returns 500
- Check Laravel logs: `laravel/storage/logs/laravel.log`
- Verify `.env` file exists in `laravel/` folder
- Ensure database credentials are correct
- Check that cache driver is set to `file` (not `redis`)

### Frontend Shows Connection Errors
- Verify API URL in browser console
- Test API directly: `https://coreysmaller.com/api/index.php/api/blog`
- Check CORS settings in `backend-laravel/config/cors.php`

### Migration Script Fails
- Check database connection in `.env` file
- Verify database user has CREATE/ALTER permissions
- Review error messages for specific table issues

## Next Steps After Deployment

1. Monitor Laravel logs for any errors
2. Test all CRUD operations in admin panel
3. Verify SEO meta tags are working
4. Test on mobile devices
5. Set up SSL certificate if not already configured
6. Consider setting up automated backups for database

## Performance Optimization

The frontend is already optimized with:
- Code splitting by route
- Gzip compression
- Minified assets
- Lazy loading for images and components

For backend optimization:
- Enable OPcache in PHP settings
- Configure Laravel caching: `php artisan config:cache`
- Set up queue workers if needed
- Consider CDN for static assets
