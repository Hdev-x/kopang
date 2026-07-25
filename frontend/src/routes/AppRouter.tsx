import { Routes, Route } from "react-router-dom";

// ===== 인증 (auth) — 담당 A =====
import { LoginPage } from "../pages/auth/LoginPage";
import { SignupPage } from "../pages/auth/SignupPage";
import { FindPasswordPage } from "../pages/auth/FindPasswordPage";
import { FindEmailPage } from "../pages/auth/FindEmailPage";
import { OAuth2CallbackPage } from "../pages/auth/OAuth2CallbackPage";


// ===== 마이페이지 (my) — 담당 A =====
import { MyPage } from "../pages/my/MyPage";
import { EditProfilePage } from "../pages/my/EditProfilePage";
import { WishlistPage } from "../pages/my/WishlistPage";
import { PointHistoryPage } from "../pages/my/PointHistoryPage";
import { CouponPage } from "../pages/my/CouponPage";
import { MyInquiriesPage } from "../pages/my/MyInquiriesPage";
import { MyInquiryDetailPage } from "../pages/my/MyInquiryDetailPage";
import { AddressManagementPage } from "../pages/my/AddressManagementPage";


// ===== 멤버십 (membership) — 담당 A =====
import { MembershipPage } from "../pages/membership/MembershipPage";
import { MembershipSuccessPage } from "../pages/membership/MembershipSuccessPage";
import { MembershipFailPage } from "../pages/membership/MembershipFailPage";

// ===== 상품 (product) — 담당 B =====
import { HomePage } from "../pages/product/HomePage";
import { ProductListPage } from "../pages/product/ProductListPage";
import { ProductDetailPage } from "../pages/product/ProductDetailPage";
import { SearchPage } from "../pages/product/SearchPage";

// ===== Web 전용 사용자 화면 =====
import { WebHomePage } from "../web/pages/WebHomePage";
import { WebProductListPage } from "../web/pages/WebProductListPage";
import { WebProductDetailPage } from "../web/pages/WebProductDetailPage";
import { WebLoginPage } from "../web/pages/WebLoginPage";
import { WebSignupPage } from "../web/pages/WebSignupPage";
import { WebFindPasswordPage } from "../web/pages/WebFindPasswordPage";
import { WebFindEmailPage } from "../web/pages/WebFindEmailPage";
import { WebSearchPage } from "../web/pages/WebSearchPage";
import { WebCartPage } from "../web/pages/WebCartPage";
import { WebCheckoutPage, WebOrderCompletePage, WebPaymentFailPage, WebPaymentSuccessPage, WebResumeCheckoutPage } from "../web/pages/WebOrderSkeletonPages";
import { WebAccountPage } from "../web/pages/WebAccountPages";
import { WebFaqPage, WebNoticeDetailPage, WebNoticeListPage, WebNotificationsPage, WebQnaDetailPage, WebQnaListPage, WebQnaWritePage, WebSupportInquiryPage, WebSupportPage } from "../web/pages/WebServiceSkeletonPages";
import { WebMembershipFailPage, WebMembershipPage, WebMembershipSuccessPage } from "../web/pages/WebMembershipPages";
import { WebPointsPage } from "../web/pages/WebPointsPage";

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
import { AdminFaqPage } from "../pages/admin/manage/AdminFaqPage";
import { AdminInquiriesPage } from "../pages/admin/manage/AdminInquiriesPage";
import { AdminInquiryDetailPage } from "../pages/admin/manage/AdminInquiryDetailPage";
import { AdminStatsPage } from "../pages/admin/manage/AdminStatsPage";
import { AdminRecommendationsPage } from "../pages/admin/manage/AdminRecommendationsPage";

