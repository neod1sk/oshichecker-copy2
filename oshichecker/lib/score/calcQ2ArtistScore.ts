export function calcQ2ArtistScore(
  memberCovers: Record<string, number> | undefined,
  surveyScores: Record<string, number>
) {
  const covers = memberCovers ?? {};

  // ユーザーが選択した「artist_」キーだけを見る
  const selectedKeys = Object.keys(surveyScores).filter((k) => k.startsWith("artist_"));

  // メンバー側のカバー数を取得し、0以下は除外
  const pairs = selectedKeys
    .map((key) => ({ key, value: Math.min(5, covers[key] ?? 0) })) // 念のため上限5
    .filter((p) => p.value > 0)
    .sort((a, b) => b.value - a.value);

  // 上位3件を合算
  const usedTop3 = pairs.slice(0, 3);
  const q2ArtistScore = usedTop3.reduce((sum, p) => sum + p.value, 0);

  return { q2ArtistScore, usedTop3 };
}
