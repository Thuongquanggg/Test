// Test/test.js

import http from 'k6/http';
import { check, sleep } from 'k6';

// --- Cấu hình chu trình tải (Đề xuất tăng tải từ từ) ---
const loadStages = [
  { duration: '30s', target: 200 },     // Tăng dần lên 200 VUs trong 30 giây
  { duration: '1m30s', target: 200 },   // Giữ tải ở 200 VUs trong 1.5 phút
  { duration: '10s', target: 0 },       // Giảm tải về 0
];

/*
// --- Cấu hình chu trình tải GỐC của bạn (rủi ro bị chặn cao) ---
const loadStages = [
  { duration: '2s', target: 1000 },
  { duration: '2m18s', target: 1000 },
  { duration: '10s', target: 0 },
];
*/

export const options = {
  // Ngưỡng chung cho toàn bộ bài test
  thresholds: {
    'http_req_failed': ['rate<0.1'],      // Tỷ lệ lỗi phải dưới 10%
    'http_req_duration': ['p(95)<5000'],  // 95% request phải dưới 5 giây
  },

  // Sử dụng 'scenarios' để điều khiển vòng lặp
  scenarios: {
    // Đặt tên cho kịch bản
    looping_load_test: {
      executor: 'ramping-vus', // Executor này hoạt động giống như 'stages'
      startVUs: 0,
      
      // Các giai đoạn tải cho MỖI vòng lặp
      stages: loadStages,

      // Thời gian nghỉ giữa các vòng lặp.
      // Sau khi stages hoàn thành (VUs về 0), k6 sẽ đợi 30 giây
      // trước khi bắt đầu chu trình stages tiếp theo.
      gracefulRampDown: '0s',
      gracefulStop: '30s',

      // Số lần thực thi toàn bộ chu trình (stages + nghỉ)
      iterations: 5,

      // Chỉ định hàm logic chính mà các VUs sẽ thực thi
      exec: 'run',
    },
  },
};

// Lấy URL mục tiêu từ biến môi trường được truyền bởi file YML
const TARGET_URL = __ENV.K6_TARGET_URL || 'https://test.k6.io'; // Fallback để test cục bộ

// Hàm logic chính được thực thi bởi các VUs
// Tên hàm ('run') phải khớp với giá trị 'exec' trong scenarios
export function run() {
  const res = http.get(TARGET_URL);

  check(res, {
    'Trang chủ phản hồi thành công (status 200)': (r) => r.status === 200,
  });

  // Không cần sleep ở đây vì nhịp độ đã được kiểm soát bởi stages
}
