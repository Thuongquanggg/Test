
# .github/workflows/Test.yml
name: https://certapple.com
on:
  workflow_dispatch:
    inputs:
      target_url:
        description: 'URL hoặc Tên Wifi'
        required: true
        type: string
jobs:
  k6-load-test-run:
    name: Run k6 Load Test
    runs-on: ubuntu-latest
    timeout-minutes: 600
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      - name: Run k6 test
        uses: grafana/k6-action@v0.3.1
        with:
          filename: test.js
        env:
          K6_TARGET_URL: ${{ inputs.target_url }}

🅾️File 2: Test/test.js (Phiên bản đơn giản, tương thích với k6 cũ)

File script k6 này đã được đưa về dạng cơ bản nhất, không sử dụng scenarios hay iterations. Đây là cú pháp mà phiên bản k6 cũ trong action v0.3.1 hoàn toàn hiểu được.

// Test/test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
export const options = {

stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 0 },
{ duration: '2m', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 0 },
{ duration: '2m', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 0 },
{ duration: '2m', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],

stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 0 },
{ duration: '2m', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],

stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 0 },
{ duration: '2m', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 0 },
{ duration: '2m', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 0 },
{ duration: '2m', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],

stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 0 },
{ duration: '2m', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],

stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 0 },
{ duration: '2m', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 0 },
{ duration: '2m', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 0 },
{ duration: '2m', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],

stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 0 },
{ duration: '2m', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],

stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 0 },
{ duration: '2m', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 0 },
{ duration: '2m', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 0 },
{ duration: '2m', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],

stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 0 },
{ duration: '2m', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],

stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 0 },
{ duration: '2m', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 0 },
{ duration: '2m', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 0 },
{ duration: '2m', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],

stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 0 },
{ duration: '2m', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],

stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 0 },
{ duration: '2m', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 0 },
{ duration: '2m', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 0 },
{ duration: '2m', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],

stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 0 },
{ duration: '2m', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],

stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 0 },
{ duration: '2m', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 0 },
{ duration: '2m', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 0 },
{ duration: '2m', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],

stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],
stages: [
{ duration: '30s', target: 0 },
{ duration: '2m', target: 0 },
],
stages: [
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 1000 },
{ duration: '30s', target: 0 },
{ duration: '30s', target: 0 },
],





thresholds: {
'http_req_failed': ['rate<0.1'],
'http_req_duration': ['p(95)<5000'],
},
};


const TARGET_URL = __ENV.K6_TARGET_URL || 'https://test.k6.io';


export default function () {
const res = http.get(TARGET_URL);

check(res, {
'Trang chủ phản hồi thành công (status 200)': (r) => r.status === 200,
});

sleep(0);
}
