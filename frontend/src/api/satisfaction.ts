import { client } from "./client";

// 만족도 제출 (POST /api/satisfaction). context 기본 ORDER(주문완료)
export async function submitSatisfaction(score: number, context: string = "ORDER") {
  await client.post("/satisfaction", { score, context });
}
