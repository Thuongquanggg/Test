import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { parseHTML } from 'k6/html';

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/116.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5.2 Safari/605.1.15',
];

export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '3m', target: 10 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    'http_req_failed': ['rate<0.02'],
    'http_req_duration': ['p(95)<3000'],
    'checks': ['rate>0.98'],
  },
};

export default function () {
  if (!__ENV.TARGET_URL) {
    throw new Error('Secret TARGET_URL is not set!');
  }
  const targetUrl = __ENV.TARGET_URL;
  const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  const browserHeaders = {
    'User-Agent': userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
  };

  group('User Journey: Full Website Visit & Login Attempt', function () {
    const res = http.get(targetUrl, { headers: browserHeaders });
    const homepageOK = check(res, { 'Homepage loaded successfully': (r) => r.status === 200 });

    // *** SỬA LỖI QUAN TRỌNG Ở ĐÂY ***
    // Chỉ thực hiện phân tích HTML và tải tài nguyên nếu trang chủ trả về status 200
    if (homepageOK) {
      const doc = parseHTML(res.body);
      const assetUrls = [];

      // Vòng lặp tìm CSS
      doc.find('link[rel="stylesheet"]').each((i, el) => {
        const cssUrl = el.attr('href');
        // Lập trình phòng thủ: chỉ thêm URL nếu nó tồn tại
        if (cssUrl) {
          assetUrls.push(cssUrl);
        }
      });

      // Vòng lặp tìm JS
      doc.find('script[src]').each((i, el) => {
        const jsUrl = el.attr('src');
        // Lập trình phòng thủ: chỉ thêm URL nếu nó tồn tại
        if (jsUrl) {
          assetUrls.push(jsUrl);
        }
      });

      if (assetUrls.length > 0) {
        const assetResponses = http.batch(
          assetUrls.map(url => ['GET', `${targetUrl}${url}`, null, { headers: browserHeaders }])
        );
        assetResponses.forEach(assetRes => {
          check(assetRes, { 'Static asset loaded': (r) => r.status === 200 });
        });
      }
    } else {
        // Nếu không vào được trang chủ, hãy log ra để biết lý do
        console.error(`Failed to load homepage. Status: ${res.status}. Body: ${res.body.substring(0, 200)}...`);
    }

    sleep(Math.random() * 3 + 2);

    const loginPageRes = http.get(`${targetUrl}/login`, { headers: browserHeaders });
    check(loginPageRes, { 'Login page loaded': (r) => r.status === 200 });

    sleep(Math.random() * 4 + 3);

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
