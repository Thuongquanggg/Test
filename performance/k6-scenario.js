// file: performance/k6-scenario.js
import http from 'k6/http';
import { check } from 'k6';

// --- CẤU HÌNH KỊCH BẢN KIỂM TRA ---
// Đây là nơi bạn định nghĩa "sức ép" của bài kiểm tra.
export const options = {
  stages: [
    // Giai đoạn 1: "Khởi động", tăng dần lên 200 người dùng ảo trong 30 giây.
    { duration: '30s', target: 1000 },
    // Giai đoạn 2: "Tăng tốc", leo thang lên 1000 người dùng ảo trong 1 phút.
    { duration: '1m', target: 1000 },
    // Giai đoạn 3: "Chịu tải", duy trì 1000 người dùng ảo trong 2 phút để đo độ ổn định.
    { duration: '200m', target: 1000 },
    // Giai đoạn 4: "Hạ nhiệt", giảm dần về 0 người dùng trong 30 giây.
    { duration: '30s', target: 0 },
  ],
  // Ngưỡng đánh giá: Nếu bất kỳ điều kiện nào bị vi phạm, bài test sẽ bị coi là "thất bại".
  thresholds: {
    'http_req_duration': ['p(95)<800'], // 95% yêu cầu phải hoàn thành dưới 800ms.
    'http_req_failed': ['rate<0.01'],   // Tỷ lệ yêu cầu thất bại phải dưới 1%.
  },
};

// --- HÀNH ĐỘNG CỦA MỖI NGƯỜI DÙNG ẢO ---
export default function () {
  // Bước 1: Kiểm tra xem điểm cuối kiểm tra đã được cung cấp chưa.
  if (!__ENV.TEST_ENDPOINT) {
    // Nếu không, báo lỗi và dừng ngay lập tức để đảm bảo an toàn.
    throw new Error('Biến môi trường TEST_ENDPOINT chưa được thiết lập! Vui lòng cấu hình trong Settings > Secrets.');
  }
  const endpoint = __ENV.TEST_ENDPOINT;

  // Bước 2: Gửi yêu cầu HTTP GET đến điểm cuối.
  // Bỏ qua sleep() để mỗi người dùng ảo gửi yêu cầu nhanh nhất có thể.
  const response = http.get(endpoint);

  // Bước 3: Xác thực kết quả trả về.
  check(response, {
    // Đặt tên cho điều kiện xác thực, ví dụ: 'phản hồi thành công (HTTP 200)'
    'phản hồi thành công (HTTP 200)': (r) => r.status === 200,
  });
}
