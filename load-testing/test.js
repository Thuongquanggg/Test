import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  // Kịch bản này mô phỏng một "soak test" - duy trì tải trong một khoảng thời gian
  // để xem hệ thống có bị suy giảm hiệu năng theo thời gian không.
  stages: [
    { duration: '2m', target: 1000 }, // Tăng dần lên 100 người dùng ảo trong 2 phút
    { duration: '500m', target: 1000 }, // Giữ 100 người dùng ảo trong 5 phút để kiểm tra độ ổn định
    { duration: '1m', target: 0 },   // Giảm dần về 0
  ],
  thresholds: {
    // Thời gian phản hồi cho 95% yêu cầu phải dưới 2 giây (đăng nhập thường chậm hơn)
    'http_req_duration': ['p(95)<2000'],
    // Tỷ lệ yêu cầu thất bại (lỗi server 5xx) phải dưới 1%
    'http_req_failed': ['rate<0.01'],
    // Hơn 98% các lần check phải thành công
    'checks': ['rate>0.98'],
  },
};

export default function () {
  // Đảm bảo biến môi trường đã được thiết lập
  if (!__ENV.TARGET_URL) {
    throw new Error('Secret TARGET_URL is not set!');
  }

  // API endpoint cho việc đăng nhập
  const loginUrl = `${__ENV.TARGET_URL}/api/v1/auth/login`;

  // Dữ liệu (payload) gửi đi. Chúng ta sử dụng một tài khoản không tồn tại.
  // Mục tiêu là kiểm tra server có xử lý được yêu cầu hay không, không phải để đăng nhập thành công.
  const payload = JSON.stringify({
    email: `user${__VU}@test.com`, // Dùng __VU để mỗi user ảo có một email khác nhau
    password: 'password123',
  });

  // Headers cho yêu cầu POST, chỉ định nội dung là JSON
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Gửi yêu cầu POST đến API đăng nhập
  const res = http.post(loginUrl, payload, params);

  // Kiểm tra kết quả
  check(res, {
    // Một yêu cầu đăng nhập với thông tin sai sẽ trả về status 401 (Unauthorized).
    // Đây là hành vi ĐÚNG của server. Chúng ta check điều này để đảm bảo logic app vẫn chạy.
    // Nếu server trả về 500, đó mới là lỗi.
    'login API responded with 401': (r) => r.status === 401,
  });

  // Mỗi người dùng ảo sẽ đợi 1-3 giây trước khi thực hiện lần đăng nhập tiếp theo.
  // Điều này giúp mô phỏng hành vi thực tế và tránh tạo ra các cuộc tấn công DoS vô nghĩa.
  sleep(Math.random() * 2 + 1);
}
