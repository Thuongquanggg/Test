

// 🅾️ Tên file: cert.js
// Kịch bản kiểm thử sức bền, mô phỏng chu kỳ hoạt động dài (hơn 1 giờ).
// Tích hợp các kỹ thuật tấn công đa chiều và hành vi người dùng phức tạp.

import http from 'k6/http';
import { check, group, sleep } from 'k6';
// [SỬA LỖI] Đổi tên import để tránh xung đột và làm rõ nguồn gốc.
// Nếu vẫn lỗi, hãy chạy "k6 version" để đảm bảo bạn đang dùng k6 v0.29.0 trở lên.
import { html as k6html } from 'k6/html';

// --- CẤU HÌNH CHÍNH ---
const BASE_URL = 'https://certapple.com';

// --- BỂ DỮ LIỆU PROXY ---
const PROXIES = [
  'http://45.79.123.180:80',
  'http://139.177.182.208:3128',
  'http://138.197.223.116:80',
  'http://104.248.63.13:80',
  'http://165.22.241.115:80',
  'http://167.71.5.83:80',
  'http://159.65.161.219:80',
  'http://167.99.245.193:80',
  'http://134.209.29.120:3128',
  'http://167.172.248.55:80',
  'http://157.245.63.136:80',
  'http://165.227.124.223:80',
  'http://138.68.161.225:80',
  'http://142.93.170.165:80',
  'http://159.89.190.163:80',
  'http://64.227.10.150:80',
  'http://167.99.249.11:80',
  'http://159.203.84.149:3128',
  'http://134.122.81.189:80',
  'http://167.71.228.133:80'
];

// --- BỂ DỮ LIỆU USER AGENTS ---
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/115.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/114.0.1823.51',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 13; SM-S908U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36'
];

// --- CẤU HÌNH KỊCH BẢN TEST ---
export const options = {
  insecureSkipTLSVerify: true,
  scenarios: {
    daily_traffic_simulation: {
      executor: 'ramping-vus',
      startTime: '0s',
      stages: [
        { duration: '5m', target: 200 },
        { duration: '15m', target: 1000 },
        { duration: '30m', target: 1000 },
        { duration: '10m', target: 20 },
        { duration: '3m', target: 0 },
      ],
      gracefulStop: '2m', 
    },
  },
  thresholds: {
    'http_req_duration{type:html}': ['p(95)<5000'],
    'http_req_duration{type:asset}': ['p(95)<3000'],
    'http_req_failed': ['rate<0.3'],
    'checks': ['rate>0.7'],
  },
  discardResponseBodies: false,
};

// --- ĐIỂM VÀO CHÍNH CỦA NGƯỜI DÙNG ẢO ---
export default function () {
  const random = Math.random();
  if (random < 0.2) {
    firstTimeVisitor();
  } else if (random < 0.4) {
    returningVisitor();
  } else {
    chaoticBrowser();
  }
}

// --- CÁC HÀM MÔ PHỎNG HÀNH VI CỤ THỂ ---

function firstTimeVisitor() {
  const params = getBaseParams();
  group('Hành vi: Khách lần đầu', function () {
    const res = http.get(BASE_URL, { ...params, tags: { type: 'html' } });
    const isStatusOk = check(res, { 'Trang chủ OK': (r) => r && r.status === 200 });
    if (isStatusOk) {
      loadPageAssets(res, params, null);
    }
  });
  sleep(Math.random() * 4 + 3);
}

const vuCache = new Map();
function returningVisitor() {
  const params = getBaseParams();
  group('Hành vi: Khách quay lại', function () {
    const res = http.get(BASE_URL, { ...params, tags: { type: 'html' } });
    const isStatusOk = check(res, { 'Trang chủ OK': (r) => r && r.status === 200 });
    if (isStatusOk) {
      loadPageAssets(res, params, vuCache);
    }
  });
  sleep(Math.random() * 4 + 3);
}

