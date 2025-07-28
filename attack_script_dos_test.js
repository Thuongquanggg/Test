// attack_script_load_test.js (Version 11 - Load Testing)

const { chromium } = require('playwright');

// --- Cấu hình ---
const TARGET_URL = 'https://certapple.com';
const EMAIL_TEST = 'load-tester@test.com'; // Có thể giữ nguyên hoặc thay đổi
const PASSWORD_TEST = 'regular_password'; // Mật khẩu bình thường, không cần dài
const CONCURRENT_WORKERS = 10; // Số lượng yêu cầu gửi ĐỒNG THỜI. Hãy cẩn thận với con số này!
// --- Kết thúc cấu hình ---

/**
 * Hàm thực hiện một lần đăng nhập duy nhất.
 * @param {import('playwright').Browser} browser - Đối tượng browser để tạo context mới.
 * @param {number} workerId - ID của worker để theo dõi trong log.
 */
async function performLoginAttempt(browser, workerId) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const logPrefix = `[Worker ${workerId}]`;

  try {
    console.log(`${logPrefix} Đang truy cập ${TARGET_URL}...`);
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' }); // Chỉ cần DOM là đủ, nhanh hơn

    // Bỏ qua xử lý cookie banner để tăng tốc, nếu trang yêu cầu mới thêm lại
    
    await page.locator('a.w-login-popup').filter({ hasText: 'Login' }).click();
    await page.locator('#username').waitFor({ state: 'visible', timeout: 10000 });

    await page.locator('#username').fill(`${EMAIL_TEST}`);
    await page.locator('#password').fill(PASSWORD_TEST);
    await page.locator('#password').locator('..').locator('button[type="submit"]').click();

    // Chờ phản hồi, có thể chỉ cần chờ một selector báo lỗi là đủ
    await page.waitForSelector('text=/Tài khoản hoặc mật khẩu không đúng|Invalid username or password/i', { timeout: 30000 });
    console.log(`✅ ${logPrefix} Hoàn thành. Server đã phản hồi.`);

  } catch (error) {
    if (error.message.includes('timeout')) {
      console.error(`::error::${logPrefix} LỖ HỔNG TIỀM TÀNG! Server không phản hồi kịp thời.`);
    } else {
      console.error(`::error::${logPrefix} Lỗi: ${error.message.split('\n')[0]}`);
    }
  } finally {
    await context.close(); // Đóng context và page để giải phóng tài nguyên
  }
}


(async () => {
  console.log(`::group::Bắt đầu kiểm thử tải với ${CONCURRENT_WORKERS} worker đồng thời...`);
  console.time('Tổng thời gian thực thi'); // Bắt đầu đếm giờ

  const browser = await chromium.launch();
  const tasks = [];

  // Tạo ra một danh sách các "nhiệm vụ" (task) để chạy song song
  for (let i = 1; i <= CONCURRENT_WORKERS; i++) {
    tasks.push(performLoginAttempt(browser, i));
  }

  // Chạy tất cả các nhiệm vụ cùng một lúc và chờ tất cả hoàn thành
  try {
    await Promise.all(tasks);
  } catch (e) {
      console.error("::error::Đã xảy ra lỗi trong quá trình thực thi song song: ", e);
  }


  await browser.close();

  console.timeEnd('Tổng thời gian thực thi'); // Dừng đếm giờ và in ra kết quả
  console.log('::endgroup::');
  console.log('✅✅✅ KIỂM THỬ TẢI HOÀN TẤT.');
})();
