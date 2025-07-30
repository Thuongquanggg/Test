// 🅾️ Tên file: nezushub-browser.js
// Kịch bản kiểm thử hiệu năng sử dụng xk6-browser để vượt qua Cloudflare.

import { browser } from 'k6/experimental/browser';
import { check, group, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// --- CẤU HÌNH ---
const BASE_URL = 'https://nezushub.vip';

// Dữ liệu người dùng vẫn được đọc như cũ
const users = new SharedArray('users', function () {
  try {
    return JSON.parse(open('./data/users.json'));
  } catch (e) {
    return [];
  }
});

// --- CẤU HÌNH KỊCH BẢN TEST ---
export const options = {
  scenarios: {
    // Chỉ chạy một kịch bản duy nhất vì xk6-browser tốn tài nguyên
    ui_test: {
      executor: 'ramping-vus',
      // Chạy số lượng VUs nhỏ
      stages: [
        { duration: '1m', target: 2 },
        { duration: '3m', target: 5 }, // Tối đa 5 VUs
        { duration: '5m', target: 5 },
        { duration: '1m', target: 0 },
      ],
      // Mỗi VU sẽ chạy hàm default
      exec: 'default',
      options: {
        // Bật chế độ trình duyệt cho kịch bản này
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  thresholds: {
    'browser_web_vital_lcp': ['p(95) < 4000'], // LCP dưới 4s
    'browser_req_failed': ['rate < 0.05'], // Tỷ lệ request lỗi của trình duyệt
    'checks': ['rate > 0.9'],
  },
};

// --- HÀNH VI CHÍNH ---
export default async function () {
  // Phân luồng ngẫu nhiên: 70% là khách, 30% là thành viên
  const random = Math.random();
  if (random < 0.7) {
    await guestBehavior();
  } else {
    await memberBehavior();
  }
}

// Hành vi của khách vãng lai
async function guestBehavior() {
  const page = browser.newPage();
  try {
    await group('Hành vi: Khách vãng lai (Browser)', async () => {
      // 1. Tải trang chủ. xk6-browser sẽ tự xử lý Cloudflare challenge.
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      check(page, { 'Trang chủ tải thành công': (p) => p.locator('h1.p-title-value').textContent() === 'NezusHub' });
      
      sleep(Math.random() * 2 + 1);

      // 2. Tìm kiếm
      const searchTerms = ['certificate', 'ipa library', 'tutorial', 'rules'];
      const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
      
      // Nhấp vào icon tìm kiếm để mở form
      await page.locator('a[data-xf-key="/"]').click();
      // Gõ từ khóa vào ô tìm kiếm
      await page.locator('input[name="keywords"]').type(term);
      // Nhấn nút tìm kiếm
      await page.locator('button[type="submit"]:visible').click();
      
      // Chờ trang kết quả tải xong
      await page.waitForNavigation();
      check(page, { 'Trang tìm kiếm tải thành công': (p) => p.url().includes('/search/') });
    });
  } finally {
    page.close();
  }
  sleep(Math.random() * 5 + 3);
}

// Hành vi của thành viên đăng nhập
async function memberBehavior() {
  if (users.length === 0) return;
  const user = users[__VU % users.length];

  const page = browser.newPage();
  try {
    await group('Hành vi: Thành viên đăng nhập (Browser)', async () => {
      // 1. Tải trang đăng nhập
      await page.goto(`${BASE_URL}/login/`, { waitUntil: 'domcontentloaded' });

      // 2. Điền form và đăng nhập
      await page.locator('input[name="login"]').type(user.username);
      await page.locator('input[name="password"]').type(user.password);
      await page.locator('button.button--icon--login').click();

      // Chờ trang chuyển hướng sau khi đăng nhập
      await page.waitForNavigation();

      // 3. Kiểm tra đã đăng nhập thành công chưa (bằng cách tìm nút "Log out")
      const isLoggedIn = await page.locator('a[href="/logout/"]').isVisible();
      check(page, { 'Đăng nhập thành công': () => isLoggedIn });

      if (isLoggedIn) {
        // 4. Gửi tin nhắn vào shoutbox
        await page.locator('.siropuShoutbox .fr-element').type(`k6 browser user ${__VU} says hi!`);
        await page.locator('.siropuShoutbox button[type="submit"]').click();

        // Chờ một chút để tin nhắn xuất hiện
        sleep(2);
        check(page, { 'Tin nhắn shoutbox đã được gửi': (p) => p.locator('span.siropuShoutboxMessage:has-text("k6 browser user")').isVisible() });
      }
    });
  } finally {
    page.close();
  }
  sleep(Math.random() * 8 + 5);
}
