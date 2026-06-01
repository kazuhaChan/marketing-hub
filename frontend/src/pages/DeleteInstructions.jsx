import React from 'react';
import { Link } from 'react-router-dom';

function DeleteInstructions() {
  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', color: 'var(--text-main)' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '500' }}>
          &larr; Quay lại Đăng nhập
        </Link>
      </div>

      <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '40px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '20px', fontWeight: '800', background: 'linear-gradient(to right, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Hướng dẫn xóa dữ liệu người dùng (User Data Deletion)
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '30px' }}>
          Trang hướng dẫn tuân thủ chính sách nền tảng của Meta (Facebook App Platform Policy)
        </p>

        <section style={{ marginBottom: '24px' }}>
          <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
            Hệ thống <strong>Marketing Hub</strong> là ứng dụng hỗ trợ phân phối tin đăng, sản phẩm thông qua kết nối API chính thức của Facebook. Chúng tôi cam kết bảo vệ dữ liệu cá nhân của người dùng và hoàn toàn tuân thủ các quy định về quyền riêng tư của Meta.
          </p>
          <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
            Nếu bạn muốn gỡ bỏ liên kết ứng dụng và yêu cầu xóa toàn bộ các dữ liệu liên quan (như token liên kết trang, thông tin trang và các bài viết tạm lưu), bạn có thể thực hiện dễ dàng theo 2 cách dưới đây.
          </p>
        </section>

        <section style={{ marginBottom: '28px', borderLeft: '4px solid var(--primary)', paddingLeft: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', color: '#60a5fa', marginBottom: '12px', fontWeight: '600' }}>
            Cách 1: Gỡ bỏ trực tiếp trên Facebook (Khuyên dùng)
          </h2>
          <p style={{ marginBottom: '12px', lineHeight: '1.6' }}>
            Bạn có thể tự chủ động xóa dữ liệu hoạt động của mình bằng cách gỡ bỏ ứng dụng <strong>Marketing Hub</strong> theo các bước sau:
          </p>
          <ol style={{ paddingLeft: '20px', lineHeight: '1.8', marginBottom: '16px' }}>
            <li>
              Truy cập vào tài khoản Facebook cá nhân của bạn, mở mục <strong>Cài đặt & Quyền riêng tư</strong> &rarr; <strong>Cài đặt</strong>.
            </li>
            <li>
              Ở menu bên trái, cuộn xuống và chọn mục <strong>Ứng dụng và trang web</strong> (hoặc nhấn trực tiếp vào liên kết: <a href="https://www.facebook.com/settings?tab=applications" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>Facebook Apps Settings</a>).
            </li>
            <li>
              Tìm kiếm ứng dụng có tên <strong>Marketing Hub</strong>.
            </li>
            <li>
              Nhấn nút <strong>Gỡ</strong> bên cạnh tên ứng dụng.
            </li>
            <li>
              Tích chọn ô <em>"Đồng thời xóa tất cả bài viết, ảnh và video..."</em> nếu bạn muốn xóa sạch dấu vết hoạt động, sau đó nhấn <strong>Gỡ</strong> một lần nữa để xác nhận hoàn tất.
            </li>
          </ol>
        </section>

        <section style={{ marginBottom: '28px', borderLeft: '4px solid var(--accent)', paddingLeft: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', color: '#a78bfa', marginBottom: '12px', fontWeight: '600' }}>
            Cách 2: Gửi yêu cầu xóa dữ liệu qua Email hỗ trợ
          </h2>
          <p style={{ marginBottom: '12px', lineHeight: '1.6' }}>
            Nếu bạn muốn xóa vĩnh viễn tài khoản của mình trên hệ thống <strong>Marketing Hub</strong> cùng tất cả các dữ liệu đã lưu trữ trong cơ sở dữ liệu của chúng tôi, vui lòng thực hiện:
          </p>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
            <li>
              Gửi một email yêu cầu với tiêu đề: <strong>[Yêu cầu xóa dữ liệu Marketing Hub]</strong>
            </li>
            <li>
              Đến địa chỉ email của Quản trị viên hệ thống: <a href="mailto:nddung2609@gmail.com" style={{ fontWeight: 'bold' }}>nddung2609@gmail.com</a>
            </li>
            <li>
              Nội dung cung cấp bao gồm: <em>Tên đăng nhập hệ thống của bạn</em> hoặc <em>Link tài khoản Facebook đã liên kết</em>.
            </li>
            <li>
              Đội ngũ kỹ thuật của chúng tôi sẽ xử lý yêu cầu, gỡ bỏ tất cả các token truy cập, thông tin hồ sơ và phản hồi xác nhận hoàn tất xóa sạch dữ liệu cho bạn trong vòng <strong>24 giờ làm việc</strong>.
            </li>
          </ul>
        </section>

        <footer style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Cảm ơn bạn đã đồng hành và tin tưởng dịch vụ của Marketing Hub!
        </footer>
      </div>
    </div>
  );
}

export default DeleteInstructions;
