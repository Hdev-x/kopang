import type { CSSProperties } from "react";
import styles from "./Skeleton.module.css";


/**
 * 로딩 자리표시자.
 *
 * 쓰는 이유: 데이터가 오기 전과 온 뒤의 레이아웃이 같아야 화면이 흔들리지 않는다.
 * 그래서 "틀은 항상 렌더링하고, 값 자리만 이걸로 바꾼다"는 규칙으로 쓴다.
 *
 *   {loading ? <Skeleton w={80} /> : <b>{value}</b>}
 *
 * 반대로 페이지 전체를 `if (loading) return <p>불러오는 중</p>` 로 갈아끼우면
 * 틀 자체가 사라져서 데이터가 들어오는 순간 화면이 튄다.
 */
export function Skeleton({
  w,
  h = 14,
  r,
  circle,
  className,
  style,
}: {
  /** 너비 — 숫자는 px, 문자열은 그대로(예: "60%") */
  w?: number | string;
  /** 높이 — 기본 14px (본문 한 줄 높이) */
  h?: number | string;
  /** 모서리 반경 */
  r?: number;
  /** 원형(아바타·아이콘 자리) */
  circle?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={`${styles.sk} ${circle ? styles.circle : ""} ${className ?? ""}`}
      style={{
        width: typeof w === "number" ? `${w}px` : w,
        height: typeof h === "number" ? `${h}px` : h,
        borderRadius: circle ? "50%" : r,
        ...style,
      }}
      aria-hidden
    />
  );
}

/**
 * 여러 줄짜리 텍스트 자리. 마지막 줄은 짧게 해서 문단처럼 보이게 한다.
 */
export function SkeletonText({ lines = 3, gap = 8 }: { lines?: number; gap?: number }) {
  return (
    <span style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} w={i === lines - 1 ? "62%" : "100%"} h={13} />
      ))}
    </span>
  );
}

/**
 * 이미지·썸네일 자리. 정사각 비율을 유지해 이미지가 들어와도 밀리지 않는다.
 */
export function SkeletonThumb({ ratio = 1, r = 8 }: { ratio?: number; r?: number }) {
  return <span className={styles.sk} style={{ width: "100%", aspectRatio: String(ratio), borderRadius: r }} aria-hidden />;
}

/**
 * 표 본문 자리. 열 수와 행 수를 실제와 같게 주면 헤더·행 높이가 그대로 유지된다.
 * widths 로 열마다 다른 너비를 주면 실제 데이터처럼 보인다.
 */
export function SkeletonRows({
  rows = 8,
  cols = 4,
  widths,
}: {
  rows?: number;
  cols?: number;
  /** 열별 자리표시자 너비 (예: ["70%", "45%", "55%", "40%"]) */
  widths?: string[];
}) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }, (_, c) => (
            <td key={c}>
              <Skeleton w={widths?.[c] ?? "60%"} h={13} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
