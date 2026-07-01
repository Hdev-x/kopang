// 카테고리 단일 소스 (Notion "웹" 정리본 기준)
// 대분류 13 / 중분류 93 / 소분류(예시 있던 것만).
// 여기서 트리·평면 목록·목 상품을 한 번에 만들어 핸들러가 가져다 씀.
import type { Category } from "../types/category";
import type { Product } from "../types/product";
import { IMAGE_COUNTS } from "./imageManifest";

type Raw = { name: string; emoji?: string; keyword?: string; children?: Raw[] };

const RAW: Raw[] = [
  { name: "식품", emoji: "🥬", keyword: "food", children: [
    { name: "신선식품" }, { name: "가공식품" }, { name: "간편식" },
    { name: "음료" }, { name: "베이커리/간식" }, { name: "건강식품" },
  ] },
  { name: "생활용품", emoji: "🧴", keyword: "household", children: [
    { name: "주방" }, { name: "욕실" }, { name: "청소" },
    { name: "세탁/세제" }, { name: "수납/정리" }, { name: "생활잡화" },
  ] },
  { name: "가전/디지털", emoji: "💻", keyword: "electronics", children: [
    { name: "대형가전", children: [{ name: "냉장고" }, { name: "세탁기" }, { name: "에어컨" }, { name: "TV" }] },
    { name: "주방가전", children: [{ name: "전자레인지" }, { name: "에어프라이어" }, { name: "밥솥" }, { name: "커피머신" }] },
    { name: "계절가전", children: [{ name: "선풍기" }, { name: "히터" }, { name: "제습기" }, { name: "가습기" }] },
    { name: "생활가전", children: [{ name: "청소기" }, { name: "다리미" }, { name: "안마기" }] },
    { name: "컴퓨터/노트북", children: [{ name: "PC" }, { name: "노트북" }, { name: "모니터" }, { name: "주변기기" }] },
    { name: "모바일/태블릿", children: [{ name: "스마트폰" }, { name: "태블릿" }, { name: "액세서리" }] },
    { name: "음향/영상", children: [{ name: "이어폰" }, { name: "스피커" }, { name: "카메라" }] },
    { name: "게임/콘솔" },
  ] },
  { name: "패션", emoji: "👕", keyword: "fashion", children: [
    { name: "여성의류" }, { name: "남성의류" },
    { name: "신발", children: [{ name: "운동화" }, { name: "구두" }, { name: "부츠" }] },
    { name: "가방", children: [{ name: "백팩" }, { name: "토트" }, { name: "크로스백" }] },
    { name: "패션잡화", children: [{ name: "지갑" }, { name: "벨트" }, { name: "모자" }, { name: "양말" }] },
    { name: "시계/주얼리" }, { name: "언더웨어/홈웨어" },
  ] },
  { name: "뷰티", emoji: "💄", keyword: "cosmetics", children: [
    { name: "스킨케어", children: [{ name: "토너" }, { name: "에센스" }, { name: "크림" }] },
    { name: "메이크업", children: [{ name: "베이스" }, { name: "립" }, { name: "아이" }] },
    { name: "클렌징" },
    { name: "헤어/바디", children: [{ name: "샴푸" }, { name: "바디워시" }, { name: "헤어케어" }] },
    { name: "향수" }, { name: "네일" },
    { name: "뷰티소품/도구", children: [{ name: "브러시" }, { name: "퍼프" }, { name: "미용기기" }] },
  ] },
  { name: "스포츠", emoji: "⚽", keyword: "sports", children: [
    { name: "운동복/스포츠웨어" },
    { name: "운동화", children: [{ name: "러닝화" }, { name: "트레이닝화" }] },
    { name: "헬스/피트니스", children: [{ name: "덤벨" }, { name: "매트" }, { name: "홈트용품" }] },
    { name: "등산/캠핑/아웃도어" }, { name: "자전거" }, { name: "골프" }, { name: "수영/수상" },
    { name: "구기/라켓", children: [{ name: "축구" }, { name: "농구" }, { name: "배드민턴" }] },
  ] },
  { name: "완구/취미", emoji: "🧸", keyword: "toys", children: [
    { name: "완구", children: [{ name: "블록" }, { name: "인형" }, { name: "작동완구" }] },
    { name: "보드게임/퍼즐" }, { name: "프라모델/피규어" }, { name: "악기" },
    { name: "미술/공예", children: [{ name: "그림" }, { name: "DIY 키트" }] },
    { name: "수집/굿즈" }, { name: "드론/RC" },
  ] },
  { name: "반려동물", emoji: "🐶", keyword: "pet", children: [
    { name: "강아지 사료/간식" }, { name: "고양이 사료/간식" },
    { name: "위생용품", children: [{ name: "배변패드" }, { name: "모래" }] },
    { name: "미용/목욕" }, { name: "하우스/방석/이동장" }, { name: "장난감" }, { name: "건강/영양제" },
  ] },
  { name: "자동차", emoji: "🚗", keyword: "car", children: [
    { name: "차량용품/액세서리", children: [{ name: "방향제" }, { name: "매트" }, { name: "시트커버" }] },
    { name: "세차/관리용품" }, { name: "내비/블랙박스/전자기기" }, { name: "타이어/휠" },
    { name: "엔진오일/소모품" }, { name: "안전/비상용품" }, { name: "캠핑/차박용품" },
  ] },
  { name: "출산/유아동", emoji: "🍼", keyword: "baby", children: [
    { name: "기저귀/물티슈" }, { name: "분유/이유식" }, { name: "수유/이유용품" },
    { name: "유모차/카시트" }, { name: "아기침구/가구" }, { name: "유아의류/신발" },
    { name: "목욕/스킨케어" }, { name: "유아완구/교구" },
  ] },
  { name: "가구/인테리어", emoji: "🛋️", keyword: "furniture", children: [
    { name: "침실가구", children: [{ name: "침대" }, { name: "매트리스" }, { name: "화장대" }] },
    { name: "거실가구", children: [{ name: "소파" }, { name: "테이블" }, { name: "TV장" }] },
    { name: "수납가구", children: [{ name: "서랍장" }, { name: "책장" }, { name: "옷장" }] },
    { name: "주방/식탁가구" },
    { name: "침구/패브릭", children: [{ name: "이불" }, { name: "커튼" }, { name: "러그" }] },
    { name: "조명" },
    { name: "인테리어소품", children: [{ name: "액자" }, { name: "조화" }, { name: "캔들" }] },
    { name: "홈데코/DIY" },
  ] },
  { name: "문구/오피스", emoji: "✏️", keyword: "stationery", children: [
    { name: "필기구" }, { name: "노트/다이어리" },
    { name: "사무용품", children: [{ name: "파일" }, { name: "테이프" }, { name: "가위" }] },
    { name: "사무기기/소모품", children: [{ name: "프린터 토너" }, { name: "라벨" }] },
    { name: "데스크용품/책상정리" }, { name: "화방/미술용품" }, { name: "학용품" },
  ] },
  { name: "헬스/건강", emoji: "💊", keyword: "health", children: [
    { name: "건강기능식품", children: [{ name: "비타민" }, { name: "유산균" }, { name: "오메가3" }] },
    { name: "홍삼/녹용" }, { name: "다이어트/이너뷰티" },
    { name: "의료용품", children: [{ name: "밴드" }, { name: "마스크" }, { name: "체온계" }] },
    { name: "건강측정기기", children: [{ name: "혈압계" }, { name: "혈당계" }] },
    { name: "안마/찜질" }, { name: "시니어/실버용품" },
  ] },
];

