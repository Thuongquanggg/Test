// File: tests/website-flow.js (PHIÊN BẢN CHUẨN)

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const GuestFlowDuration = new Trend('trend_guest_flow_duration');
const UserFlowDuration = new Trend('trend_user_flow_duration');
const ErrorRate = new Rate('rate_errors');

export const options = {
  scenarios: {
    guest_users: {
      executor: 'constant-vus',
      // Đọc trực tiếp từ __ENV và cung cấp giá trị mặc định
      vus: Math.floor((__ENV.VUS || 50) * 0.7) || 1,
      duration: __ENV.DURATION || '2m',
      exec: 'guestFlow',
      gracefulStop: '30s',
    },
    logged_in_users: {
      executor: 'constant-vus',
      // Đọc trực tiếp từ __ENV và cung cấp giá trị mặc định
      vus: Math.floor((__ENV.VUS || 50) * 0.3) || 1,
      duration: __ENV.DURATION || '2m',
      exec: 'userFlow',
      gracefulStop: '30s',
    },
  },
  thresholds: {
    'http_req_failed': ['rate<0.02'],
    'http_req_duration': ['p(95)<2000'],
    'trend_guest_flow_duration': ['p(95)<1000'],
    'trend_user_flow_duration': ['p(95)<2500'],
  },
};

const BASE_URL = __ENV.TARGET_URL;

export function guestFlow() {
  group('Guest User Flow - Luồng của Khách', function () {
    const res1 = http.get(`${BASE_URL}/`);
    const success1 = check(res1, { 'Trang chủ tải thành công (status 200)': (r) => r.status === 200 });
    ErrorRate.add(!success1);
    GuestFlowDuration.add(res1.timings.duration);
    sleep(Math.random() * 2 + 1);
    const res2 = http.get(`${BASE_URL}/signup`);
    const success2 = check(res2, { 'Trang Đăng ký tải thành công (status 200)': (r) => r.status === 200 });
    ErrorRate.add(!success2);
    GuestFlowDuration.add(res2.timings.duration);
    sleep(Math.random() * 2 + 1);
    const res3 = http.get(`${BASE_URL}/login`);
    const success3 = check(res3, { 'Trang Đăng nhập tải thành công (status 200)': (r) => r.status === 200 });
    ErrorRate.add(!success3);
    GuestFlowDuration.add(res3.timings.duration);
  });
  sleep(Math.random() * 3 + 2);
}

export function userFlow() {
  group('Logged-in User Flow - Luồng của Người dùng', function () {
    const checkAuthPages = { 'Trang yêu cầu đăng nhập phản hồi': (r) => [200, 401, 403].includes(r.status) };
    const res1 = http.get(`${BASE_URL}/dashboard`);
    const success1 = check(res1, checkAuthPages);
    ErrorRate.add(!success1);
    UserFlowDuration.add(res1.timings.duration);
    sleep(Math.random() * 2 + 1);
    const res2 = http.get(`${BASE_URL}/devices`);
    const success2 = check(res2, checkAuthPages);
    ErrorRate.add(!success2);
    UserFlowDuration.add(res2.timings.duration);
    sleep(Math.random() * 2 + 1);
    const res3 = http.get(`${BASE_URL}/sign`);
    const success3 = check(res3, checkAuthPages);
    ErrorRate.add(!success3);
    UserFlowDuration.add(res3.timings.duration);
    sleep(Math.random() * 2 + 1);
    const res4 = http.get(`${BASE_URL}/topup`);
    const success4 = check(res4, checkAuthPages);
    ErrorRate.add(!success4);
    UserFlowDuration.add(res4.timings.duration);
  });
  sleep(Math.random() * 3 + 2);
}
