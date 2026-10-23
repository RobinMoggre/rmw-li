import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

function fetchPath(path, method = 'GET') {
  return worker.fetch(new Request(`https://rmw.li${path}`, { method }));
}

test('redirects known link with permanent code 301', () => {
  const response = fetchPath('/home');
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('Location'), 'https://www.rmwebcreaties.nl/');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('respects optional permanent status code', () => {
  assert.equal(fetchPath('/contact').status, 301);
});

test('preserves incoming query params including duplicates', () => {
  const location = fetchPath('/webhosting?tag=one&tag=two').headers.get('Location');
  const result = new URL(location);
  assert.equal(result.searchParams.get('aff'), '23');
  assert.equal(result.searchParams.get('page'), 'webhosting');
  assert.deepEqual(result.searchParams.getAll('tag'), ['one', 'two']);
});

test('unknown links return 404; matching is case sensitive', () => {
  assert.equal(fetchPath('/missing').status, 404);
  assert.equal(fetchPath('/Home').status, 404);
});

test('only GET and HEAD are allowed', () => {
  const response = fetchPath('/home', 'POST');
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('Allow'), 'GET, HEAD');
});
