
import http from 'k6/http';
import { check, sleep, group } from 'k6';

const TARGET_URL = 'https://certapple.com';

export const options = {
// Bỏ 'stages' và 'thresholds' ra khỏi đây và đưa vào từng scenario
scenarios: {
// Kịch bản chạy lần đầu tiên
lan_chay_1: {
executor: 'ramping-vus', // Đây là executor tương ứng với 'stages'
startTime: '0s', // Bắt đầu ngay lập tức
stages: [
{ duration: '30s', target: 50 },
{ duration: '1m', target: 50 },
{ duration: '30s', target: 150 },
{ duration: '2m', target: 150 },
{ duration: '1m', target: 0 }, // Tổng thời gian là 5 phút
],
gracefulRampDown: '0s', // Kết thúc ngay khi hết stages
},
// Kịch bản chạy lần thứ hai, sau khi nghỉ 2 phút
lan_chay_2: {
executor: 'ramping-vus',
startTime: '7m', // Bắt đầu sau 7 phút (5 phút chạy + 2 phút nghỉ)
stages: [
{ duration: '30s', target: 50 },
{ duration: '1m', target: 50 },
{ duration: '30s', target: 150 },
{ duration: '2m', target: 150 },
{ duration: '1m', target: 0 },
],
gracefulRampDown: '0s',
},
},
// Thresholds có thể đặt ở cấp độ toàn cục hoặc cho từng scenario
thresholds: {
'http_req_duration': ['p(95)<1500'],
'http_req_failed': ['rate<0.05'],
'checks': ['rate>0.95'],
},
insecureSkipTLSVerify: true,
};

// Hàm default này sẽ được cả hai kịch bản sử dụng
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