export function AppRouter() {
  return (
    <Routes>
      {/* ---------- 인증 ---------- */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/find-password" element={<FindPasswordPage />} />
      <Route path="/find-email" element={<FindEmailPage />} />
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

      {/* ---------- Web 전용 사용자 화면 ---------- */}
      <Route path="/web" element={<WebHomePage />} />
      <Route path="/web/products" element={<WebProductListPage />} />
      <Route path="/web/products/:id" element={<WebProductDetailPage />} />
      <Route path="/web/login" element={<WebLoginPage />} />
      <Route path="/web/signup" element={<WebSignupPage />} />
      <Route path="/web/find-password" element={<WebFindPasswordPage />} />
      <Route path="/web/find-email" element={<WebFindEmailPage />} />
      <Route path="/web/search" element={<WebSearchPage />} />
      <Route path="/web/cart" element={<WebCartPage />} />
      <Route path="/web/checkout" element={<WebCheckoutPage />} />
      <Route path="/web/checkout/resume/:orderId" element={<WebResumeCheckoutPage />} />
      <Route path="/web/order/complete" element={<WebOrderCompletePage />} />
      <Route path="/web/payment/success" element={<WebPaymentSuccessPage />} />
      <Route path="/web/payment/fail" element={<WebPaymentFailPage />} />
      <Route path="/web/my" element={<WebAccountPage kind="home" />} />
      <Route path="/web/my/profile" element={<WebAccountPage kind="profile" />} />
      <Route path="/web/my/notifications" element={<WebAccountPage kind="notifications" />} />
      <Route path="/web/my/password" element={<WebAccountPage kind="password" />} />
      <Route path="/web/my/orders" element={<WebAccountPage kind="orders" />} />
      <Route path="/web/my/orders/:no" element={<WebAccountPage kind="order" />} />
      <Route path="/web/my/addresses" element={<WebAccountPage kind="addresses" />} />
      <Route path="/web/my/wishlist" element={<WebAccountPage kind="wishlist" />} />
      <Route path="/web/my/points" element={<WebPointsPage />} />
      <Route path="/web/my/coupons" element={<WebAccountPage kind="coupons" />} />
      <Route path="/web/my/inquiries" element={<WebAccountPage kind="inquiries" />} />
      <Route path="/web/my/inquiries/:id" element={<WebAccountPage kind="inquiry" />} />
      <Route path="/web/my/reviews" element={<WebAccountPage kind="reviews" />} />
      <Route path="/web/my/reviews/write" element={<WebAccountPage kind="review-write" />} />
      <Route path="/web/membership" element={<WebMembershipPage />} />
      <Route path="/web/membership/success" element={<WebMembershipSuccessPage />} />
      <Route path="/web/membership/fail" element={<WebMembershipFailPage />} />
      <Route path="/web/notifications" element={<WebNotificationsPage />} />
      <Route path="/web/support" element={<WebSupportPage />} />
      <Route path="/web/support/inquiry" element={<WebSupportInquiryPage />} />
      <Route path="/web/support/notices" element={<WebNoticeListPage />} />
      <Route path="/web/support/notices/:id" element={<WebNoticeDetailPage />} />
      <Route path="/web/support/faq" element={<WebFaqPage />} />
      <Route path="/web/qna" element={<WebQnaListPage />} />
      <Route path="/web/qna/:id" element={<WebQnaDetailPage />} />
      <Route path="/web/qna/write" element={<WebQnaWritePage />} />
      <Route path="/web/oauth2/callback" element={<OAuth2CallbackPage />} />
      {/* 기존 사용자 화면을 mobile 기준으로 유지하는 임시 진입점 */}
      <Route path="/mobile" element={<HomePage />} />

      {/* ---------- 장바구니 · 주문/결제 ---------- */}
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/checkout/resume/:orderId" element={<ResumeCheckoutPage />} />
      <Route path="/order/complete" element={<OrderCompletePage />} />
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/payment/fail" element={<PaymentFailPage />} />
      <Route path="/my/orders" element={<OrderHistoryPage />} />
      <Route path="/my/orders/:no" element={<OrderDetailPage />} />
      <Route path="/my/addresses" element={<AddressManagementPage />} />

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
      <Route path="/admin/inquiries/:id" element={<AdminRoute><AdminInquiryDetailPage /></AdminRoute>} />
      <Route path="/admin/inquiries" element={<AdminRoute><AdminInquiriesPage /></AdminRoute>} />

      {/* 관리자 · 이탈방지 */}
      <Route path="/admin/churn" element={<AdminRoute><AdminChurnPage /></AdminRoute>} />
      <Route path="/admin/churn/customers" element={<AdminRoute><AdminChurnCustomersPage /></AdminRoute>} />
      <Route path="/admin/churn/customers/:userId" element={<AdminRoute><AdminChurnCustomersPage /></AdminRoute>} />
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
      <Route path="/admin/faqs" element={<AdminRoute><AdminFaqPage /></AdminRoute>} />
      <Route path="/admin/recommendations" element={<AdminRoute><AdminRecommendationsPage /></AdminRoute>} />
      <Route path="/admin/stats" element={<AdminRoute><AdminStatsPage /></AdminRoute>} />
    </Routes>
  );
}
