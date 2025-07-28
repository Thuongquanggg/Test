// .js

import http from 'k6/http';
import { check, sleep, group } from 'k6';
const TARGET_URL = 'https://certapple.com';
export const options = {
scenarios: {

lan_chay_1: {
executor: 'ramping-vus',
startTime: '0s',
stages: [{ duration: '2s', target: 10000 },
{ duration: '116s', target: 10000 },
{ duration: '2s', target: 0 },],
gracefulRampDown: '0s',},


},
thresholds: {
'http_req_duration': ['p(95)<1500'],
'http_req_failed': ['rate<0.05'],
'checks': ['rate>0.95'],},
insecureSkipTLSVerify: true,};
export default function () {
group('Trang Chủ', function () {
const res = http.get(TARGET_URL, {
tags: { name: 'HomePage' },});
check(res, {
'Trang chủ tải thành công (status 200)': (r) => r.status === 200,
'Nội dung trang chủ không rỗng': (r) => r.body.length > 0,});
http.get(`${TARGET_URL}/assets/css/style.css`);
http.get(`${TARGET_URL}/assets/js/custom.js`);});
sleep(Math.random() * 2 + 1);}
