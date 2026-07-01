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
