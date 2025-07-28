// attack_script_dos_test.js (Dựa trên Version 5 - Sửa đổi để test DoS/Buffer Overflow)

const { chromium } = require('playwright');

// --- Cấu hình ---
const TARGET_URL = 'https://certapple.com'; // <<== THAY ĐỔI NẾU CẦN
const EMAIL_TEST = 'dos-tester@test.com';

// Cấu hình cho payload tấn công - Thay vì danh sách mật khẩu
const PAYLOAD_SIZE = 1000000; // 1 triệu ký tự. Có thể tăng/giảm để thử nghiệm.
const PAYLOAD_CHARACTER = 'A';
// --- Kết thúc cấu hình ---

(async () => {
  console.log('::group::Khởi chạy trình duyệt headless (Chrome)...');
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  console.log('Trình duyệt đã sẵn sàng.');
  console.log('::endgroup::');

  try {
    // Tạo payload tấn công
    const payload = PAYLOAD_CHARACTER.repeat(PAYLOAD_SIZE);

    console.log(`::group::Truy cập ${TARGET_URL} để khởi tạo phiên làm việc...`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
    console.log('✅ Trang đã tải xong.');
    console.log('::endgroup::');

    console.log('::group::Bắt đầu gửi payload lớn để kiểm tra phản ứng của server...');
    console.log(`Sẽ thử tấn công với email '${EMAIL_TEST}' và một payload dài ${PAYLOAD_SIZE.toLocaleString()} ký tự.`);
    console.log('------------------------------------');

    try {
      // 1. Tìm và điền vào ô email
      await page.locator('#username').fill(EMAIL_TEST);

      // 2. Tìm và điền PAYLOAD LỚN vào ô mật khẩu
      console.log('Đang điền payload vào ô mật khẩu...');
      await page.locator('#password').fill(payload);
      
      // 3. Nhấn nút Đăng nhập
      console.log('Đang gửi yêu cầu đến server...');
      await page.locator('#login_certapple button[type="submit"]').click();

      // 4. Chờ cho trang phản hồi, nhưng có giới hạn thời gian (quan trọng!)
      // Nếu server bị treo, lệnh này sẽ báo lỗi timeout.
      await page.waitForLoadState('networkidle', { timeout: 60000 }); // Chờ tối đa 60 giây

      // 5. Kiểm tra kết quả nếu server phản hồi kịp thời
      const content = await page.content();
      const pageTitle = await page.title();

      if (content.includes('413') || pageTitle.includes('413') || content.toLowerCase().includes('request entity too large')) {
        console.log('✅✅✅ KẾT QUẢ TỐT: Server đã được cấu hình đúng. Nó đã từ chối yêu cầu quá lớn với lỗi 413.');
      } else if (content.includes('Tài khoản hoặc mật khẩu không đúng')) {
        console.log('✅✅ KẾT QUẢ TỐT: Ứng dụng đã xử lý được payload lớn một cách an toàn và chỉ báo lỗi đăng nhập thông thường.');
      } else {
         console.warn("::warning::Phản hồi không xác định. Cần kiểm tra thủ công. Server có thể đã xử lý yêu cầu nhưng trả về một trang không mong muốn.");
      }
      
    } catch (e) {
      // Bắt lỗi, đặc biệt là lỗi TIMEOUT
      if (e.message.includes('timeout')) {
        console.error(`::error::LỖ HỔNG TIỀM TÀNG (DoS)! Server không phản hồi trong 60 giây.`);
        console.error('Điều này có nghĩa là server đã bị treo, quá tải hoặc xử lý rất chậm khi nhận yêu cầu lớn.');
        process.exit(1); // Thoát với mã lỗi để chỉ ra sự thất bại
      } else {
        console.error(`::error::Lỗi trong quá trình tương tác với trang: ${e.message}`);
      }
    }
    
    console.log('------------------------------------');
    console.log('✅✅✅ KIỂM TRA HOÀN TẤT. Vui lòng xem kết quả log ở trên.');
    console.log('::endgroup::');

  } catch (error) {
    console.error('::error::Đã xảy ra lỗi nghiêm trọng:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