// ── 트리/평면 빌드 (id·parentId·depth 부여, keyword 상속) ──
const flat: Category[] = [];
let cid = 0;

function build(raw: Raw[], parentId: number | null, depth: number, parentKeyword?: string): Category[] {
  return raw.map((r) => {
    const id = ++cid;
    const keyword = r.keyword ?? parentKeyword;
    const node: Category = { id, parentId, depth: depth as 1 | 2 | 3, name: r.name, emoji: r.emoji, keyword };
    flat.push(node);
    if (r.children?.length) node.children = build(r.children, id, depth + 1, keyword);
    return node;
  });
}

export const categoryTree = build(RAW, null, 1);
export const flatCategories = flat;

const byId = new Map<number, Category>(flat.map((c) => [c.id, c]));

// 리프에서 부모로 거슬러 올라가며, map에 이름이 일치하는 첫 값을 반환.
// 매핑을 대/중/소 어느 단계에 걸어도 자식이 상속받게 해줌.
export function ancestorValue<T>(categoryId: number | undefined, map: Record<string, T>): T | undefined {
  let cur = categoryId != null ? byId.get(categoryId) : undefined;
  while (cur) {
    const v = map[cur.name];
    if (v !== undefined) return v;
    cur = cur.parentId != null ? byId.get(cur.parentId) : undefined;
  }
  return undefined;
}

