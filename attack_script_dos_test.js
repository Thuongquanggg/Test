// attack_script_dos_test.js (Version 4 - Final with Login Button Click)

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
      // --- BƯỚC MỚI: Nhấn vào nút "Login" để hiển thị form ---
      console.log('Đang tìm và nhấn vào nút "Login" để hiển thị form...');
      
      // Playwright sẽ tự động thử tìm nút hoặc link có tên "Login"
      // Đây là cách làm rất mạnh mẽ và được khuyến khích.
      await page.getByRole('button', { name: 'Login', exact: true }).click();
      
      console.log('✅ Đã nhấn nút Login. Chờ form hiển thị...');
      
      // Chờ cho ô username xuất hiện sau khi click.
      // Thay vì chờ một khoảng thời gian cố định, chúng ta chờ cho đến khi ô username thực sự hiển thị.
      await page.locator('#username').waitFor({ state: 'visible', timeout: 5000 });
      console.log('✅ Form đăng nhập đã hiển thị.');
      // --- KẾT THÚC BƯỚC MỚI ---

      // 1. Tìm và điền vào ô email (bây giờ nó đã hiển thị)
      await page.locator('#username').fill(EMAIL_TEST);

      // 2. Tìm và điền PAYLOAD LỚN vào ô mật khẩu
      await page.locator('#password').fill(payload);
      
      // 3. Nhấn nút Đăng nhập bên trong form
      await page.locator('#login_certapple button[type="submit"]').click();

      // 4. Chờ cho trang phản hồi
      console.log('Đã gửi payload. Đang chờ phản hồi từ server...');
      await page.waitForLoadState('networkidle', { timeout: 60000 });

      // 5. Kiểm tra kết quả nếu server phản hồi kịp thời
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
      // Bắt lỗi, đặc biệt là lỗi TIMEOUT
      if (e.message.includes('timeout')) {
        // Kiểm tra xem lỗi timeout có phải do không tìm thấy nút Login không
        if (e.message.includes("getByRole('button', { name: 'Login'")) {
            console.error(`::error::Không tìm thấy nút "Login". Hãy thử đổi selector, ví dụ: page.getByRole('link', { name: 'Login' }).click()`);
        } else if (e.message.includes('waitForLoadState')) {
            console.error(`::error::LỖ HỔNG TIỀM TÀNG (DoS)! Server không phản hồi trong 60 giây sau khi gửi payload.`);
            console.error('Điều này có nghĩa là server đã bị treo, quá tải hoặc xử lý rất chậm.');
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
