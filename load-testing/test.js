import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000'],
    'http_req_failed': ['rate<0.01'],
    'checks': ['rate>0.98'],
  },
};

export default function () {
  if (!__ENV.TARGET_URL) {
    throw new Error('Secret TARGET_URL is not set!');
  }
  const loginUrl = `${__ENV.TARGET_URL}/api/v1/auth/login`;
  const payload = JSON.stringify({
    email: `user${__VU}@test.com`,
    password: 'password123',
  });
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const res = http.post(loginUrl, payload, params);
  check(res, {
    'login API responded with 401': (r) => r.status === 401,
  });
  sleep(Math.random() * 2 + 1);
}
