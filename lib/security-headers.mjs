export function contentSecurityPolicy({ nonce, production, backendOrigin }) {
  const scripts = nonce ? `'self' 'nonce-${nonce}'${production ? " 'strict-dynamic'" : " 'unsafe-eval'"}` : `'self' 'unsafe-inline'${production ? '' : " 'unsafe-eval'"}`;
  return [
    "default-src 'self'",
    `script-src ${scripts} https://maps.googleapis.com https://maps.gstatic.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    `img-src 'self' data: blob: https: ${backendOrigin}`,
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src 'self' ${backendOrigin} https://*.googleapis.com https://maps.gstatic.com https://*.google.com${production ? '' : ' ws: wss:'}`,
    "worker-src 'self' blob:",
    `media-src 'self' blob: https: ${backendOrigin}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(production ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}

export function securityHeaders({ production, includeSubdomains = false }) {
  return [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
    ...(production ? [{ key: 'Strict-Transport-Security', value: `max-age=2592000${includeSubdomains ? '; includeSubDomains' : ''}` }] : []),
  ];
}
