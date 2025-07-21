// file: load-testing/test.js
import http from 'k6/http';
import { check } from 'k6';

// --- CẤU HÌNH BÀI KIỂM TRA ---
// Đây là nơi bạn điều chỉnh "cường độ" của cuộc tấn công
export const options = {
  stages: [
    // Giai đoạn 1: "Làm nóng", tăng từ từ lên 200 người dùng ảo trong 30 giây
    { duration: '30s', target: 2000 },
    // Giai đoạn 2: "Tấn công chính", tăng lên 1000 người dùng ảo trong 1 phút tiếp theo
    { duration: '1m', target: 2000 },
    // Giai đoạn 3: "Duy trì áp lực", giữ 1000 người dùng ảo trong 2 phút để xem độ ổn định
    { duration: '200m', target: 2000 },
    // Giai đoạn 4: "Hạ nhiệt", giảm dần về 0 người dùng trong 30 giây
    { duration: '30s', target: 0 },
  ],
  // Ngưỡng thất bại: Nếu một trong các điều kiện này bị vi phạm, bài test sẽ bị đánh dấu là "thất bại"
  thresholds: {
    'http_req_duration': ['p(95)<800'], // 95% yêu cầu phải hoàn thành dưới 800ms
    'http_req_failed': ['rate<0.01'],   // Tỷ lệ yêu cầu thất bại phải dưới 1%
  },
};

// --- HÀNH VI CỦA MỖI NGƯỜI DÙNG ẢO ---
export default function () {
  // Bước 1: Kiểm tra xem "tọa độ mục tiêu" đã được cung cấp chưa
  if (!__ENV.TARGET_URL) {
    // Nếu không, báo lỗi và dừng ngay lập tức. Điều này rất an toàn.
    throw new Error('Secret TARGET_URL is not set! Please configure it in repository Settings > Secrets.');
  }
  const targetUrl = __ENV.TARGET_URL;

  // Bước 2: Gửi yêu cầu HTTP GET đến mục tiêu.
  // Chúng ta xóa sleep() để mỗi người dùng ảo tấn công nhanh nhất có thể.
  const res = http.get(targetUrl);

  // Bước 3: Kiểm tra kết quả trả về
  check(res, {
    // Đặt tên cho điều kiện kiểm tra, ví dụ: 'trang web trả về status 200'
    'status is 200': (r) => r.status === 200,
  });
}
