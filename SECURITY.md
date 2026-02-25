# Security Policy

## Reporting Security Issues

If you discover a security vulnerability, please email coreysmaller@gmail.com with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

**Do not** create public GitHub issues for security vulnerabilities.

## Security Measures Implemented

### Backend (Laravel)

#### 1. Authentication & Authorization
- JWT-based authentication with tymon/jwt-auth
- Token expiration: 1 hour (configurable)
- Refresh token support
- Secure password hashing with bcrypt
- Protected routes require valid JWT token

#### 2. Rate Limiting
- Authentication endpoints: 5 attempts per 15 minutes per IP
- API endpoints: 60 requests per minute
- Write operations: 30 requests per minute
- Rate limit headers included in responses

#### 3. Security Headers
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - Browser XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` - Disables dangerous browser features
- `Content-Security-Policy` - Restricts resource loading

#### 4. CORS Configuration
- Restricted to frontend URL only
- Specific allowed methods (GET, POST, PUT, PATCH, DELETE, OPTIONS)
- Specific allowed headers
- Credentials support enabled
- 24-hour max age for preflight requests

#### 5. Input Validation
- Laravel Form Requests for all input validation
- SQL injection prevention via Eloquent ORM
- XSS prevention via output escaping
- CSRF protection (disabled for API, JWT used instead)

#### 6. Database Security
- Prepared statements via Eloquent
- No raw SQL queries without parameter binding
- Database credentials in environment variables
- Separate database users for different environments

#### 7. Error Handling
- Production mode disables debug information
- Custom error pages
- Sensitive information not exposed in errors
- Security events logged separately

### Frontend (React)

#### 1. XSS Prevention
- DOMPurify for HTML sanitization
- All user-generated content sanitized before rendering
- URL validation to prevent javascript: protocol
- Content Security Policy headers

#### 2. Authentication
- JWT tokens stored in localStorage (consider httpOnly cookies for enhanced security)
- Automatic token refresh
- Protected routes require authentication
- Token cleared on logout

#### 3. Input Validation
- URL validation for all URL inputs
- Email format validation
- Text sanitization to remove control characters
- YouTube and SoundCloud URL validation

#### 4. Secure Communication
- HTTPS enforced in production
- Secure cookie flags (when using cookies)
- CORS restricted to backend API only

## Security Best Practices

### For Developers

1. **Never commit sensitive data**
   - Use environment variables for secrets
   - Add sensitive files to .gitignore
   - Review commits before pushing

2. **Keep dependencies updated**
   ```bash
   # Backend
   composer update
   
   # Frontend
   npm update
   ```

3. **Run security audits**
   ```bash
   # Frontend
   npm audit
   npm audit fix
   
   # Backend
   composer audit
   ```

4. **Test security features**
   - Run automated tests
   - Manual security testing
   - Penetration testing before major releases

5. **Code review**
   - All code changes reviewed
   - Security-focused review for auth/input handling
   - Use static analysis tools

### For Deployment

1. **Environment Configuration**
   - Set `APP_ENV=production`
   - Set `APP_DEBUG=false`
   - Use strong, unique JWT secrets
   - Rotate secrets regularly

2. **Server Configuration**
   - Enable HTTPS/TLS
   - Configure firewall rules
   - Disable directory listing
   - Remove debug files from public directory

3. **Database Security**
   - Use strong database passwords
   - Restrict database access by IP
   - Regular backups
   - Encrypt sensitive data at rest

4. **Monitoring**
   - Monitor security logs
   - Set up alerts for suspicious activity
   - Regular security audits
   - Keep software updated

## Security Checklist

### Before Deployment

- [ ] `APP_DEBUG=false` in production
- [ ] `APP_ENV=production` in production
- [ ] Strong JWT secret generated
- [ ] Database credentials secured
- [ ] HTTPS/TLS configured
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] CORS properly restricted
- [ ] Debug files removed from public directory
- [ ] Error logging configured
- [ ] Backup strategy in place
- [ ] Security monitoring enabled

### Regular Maintenance

- [ ] Update dependencies monthly
- [ ] Review security logs weekly
- [ ] Rotate secrets quarterly
- [ ] Security audit annually
- [ ] Backup testing monthly
- [ ] Penetration testing annually

## Known Limitations

1. **JWT in localStorage**: Vulnerable to XSS. Consider migrating to httpOnly cookies.
2. **No 2FA**: Two-factor authentication not implemented yet.
3. **No CAPTCHA**: Login form doesn't have CAPTCHA protection.
4. **No CSP Reporting**: Content Security Policy violations not reported.

## Roadmap

- [ ] Implement httpOnly cookies for JWT storage
- [ ] Add two-factor authentication (2FA)
- [ ] Implement CAPTCHA on login form
- [ ] Add CSP violation reporting
- [ ] Implement automated security scanning
- [ ] Add intrusion detection system
- [ ] Implement API request signing
- [ ] Add security.txt file

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Laravel Security Best Practices](https://laravel.com/docs/security)
- [React Security Best Practices](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

## Version History

- **v2.0.0** (2026-02-25): Comprehensive security audit and fixes
  - Added rate limiting
  - Implemented security headers
  - Added HTML sanitization
  - Fixed XSS vulnerabilities
  - Removed debug files
  - Restricted CORS configuration
