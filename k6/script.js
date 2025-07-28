import http from 'k6/http';
import { check, sleep, group } from 'k6';
const TARGET_URL = 'https://certapple.com';
export const options = {
stages: [
{ duration: '30s', target: 50 },
{ duration: '1m', target: 50 },
{ duration: '30s', target: 150 },
{ duration: '2m', target: 150 },
{ duration: '1m', target: 0 },
],
thresholds: {
'http_req_duration': ['p(95)<1500'],
'http_req_failed': ['rate<0.05'],
'checks': ['rate>0.95'],
},
insecureSkipTLSVerify: true,
};
export default function () {
group('Trang Chủ', function () {
const res = http.get(TARGET_URL, {
tags: { name: 'HomePage' },
});
check(res, {
'Trang chủ tải thành công (status 200)': (r) => r.status === 200,
'Nội dung trang chủ không rỗng': (r) => r.body.length > 0,
});
http.get(`${TARGET_URL}/assets/css/style.css`);
http.get(`${TARGET_URL}/assets/js/custom.js`);
});
sleep(Math.random() * 2 + 1);
}
