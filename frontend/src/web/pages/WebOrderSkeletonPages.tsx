import { useParams } from "react-router-dom";
import { WebSectionShell } from "../components/WebSectionShell";

export { WebCheckoutPage } from "./WebCheckoutPage";
export function WebResumeCheckoutPage() { const { orderId } = useParams(); return <WebSectionShell eyebrow="RESUME CHECKOUT" title="결제 이어하기" description={`주문 ${orderId ?? ""}의 결제를 이어서 진행합니다.`} sections={[{ title: "주문 상태 확인", description: "결제 대기 중인 주문의 상품과 금액을 다시 확인합니다." }, { title: "결제 정보 재검증", description: "재고·쿠폰·포인트·최종 금액을 서버에서 다시 검증해야 합니다." }]} primary={{ label: "결제 다시 시도", to: "/web/payment/success" }} secondary={{ label: "주문 내역", to: "/web/my/orders" }} />; }
export { WebOrderCompletePage } from "./WebOrderCompletePage";
export { PaymentSuccessPage as WebPaymentSuccessPage } from "../../pages/order/PaymentSuccessPage";
export function WebPaymentFailPage() { return <WebSectionShell eyebrow="PAYMENT" title="결제를 완료하지 못했어요" description="실패 사유를 확인한 뒤 다시 결제하거나 장바구니로 돌아갈 수 있습니다." sections={[{ title: "실패 사유", description: "결제사 오류 코드와 사용자 안내 문구가 표시될 영역입니다." }]} primary={{ label: "결제 다시 시도", to: "/web/checkout" }} secondary={{ label: "장바구니로 돌아가기", to: "/web/cart" }} />; }