// 특정 카테고리의 자기 자신 + 모든 하위 id (상품 필터용)
export function collectDescendantIds(rootId: number): Set<number> {
  const set = new Set<number>([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of flat) {
      if (c.parentId != null && set.has(c.parentId) && !set.has(c.id)) {
        set.add(c.id);
        grew = true;
      }
    }
  }
  return set;
}

// ── 목 상품 생성: 리프(소분류 또는 소분류 없는 중분류)마다 몇 개씩 ──
const BRANDS = ["코팡", "데일리", "어반", "무드", "베이직", "프리모", "네이처", "스마트", "리브", "오브제"];
const ADJ = ["베스트", "신상", "인기", "오늘의", "프리미엄", "실속", "트렌디", "클래식"];
const PER_LEAF = 6;

// id 기반 간단 의사난수 (새로고침해도 값 고정)
const hash = (n: number, mod: number) => (n * 2654435761) % mod;

// 한글이 안 깨지는 라벨 플레이스홀더 (인라인 SVG data URI).
// DummyJSON 진짜 이미지가 없는 카테고리의 기본값 + 네트워크 실패 시 fallback.
const BG = ["#EAEEFF", "#FFF0F0", "#EAF7EF", "#FFF6E5", "#F3EEFF", "#E8F6FB"];
const FG = ["#3B5BFF", "#E03131", "#2F9E44", "#F08C00", "#7048E8", "#1098AD"];
export function labelImage(text: string, seed: number): string {
  const i = seed % BG.length;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'>` +
    `<rect width='300' height='300' fill='${BG[i]}'/>` +
    `<text x='150' y='156' font-family='-apple-system,BlinkMacSystemFont,sans-serif' ` +
    `font-size='20' font-weight='700' fill='${FG[i]}' text-anchor='middle'>${text}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// 정적 큐레이션 이미지: 카테고리명 → public/images/<folder>
// 5개 대분류(전체 적용) + DummyJSON 미커버 대형가전 4종(소분류 적용).
const STATIC_BY_NAME: Record<string, string> = {
  "완구/취미": "toys",
  반려동물: "pet",
  "출산/유아동": "baby",
  "문구/오피스": "stationery",
  "헬스/건강": "health",
  // 대형가전 (DummyJSON 에 없음) — 소분류 단위 큐레이션
  TV: "tv",
  냉장고: "fridge",
  세탁기: "washer",
  에어컨: "aircon",
  // 그 외 가전 (Unsplash 큐레이션)
  전자레인지: "microwave",
  에어프라이어: "airfryer",
  밥솥: "ricecooker",
  커피머신: "coffeemaker",
  선풍기: "fan",
  히터: "heater",
  제습기: "dehumidifier",
  가습기: "humidifier",
  청소기: "vacuum",
  다리미: "iron",
  안마기: "massager",
  이어폰: "earphones",
  스피커: "speaker",
  카메라: "camera",
  "게임/콘솔": "console",
  // 생활용품 (주방은 DummyJSON)
  욕실: "bathroom",
  청소: "cleaning",
  "세탁/세제": "detergent",
  "수납/정리": "storage",
  생활잡화: "goods",
  // 패션잡화 / 언더웨어
  지갑: "wallet",
  벨트: "belt",
  모자: "hat",
  양말: "socks",
  "언더웨어/홈웨어": "underwear",
  // 뷰티 (헤어·바디 / 네일 / 뷰티소품)
  샴푸: "shampoo",
  바디워시: "bodywash",
  헤어케어: "haircare",
  네일: "nail",
  브러시: "makeupbrush",
  퍼프: "puff",
  미용기기: "beautydevice",
  // 자동차 — DummyJSON은 '완성차'라 부적합 → 용품 사진으로 큐레이션
  "차량용품/액세서리": "caraccessory",
  "세차/관리용품": "carwash",
  "내비/블랙박스/전자기기": "cardashcam",
  "타이어/휠": "tire",
  "엔진오일/소모품": "engineoil",
  "안전/비상용품": "caremergency",
  "캠핑/차박용품": "carcamping",
  // 스포츠 — DummyJSON은 '공·라켓'뿐 → 의류/장비 큐레이션 (골프·구기는 DummyJSON 유지)
  "운동복/스포츠웨어": "sportswear",
  운동화: "runningshoes",
  "등산/캠핑/아웃도어": "outdoor",
  자전거: "bicycle",
  "수영/수상": "swimming",
  // 패션 신발 — DummyJSON은 운동화뿐 → 구두·부츠 큐레이션
  구두: "dressshoes",
  부츠: "boots",
  // 뷰티 — DummyJSON skin-care는 바디워시 → 얼굴 스킨케어 큐레이션
  스킨케어: "skincare",
  클렌징: "cleanser",
  // 식품 — groceries 뒤섞임 → 소분류별 정확히
  신선식품: "fresh",
  가공식품: "processed",
  간편식: "instant",
  음료: "beverage",
  "베이커리/간식": "bakery",
  건강식품: "healthfood",
  // 컴퓨터 — laptops 일색 → 데스크탑/모니터/주변기기 (노트북은 DummyJSON 유지)
  PC: "desktop",
  모니터: "monitor",
  주변기기: "peripheral",
  // 가구 — furniture는 침대·소파 → 수납가구 별도
  수납가구: "storagefurniture",
  // 스포츠 헬스 / 가구 침구 (한도로 미뤘던 것)
  "헬스/피트니스": "fitness",
  "침구/패브릭": "bedding",
};

function staticPool(folder: string): string[] {
  const n = IMAGE_COUNTS[folder] ?? 0;
  return Array.from({ length: n }, (_, i) => `/images/${folder}/${i + 1}.jpg`);
}

function genProducts(): Product[] {
  const list: Product[] = [];
  let pid = 0;
  for (const cat of flat) {
    const isLeaf = !cat.children?.length;
    if (!isLeaf || cat.depth < 2) continue; // 리프 + 중분류 이하만
    const folder = ancestorValue(cat.id, STATIC_BY_NAME);
    const pool = folder ? staticPool(folder) : undefined;
    for (let i = 0; i < PER_LEAF; i++) {
      const id = ++pid;
      list.push({
        id,
        categoryId: cat.id,
        brand: BRANDS[hash(id, BRANDS.length)],
        name: `${ADJ[hash(id + 3, ADJ.length)]} ${cat.name} ${i + 1}호`,
        price: 4900 + hash(id, 90) * 1000, // 4,900 ~ 93,900
        discountRate: [0, 0, 10, 15, 20, 30, 40, 50][hash(id, 8)],
        // 큐레이션 카테고리 → 로컬 실사진 / 그 외 → 라벨(이후 DummyJSON 실사진으로 교체)
        imageUrl: pool && pool.length ? pool[id % pool.length] : labelImage(cat.name, id),
      });
    }
  }
  return list;
}

export const mockProducts = genProducts();
