import { Routes, Route } from "react-router-dom";

// ===== 인증 (auth) — 담당 A =====
import { LoginPage } from "../pages/auth/LoginPage";
import { SignupPage } from "../pages/auth/SignupPage";
import { FindPasswordPage } from "../pages/auth/FindPasswordPage";
import { OAuth2CallbackPage } from "../pages/auth/OAuth2CallbackPage";


// ===== 마이페이지 (my) — 담당 A =====
import { MyPage } from "../pages/my/MyPage";
import { EditProfilePage } from "../pages/my/EditProfilePage";
import { WishlistPage } from "../pages/my/WishlistPage";
import { PointHistoryPage } from "../pages/my/PointHistoryPage";
import { CouponPage } from "../pages/my/CouponPage";
import { MyInquiriesPage } from "../pages/my/MyInquiriesPage";
import { MyInquiryDetailPage } from "../pages/my/MyInquiryDetailPage";

// ===== 멤버십 (membership) — 담당 A =====
import { MembershipPage } from "../pages/membership/MembershipPage";
import { MembershipSuccessPage } from "../pages/membership/MembershipSuccessPage";
import { MembershipFailPage } from "../pages/membership/MembershipFailPage";

// ===== 상품 (product) — 담당 B =====
import { HomePage } from "../pages/product/HomePage";
import { ProductListPage } from "../pages/product/ProductListPage";
import { ProductDetailPage } from "../pages/product/ProductDetailPage";
import { SearchPage } from "../pages/product/SearchPage";

// ===== 장바구니 (cart) — 담당 B =====
import { CartPage } from "../pages/cart/CartPage";

// ===== 주문/결제 (order) — 담당 B =====
import { CheckoutPage } from "../pages/order/CheckoutPage";
import { OrderCompletePage } from "../pages/order/OrderCompletePage";
import { OrderHistoryPage } from "../pages/order/OrderHistoryPage";
import { OrderDetailPage } from "../pages/order/OrderDetailPage";
import { ResumeCheckoutPage } from "../pages/order/ResumeCheckoutPage";
import { PaymentSuccessPage } from "../pages/order/PaymentSuccessPage";
import { PaymentFailPage } from "../pages/order/PaymentFailPage";

// ===== 알림 (notifications) — 담당 C =====
import { NotificationsPage } from "../pages/notifications/NotificationsPage";

// ===== 고객지원 (support) — 스코프 제외(파일 유지) =====
import { SupportPage } from "../pages/support/SupportPage";
import { SupportInquiryPage } from "../pages/support/SupportInquiryPage";
import { NoticeListPage } from "../pages/support/NoticeListPage";
import { NoticeDetailPage } from "../pages/support/NoticeDetailPage";
import { FaqPage } from "../pages/support/FaqPage";
import { QnaListPage } from "../pages/support/QnaListPage";
import { QnaDetailPage } from "../pages/support/QnaDetailPage";
import { QnaWritePage } from "../pages/support/QnaWritePage";

// ===== 관리자 공통 (admin) =====
import { AdminRoute } from "../components/AdminRoute";
import { AdminPage } from "../pages/admin/AdminPage";

// ===== 관리자 · 이탈방지 (admin/churn) — 담당 C =====
import { AdminChurnPage } from "../pages/admin/churn/AdminChurnPage";
import { AdminChurnCustomersPage } from "../pages/admin/churn/AdminChurnCustomersPage";
import { AdminChurnReportPage } from "../pages/admin/churn/AdminChurnReportPage";
import { AdminInterventionsPage } from "../pages/admin/churn/AdminInterventionsPage";

// ===== 관리자 · 운영 (admin/manage) =====
import { AdminProductsPage } from "../pages/admin/manage/AdminProductsPage";
import { AdminProductFormPage } from "../pages/admin/manage/AdminProductFormPage";
import { AdminOrdersPage } from "../pages/admin/manage/AdminOrdersPage";
import { AdminMembersPage } from "../pages/admin/manage/AdminMembersPage";
import { AdminMembershipPage } from "../pages/admin/manage/AdminMembershipPage";
import { AdminCouponsPage } from "../pages/admin/manage/AdminCouponsPage";
// 통계·AI추천관리 페이지는 보류 — 파일은 유지하되 라우팅에서 제외 (over-scope 정리)
// import { AdminStatsPage } from "../pages/admin/manage/AdminStatsPage";
// import { AdminRecommendationsPage } from "../pages/admin/manage/AdminRecommendationsPage";

