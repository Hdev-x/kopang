// 하이브리드 이미지: DummyJSON(무료 진짜 상품 API)에서 카테고리별 실사진을 받아
// 우리 상품 이미지에 입힌다. 매핑은 "소분류 단위"라 폰이 TV로 새지 않음.
// DummyJSON·큐레이션 둘 다 없는 소분류는 라벨 플레이스홀더로 남는다.
import type { Product } from "../types/product";
import { ancestorValue } from "./categoryData";

// 우리 카테고리명 → DummyJSON 슬러그(여러 개 가능).
// 동질적인 대분류는 대분류명에, 사진이 갈리는 곳(가전/패션/뷰티/가구)은 중·소분류명에 건다.
const DUMMY_BY_NAME: Record<string, string[]> = {
  // 동질적 대분류
  식품: ["groceries"],
  스포츠: ["sports-accessories"], // 골프·구기/라켓만 적용(나머지 스포츠 소분류는 큐레이션)
  주방: ["kitchen-accessories"], // 생활용품 > 주방
  // 가전: 컴퓨터/모바일만 (TV·냉장고 등 대형가전은 큐레이션)
  "컴퓨터/노트북": ["laptops"],
  스마트폰: ["smartphones"],
  태블릿: ["tablets"],
  액세서리: ["mobile-accessories"],
  // 패션
  여성의류: ["womens-dresses", "tops"],
  남성의류: ["mens-shirts"],
  신발: ["mens-shoes", "womens-shoes"],
  가방: ["womens-bags"],
  "시계/주얼리": ["mens-watches", "womens-watches", "womens-jewellery"],
  // 뷰티
  스킨케어: ["skin-care"],
  클렌징: ["skin-care"],
  메이크업: ["beauty"],
  향수: ["fragrances"],
  // 가구/인테리어
  침실가구: ["furniture"],
  거실가구: ["furniture"],
  수납가구: ["furniture"],
  "주방/식탁가구": ["furniture"],
  인테리어소품: ["home-decoration"],
  "홈데코/DIY": ["home-decoration"],
  조명: ["home-decoration"],
  "침구/패브릭": ["home-decoration"],
};

type Dummy = { category: string; thumbnail: string };

let enrichPromise: Promise<void> | null = null;

// 한 번만 실행되도록 메모이즈. 실패해도 throw 안 하고 라벨/큐레이션 유지.
export function ensureRealImages(products: Product[]): Promise<void> {
  if (!enrichPromise) {
    enrichPromise = enrich(products).catch((e) => {
      console.warn("DummyJSON 이미지 로드 실패 → 라벨 유지:", e);
    });
  }
  return enrichPromise;
}

async function enrich(products: Product[]) {
  const res = await fetch("https://dummyjson.com/products?limit=200&select=category,thumbnail");
  const json = (await res.json()) as { products: Dummy[] };

  // DummyJSON 카테고리(slug)별 썸네일 풀
  const bySlug: Record<string, string[]> = {};
  for (const p of json.products) (bySlug[p.category] ??= []).push(p.thumbnail);

  // 각 상품을 소분류 매핑으로 실사진 교체 (id로 분산)
  for (const prod of products) {
    // 큐레이션(로컬 정적 이미지)이 이미 붙은 상품은 건드리지 않음 — 라벨만 교체.
    if (!prod.imageUrl.startsWith("data:")) continue;
    const slugs = ancestorValue(prod.categoryId, DUMMY_BY_NAME);
    if (!slugs) continue; // 라벨 카테고리 → 그대로
    const pool = slugs.flatMap((s) => bySlug[s] ?? []);
    if (pool.length) prod.imageUrl = pool[prod.id % pool.length];
  }
}
