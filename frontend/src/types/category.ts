// 계층형 카테고리 (대=1 / 중=2 / 소=3)
// DB category 테이블과 동일한 모양: id, parentId, depth
export type Category = {
  id: number;
  parentId: number | null;
  depth: 1 | 2 | 3;
  name: string;
  emoji?: string;
  keyword?: string; // 이미지 검색용 영어 키워드 (자식이 상속)
  children?: Category[];
};

export const CATEGORY_EMOJIS: Record<string, string> = {
  "식품": "🥬",
  "생활용품": "🧴",
  "가전/디지털": "💻",
  "패션": "👕",
  "뷰티": "💄",
  "스포츠": "⚽",
  "완구/취미": "🧸",
  "반려동물": "🐶",
  "자동차": "🚗",
  "출산/유아동": "🍼",
  "가구/인테리어": "🛋️",
  "문구/오피스": "✏️",
  "헬스/건강": "💊"
};
