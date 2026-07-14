export type ChatbotReply = {
    answer: string;
    suggestions: string[];

};

type ChatbotRule = {
    question: string;
    answer: string;
    keywords: string[];
    suggestions: string[];

};

    export const INITIAL_QUESTIONS = [
        "배송은 얼마나 걸려요?",
        "반품하고 싶어요",
        "포인트는 어떻게 쌓여요?",
        "추천 상품 알려줘",
];

const CHATBOT_RULES: ChatbotRule[] = [
    {
        question: "배송은 얼마나 걸려요?",
        answer: "주문 후 보통 1~2일 내 도착해요. 배송이 지연되면 주문내역에서 상태를 확인할 수 있어요",
        keywords: ["배송", "도착", "택배", "언제와", "언제 와", "배송조회"],
        suggestions:["주문 조회는 어디서 하나요?", "배송이 지연됐어요", "1:1 문의는 어디서 하나요?"],
    },

    {
        question: "반품하고 싶어요",
        answer: "마이페이지의 주문내역에서 반품 신청을 할 수 있어요. 상품 상태와 기간에 따라 판품 가능 여부가 달라질수 있어요.",
        keywords: ["반품", "환불", "교환", "취소"],
        suggestions:["주문 취소는 어떻게 하나요?", "환불은 언제 되나요?", "1:1 문의는 어디서 하나요?"],

    },
    {
        question: "포인트는 어떻게 쌓여요?",
        answer: "구매 시 포인트가 적립되고, 리뷰 작성 시 추가 적립될 수 있어요. 자세한 적립 내역은 마이페이지에서 확인할 수 있어요.",
        keywords: ["포인트", "적립", "리뷰", "혜택"],
        suggestions: ["쿠폰은 어디서 확인하나요?", "리뷰 적립은 언제 되나요?", "멤버십 혜택이 궁금해요"],

    },
    {
        question: "추천 상품 알려줘",
        answer: "최근 본 상품과 관심 카테고리를 기준으로 추천 상품을 안내할 수 있어요.",
        keywords: ["추천", "상품", "맞춤", "골라줘"],
        suggestions: ["인기 상품 알려줘", "최근 본 상품 기준으로 추천해줘", "할인 상품 있어요?"],

    },
    {
        question: "1:1 문의는 어디서 하나요?",
        answer: "고객센터에서 1:1 문의하기 버튼을 누르면 문의를 남길 수 있어요. 작성한 문의는 문의 내역에서 확인할 수 있어요.",
        keywords: ["1:1", "문의", "고객센터", "상담"],
        suggestions: ["문의 내역은 어디서 보나요?", "답변은 언제 오나요?", "FAQ도 볼 수 있나요?"],
    },
];

export function getChatbotReply(message: string): ChatbotReply {
    const normalizedMessage = message.replace(/\s/g, "").toLowerCase();
    const matchedRule = CHATBOT_RULES.find((rule) =>
        rule.keywords.some((keyword) =>
            normalizedMessage.includes(keyword.replace(/\s/g, "").toLowerCase()),
            ),
        );


        if(matchedRule) {
            return {
                answer: matchedRule.answer,
                suggestions: matchedRule.suggestions,

            };
        }

        return {
            answer: "문의 내용을 확인했어요. 더 정확한 안내가 필요하면 1:1 문의를 남겨주세요.",
            suggestions: ["1:1 문의는 어디서 하나요?", "FAQ를 보고 싶어요", "배송은 얼마나 걸려요?"],
        };

        }