export function AppRouter() {
  return (
    <Routes>
      {/* ---------- 인증 ---------- */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/find-password" element={<FindPasswordPage />} />
      <Route path="/oauth2/callback" element={<OAuth2CallbackPage />} />

      {/* ---------- 마이페이지 ---------- */}
      <Route path="/my" element={<MyPage />} />
      <Route path="/my/profile" element={<EditProfilePage />} />
      <Route path="/my/wishlist" element={<WishlistPage />} />
      <Route path="/my/points" element={<PointHistoryPage />} />
      <Route path="/my/coupons" element={<CouponPage />} />
      <Route path="/my/inquiries" element={<MyInquiriesPage />} />
      <Route path="/my/inquiries/:id" element={<MyInquiryDetailPage />} />

      {/* ---------- 멤버십 ---------- */}
      <Route path="/membership" element={<MembershipPage />} />
      <Route path="/membership/success" element={<MembershipSuccessPage />} />
      <Route path="/membership/fail" element={<MembershipFailPage />} />

      {/* ---------- 상품 ---------- */}
      <Route path="/" element={<HomePage />} />
      <Route path="/products" element={<ProductListPage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/search" element={<SearchPage />} />

      {/* ---------- 장바구니 · 주문/결제 ---------- */}
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/checkout/resume/:orderId" element={<ResumeCheckoutPage />} />
      <Route path="/order/complete" element={<OrderCompletePage />} />
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/payment/fail" element={<PaymentFailPage />} />
      <Route path="/my/orders" element={<OrderHistoryPage />} />
      <Route path="/my/orders/:no" element={<OrderDetailPage />} />

      {/* ---------- 알림 ---------- */}
      <Route path="/notifications" element={<NotificationsPage />} />

      {/* ---------- 고객지원 (스코프 제외 — 화면만 유지) ---------- */}
      <Route path="/my/support" element={<SupportPage />} />
      <Route path="/my/support/inquiry" element={<SupportInquiryPage />} />
      <Route path="/my/support/notices" element={<NoticeListPage />} />
      <Route path="/my/support/notices/:id" element={<NoticeDetailPage />} />
      <Route path="/my/support/faq" element={<FaqPage />} />
      <Route path="/qna" element={<QnaListPage />} />
      <Route path="/qna/:id" element={<QnaDetailPage />} />
      <Route path="/qna/write" element={<QnaWritePage />} />

      {/* ---------- 관리자 ---------- */}
      <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

      {/* 관리자 · 이탈방지 */}
      <Route path="/admin/churn" element={<AdminRoute><AdminChurnPage /></AdminRoute>} />
      <Route path="/admin/churn/customers" element={<AdminRoute><AdminChurnCustomersPage /></AdminRoute>} />
      <Route path="/admin/churn/report" element={<AdminRoute><AdminChurnReportPage /></AdminRoute>} />
      <Route path="/admin/interventions" element={<AdminRoute><AdminInterventionsPage /></AdminRoute>} />

      {/* 관리자 · 운영 */}
      <Route path="/admin/products" element={<AdminRoute><AdminProductsPage /></AdminRoute>} />
      <Route path="/admin/products/new" element={<AdminRoute><AdminProductFormPage /></AdminRoute>} />
      <Route path="/admin/products/edit/:id" element={<AdminRoute><AdminProductFormPage /></AdminRoute>} />
      <Route path="/admin/orders" element={<AdminRoute><AdminOrdersPage /></AdminRoute>} />
      <Route path="/admin/members" element={<AdminRoute><AdminMembersPage /></AdminRoute>} />
      <Route path="/admin/membership" element={<AdminRoute><AdminMembershipPage /></AdminRoute>} />
      <Route path="/admin/coupons" element={<AdminRoute><AdminCouponsPage /></AdminRoute>} />
      {/* /admin/stats · /admin/recommendations : 보류 (파일 유지, 라우팅 제외) */}
    </Routes>
  );
}
