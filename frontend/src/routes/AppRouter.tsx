import { Routes, Route } from "react-router-dom";
import { HomePage } from "../pages/HomePage";
import { ProductListPage } from "../pages/ProductListPage";
import { ProductDetailPage } from "../pages/ProductDetailPage";
import { CartPage } from "../pages/CartPage";
import { LoginPage } from "../pages/LoginPage";
import { SignupPage } from "../pages/SignupPage";
import { MyPage } from "../pages/MyPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { OrderCompletePage } from "../pages/OrderCompletePage";
import { MembershipPage } from "../pages/MembershipPage";
import { SearchPage } from "../pages/SearchPage";
import { AdminPage } from "../pages/AdminPage";
import { AdminChurnPage } from "../pages/AdminChurnPage";
import { AdminChurnCustomersPage } from "../pages/AdminChurnCustomersPage";
import { AdminChurnReportPage } from "../pages/AdminChurnReportPage";
import { AdminInterventionsPage } from "../pages/AdminInterventionsPage";
import { AdminProductsPage } from "../pages/AdminProductsPage";
import { AdminProductFormPage } from "../pages/AdminProductFormPage";
import { AdminOrdersPage } from "../pages/AdminOrdersPage";
import { AdminMembersPage } from "../pages/AdminMembersPage";
import { AdminMembershipPage } from "../pages/AdminMembershipPage";
import { AdminCouponsPage } from "../pages/AdminCouponsPage";
// 통계·AI추천관리 페이지는 보류 — 파일은 유지하되 라우팅에서 제외 (over-scope 정리)
// import { AdminStatsPage } from "../pages/AdminStatsPage";
// import { AdminRecommendationsPage } from "../pages/AdminRecommendationsPage";
import { AdminLoginPage } from "../pages/AdminLoginPage";
import { AdminRoute } from "../components/AdminRoute";
import { OrderHistoryPage } from "../pages/OrderHistoryPage";
import { OrderDetailPage } from "../pages/OrderDetailPage";
import { WishlistPage } from "../pages/WishlistPage";
import { PointHistoryPage } from "../pages/PointHistoryPage";
import { CouponPage } from "../pages/CouponPage";
import { EditProfilePage } from "../pages/EditProfilePage";
import { SupportPage } from "../pages/SupportPage";
import { SupportInquiryPage } from "../pages/SupportInquiryPage";
import { NoticeListPage } from "../pages/NoticeListPage";
import { NoticeDetailPage } from "../pages/NoticeDetailPage";
import { FaqPage } from "../pages/FaqPage";
import { NotificationsPage } from "../pages/NotificationsPage";
import { MyInquiriesPage } from "../pages/MyInquiriesPage";
import { MyInquiryDetailPage } from "../pages/MyInquiryDetailPage";
import { QnaListPage } from "../pages/QnaListPage";
import { QnaDetailPage } from "../pages/QnaDetailPage";
import { QnaWritePage } from "../pages/QnaWritePage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/products" element={<ProductListPage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/my" element={<MyPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/order/complete" element={<OrderCompletePage />} />
      <Route path="/membership" element={<MembershipPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
      <Route path="/admin/churn" element={<AdminRoute><AdminChurnPage /></AdminRoute>} />
      <Route path="/admin/churn/customers" element={<AdminRoute><AdminChurnCustomersPage /></AdminRoute>} />
      <Route path="/admin/churn/report" element={<AdminRoute><AdminChurnReportPage /></AdminRoute>} />
      <Route path="/admin/interventions" element={<AdminRoute><AdminInterventionsPage /></AdminRoute>} />
      <Route path="/admin/products" element={<AdminRoute><AdminProductsPage /></AdminRoute>} />
      <Route path="/admin/products/new" element={<AdminRoute><AdminProductFormPage /></AdminRoute>} />
      <Route path="/admin/orders" element={<AdminRoute><AdminOrdersPage /></AdminRoute>} />
      <Route path="/admin/members" element={<AdminRoute><AdminMembersPage /></AdminRoute>} />
      <Route path="/admin/membership" element={<AdminRoute><AdminMembershipPage /></AdminRoute>} />
      <Route path="/admin/coupons" element={<AdminRoute><AdminCouponsPage /></AdminRoute>} />
      {/* /admin/stats · /admin/recommendations : 보류 (파일 유지, 라우팅 제외) */}
      <Route path="/my/orders" element={<OrderHistoryPage />} />
      <Route path="/my/orders/:no" element={<OrderDetailPage />} />
      <Route path="/my/wishlist" element={<WishlistPage />} />
      <Route path="/my/points" element={<PointHistoryPage />} />
      <Route path="/my/coupons" element={<CouponPage />} />
      <Route path="/my/profile" element={<EditProfilePage />} />
      <Route path="/my/inquiries" element={<MyInquiriesPage />} />
      <Route path="/my/inquiries/:id" element={<MyInquiryDetailPage />} />
      <Route path="/my/support" element={<SupportPage />} />
      <Route path="/my/support/inquiry" element={<SupportInquiryPage />} />
      <Route path="/my/support/notices" element={<NoticeListPage />} />
      <Route path="/my/support/notices/:id" element={<NoticeDetailPage />} />
      <Route path="/my/support/faq" element={<FaqPage />} />
      <Route path="/qna" element={<QnaListPage />} />
      <Route path="/qna/:id" element={<QnaDetailPage />} />
      <Route path="/qna/write" element={<QnaWritePage />} />
    </Routes>
  );
}
