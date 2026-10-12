import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contentSecurityPolicy, securityHeaders } from '../lib/security-headers.mjs';

test('production sign-in policy restricts scripts to nonce-trusted execution', () => {
  const policy = contentSecurityPolicy({ nonce: 'test-nonce', production: true, backendOrigin: 'https://api.example.test' });
  const scripts = policy.split('; ').find(d => d.startsWith('script-src'));
  assert.match(scripts, /'nonce-test-nonce' 'strict-dynamic'/);
  assert.doesNotMatch(scripts, /unsafe-inline|unsafe-eval/);
  assert.match(policy, /object-src 'none'/);
  assert.match(policy, /frame-ancestors 'none'/);
  assert.match(policy, /form-action 'self'/);
  assert.match(policy, /img-src .*https:/);
});

test('development policy supports HMR but production does not permit eval', () => {
  assert.match(contentSecurityPolicy({ production: false, backendOrigin: 'http://localhost:4000' }), /unsafe-eval/);
  assert.doesNotMatch(contentSecurityPolicy({ production: true, backendOrigin: 'https://api.example.test' }), /unsafe-eval/);
});

test('security headers protect frames and preserve OAuth/popups without blindly preloading HSTS', () => {
  const headers = Object.fromEntries(securityHeaders({ production: true }).map(h => [h.key, h.value]));
  assert.equal(headers['X-Frame-Options'], 'DENY');
  assert.equal(headers['Cross-Origin-Opener-Policy'], 'same-origin-allow-popups');
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(headers['Strict-Transport-Security'], 'max-age=2592000');
  assert.doesNotMatch(headers['Strict-Transport-Security'], /includeSubDomains|preload/);
  assert.match(securityHeaders({ production: true, includeSubdomains: true }).find(h => h.key === 'Strict-Transport-Security').value, /includeSubDomains/);
  assert.equal(securityHeaders({ production: false }).some(h => h.key === 'Strict-Transport-Security'), false);
});
