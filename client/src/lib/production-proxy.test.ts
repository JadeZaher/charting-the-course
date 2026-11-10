import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const nginx = readFileSync(path.join(root, 'nginx.conf'), 'utf8');
const dockerfile = readFileSync(path.join(root, 'Dockerfile'), 'utf8');

function blockAfter(source: string, marker: string): string {
  const start = source.indexOf(marker);
  assert.ok(start >= 0, marker);
  const rest = source.slice(start);
  const end = rest.indexOf('\n    }');
  assert.ok(end > 0, marker);
  return rest.slice(0, end);
}

test('production nginx proxies /api and the messaging socket to the NEOS API', () => {
  const api = blockAfter(nginx, 'location ^~ /api/');
  const ws = blockAfter(nginx, 'location ^~ /messaging/ws');
  for (const block of [api, ws]) {
    assert.match(block, /proxy_pass \$\{BACKEND_URL\};/);
    assert.match(block, /proxy_set_header Host \$\{BACKEND_HOST\};/);
    assert.match(block, /proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;/);
    assert.match(block, /proxy_set_header X-Forwarded-Proto \$neos_forwarded_proto;/);
    assert.match(block, /proxy_set_header X-Forwarded-Host \$neos_forwarded_host;/);
    assert.match(block, /proxy_ssl_server_name on;/);
  }
  assert.match(ws, /proxy_http_version 1\.1;/);
  assert.match(ws, /proxy_set_header Upgrade \$http_upgrade;/);
  assert.match(ws, /proxy_set_header Connection "upgrade";/);
  assert.match(ws, /proxy_buffering off;/);
  assert.equal(api.includes('proxy_buffering'), false);
  assert.match(nginx, /map \$http_x_forwarded_proto \$neos_forwarded_proto/);
  assert.equal(nginx.includes('proxy_cookie_domain'), false);
});

test('the image defaults the upstream and lets an env var override it', () => {
  assert.match(dockerfile, /ENV BACKEND_URL=https:\/\/neos-operating-system-production\.up\.railway\.app\n/);
  assert.match(dockerfile, /ENV BACKEND_HOST=neos-operating-system-production\.up\.railway\.app\n/);
  assert.match(dockerfile, /envsubst '\\\$PORT \\\$BACKEND_URL \\\$BACKEND_HOST'/);
  assert.equal(dockerfile.includes('ENV BACKEND_URL=https://neos-operating-system-production.up.railway.app/'), false);
});