const internalLinks = new Set([BASE_URL]);
function chaoticBrowser() {
  const params = getBaseParams();
  group('Hành vi: Người dùng đi dạo', function () {
    const linksArray = Array.from(internalLinks);
    const currentUrl = linksArray[Math.floor(Math.random() * linksArray.length)];
    const res = http.get(currentUrl, { ...params, tags: { type: 'html' } });
    const isStatusOk = check(res, { 'Tải trang OK': (r) => r && r.status === 200 });
    if (isStatusOk) {
      const discoveredLinks = loadPageAssets(res, params, null);
      discoveredLinks.forEach(link => internalLinks.add(link));
    }
  });
  sleep(Math.random() * 5 + 4);
}

// --- CÁC HÀM HỖ TRỢ ---

function getBaseParams() {
  const proxy = PROXIES[(__VU - 1) % PROXIES.length];
  return {
    proxy: proxy,
    headers: {
      'User-Agent': USER_AGENTS[__VU % USER_AGENTS.length],
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
    },
  };
}

// *** HÀM ĐÃ ĐƯỢC SỬA LỖI ***
function loadPageAssets(res, params, cache) {
  const discoveredLinks = new Set();
  
  // [SỬA LỖI] Thêm bước kiểm tra chặt chẽ hơn.
  // Nếu response không tồn tại, hoặc không có body, hoặc body không phải là string, thoát ngay.
  // Điều này ngăn lỗi "parse" khi proxy trả về dữ liệu không mong muốn.
  if (!res || typeof res.body !== 'string' || res.body.length === 0) {
    return Array.from(discoveredLinks);
  }

  // [SỬA LỖI] Sử dụng biến k6html đã được đổi tên.
  const doc = k6html.parse(res.body);
  const assetUrls = new Set();

  doc.find('link[href], script[src], img[src], video[src], audio[src], source[src]').each((_, el) => {
    const url = el.attr('href') || el.attr('src');
    if (url) assetUrls.add(resolveUrl(url, res.url));
  });

  const contentType = res.headers['Content-Type'];
  const isCssResponse = contentType && contentType.includes('css');
  const cssBody = doc.find('style').text() + (isCssResponse ? res.body : '');
  
  const cssUrls = cssBody.match(/url\(['"]?([^'")]+)['"]?\)/g) || [];
  cssUrls.forEach(match => {
      const url = match.replace(/url\(['"]?/, '').replace(/['"]?\)/, '');
      if (url && !url.startsWith('data:')) {
          assetUrls.add(resolveUrl(url, res.url));
      }
  });

  doc.find('a[href]').each((_, el) => {
    const link = el.attr('href');
    if(link) {
        const resolvedLink = resolveUrl(link, res.url);
        if (resolvedLink && resolvedLink.startsWith(BASE_URL) && !resolvedLink.match(/\.(jpg|jpeg|png|gif|css|js|pdf)$/i) && !resolvedLink.includes('#')) {
          discoveredLinks.add(resolvedLink);
        }
    }
  });

  const requests = [];
  assetUrls.forEach(url => {
    if(url) {
        const assetParams = { ...params, tags: { type: 'asset' } };
        if (cache && cache.has(url)) {
          assetParams.headers['If-None-Match'] = cache.get(url);
        }
        requests.push(['GET', url, null, assetParams]);
    }
  });

  if (requests.length > 0) {
    const responses = http.batch(requests);
    if (cache) {
      responses.forEach((r, i) => {
        const url = requests[i][1];
        if (r && r.status === 200 && r.headers['Etag']) {
          cache.set(url, r.headers['Etag']);
        }
        if (r) {
            check(r, { 'Tài nguyên cache hợp lệ (200 hoặc 304)': (res) => [200, 304].includes(res.status) });
        }
      });
    }
  }
  return Array.from(discoveredLinks);
}

function resolveUrl(url, pageUrl) {
  try {
    return (new URL(url, pageUrl)).href;
  } catch (e) {
    return '';
  }
}
