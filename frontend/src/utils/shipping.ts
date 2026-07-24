/**
 * 배송비 계산 공통 함수
 * - 멤버십 회원: 0원 (무료배송)
 * - 제주도 및 도서산간 지역 (우편번호/행정구역 지명 기준): 4,500원
 * - 일반 지역: 3,000원
 */

export type ShippingFeeResult = {
  fee: number;
  isRemote: boolean;
  isJeju: boolean;
  label: string;
  badge?: string;
};

export function calculateShippingFee(params: {
  isMembership?: boolean;
  zipcode?: string;
  address?: string;
}): ShippingFeeResult {
  if (params.isMembership) {
    return {
      fee: 0,
      isRemote: false,
      isJeju: false,
      label: "무료배송",
      badge: "Kopang 멤버십 혜택 👑",
    };
  }

  const cleanZip = params.zipcode ? parseInt(params.zipcode.replace(/\D/g, ""), 10) : 0;
  const cleanAddr = params.address || "";

  // 1. 제주특별자치도 판정 (우편번호 63000~63644 또는 제주 관련 지명)
  const isJeju =
    (cleanZip >= 63000 && cleanZip <= 63644) ||
    /제주|서귀포|우도면|추자면/.test(cleanAddr);

  // 2. 도서산간 우편번호 대역 판정
  // 옹진군 (23100~23136), 울릉군 (40200~40240), 신안군 (58700~58999)
  const isIslandZip =
    (cleanZip >= 23100 && cleanZip <= 23136) ||
    (cleanZip >= 40200 && cleanZip <= 40240) ||
    (cleanZip >= 58700 && cleanZip <= 58999);

  // 3. 도서산간 섬/군 지명 키워드 판정
  const isIslandKeyword = /옹진|울릉|독도|신안군|완도군|진도군|백령|대청|연평|덕적|자월|거문도|청산도|보길도|흑산도|욕지|사량|오천면/.test(
    cleanAddr
  );

  const isRemote = isJeju || isIslandZip || isIslandKeyword;

  if (isRemote) {
    return {
      fee: 4500,
      isRemote: true,
      isJeju,
      label: "4,500원",
      badge: isJeju ? "제주지역 추가배송비" : "도서산간 추가배송비",
    };
  }

  return {
    fee: 3000,
    isRemote: false,
    isJeju: false,
    label: "3,000원",
  };
}
