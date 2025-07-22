import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { parseHTML } from 'k6/html';

// Danh sách các User-Agent của trình duyệt thật để giả mạo
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/116.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5.2 Safari/605.1.15',
];

export const options = {
  // Bắt đầu với số lượng nhỏ vì kịch bản này nặng hơn nhiều
  stages: [
    { duration: '1m', target: 10 }, // Tăng dần lên 10 người dùng
    { duration: '3m', target: 10 }, // Giữ 10 người dùng trong 3 phút
    { duration: '1m', target: 0 },  // Giảm dần
  ],
  thresholds: {
    'http_req_failed': ['rate<0.02'], // Tỷ lệ lỗi dưới 2%
    'http_req_duration': ['p(95)<3000'], // 95% yêu cầu dưới 3 giây
    'checks': ['rate>0.98'], // Hơn 98% check phải thành công
  },
};

export default function () {
  if (!__ENV.TARGET_URL) {
    throw new Error('Secret TARGET_URL is not set!');
  }
  const targetUrl = __ENV.TARGET_URL;

  // Mỗi VU sẽ chọn ngẫu nhiên một User-Agent để trông khác biệt
  const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  const browserHeaders = {
    'User-Agent': userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
  };

  group('User Journey: Full Website Visit & Login Attempt', function () {
    // === Giai đoạn 1: Truy cập trang chủ và tải tài nguyên ===
    const res = http.get(targetUrl, { headers: browserHeaders });
    check(res, { 'Homepage loaded successfully': (r) => r.status === 200 });

    const doc = parseHTML(res.body); // Phân tích HTML trả về
    const assetUrls = [];
    // Tìm tất cả các link CSS và JS quan trọng
    doc.find('link[rel="stylesheet"]').each((i, el) => {
      assetUrls.push(el.attr('href'));
    });
    doc.find('script[src]').each((i, el) => {
      assetUrls.push(el.attr('src'));
    });

    // Tải song song các tài nguyên tĩnh, giống như trình duyệt
    if (assetUrls.length > 0) {
      const assetResponses = http.batch(
        assetUrls.map(url => ['GET', `${targetUrl}${url}`, null, { headers: browserHeaders }])
      );
      assetResponses.forEach(assetRes => {
        check(assetRes, { 'Static asset loaded': (r) => r.status === 200 });
      });
    }

    // === Giai đoạn 2: "Nghỉ" và điều hướng đến trang đăng nhập ===
    sleep(Math.random() * 3 + 2); // Nghỉ từ 2-5 giây

    const loginPageRes = http.get(`${targetUrl}/login`, { headers: browserHeaders });
    check(loginPageRes, { 'Login page loaded': (r) => r.status === 200 });

    // === Giai đoạn 3: Thử đăng nhập ===
    sleep(Math.random() * 4 + 3); // Nghỉ 3-7 giây, mô phỏng thời gian gõ phím

    const loginUrl = `${targetUrl}/api/v1/auth/login`;
    const payload = JSON.stringify({
      email: `user${__VU}${Math.floor(Math.random() * 1000)}@real-user-simulation.com`,
      password: `password${Math.random().toString(36).substring(2)}`,
    });
    const loginHeaders = { ...browserHeaders, 'Content-Type': 'application/json' };

    const loginRes = http.post(loginUrl, payload, loginHeaders);
    check(loginRes, {
      'Login attempt was correctly rejected with 401': (r) => r.status === 401,
    });
  });
}
