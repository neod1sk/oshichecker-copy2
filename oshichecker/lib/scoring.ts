import {
  Member,
  CandidateMember,
  BattleRecord,
  CANDIDATE_COUNT,
  RESULT_COUNT,
  JpSupportLevel,
  KoreanLevel,
} from "./types";

const LANGUAGE_BONUS_TABLE: Record<
  KoreanLevel,
  Record<JpSupportLevel, number>
> = {
  none: { ok: 1, some: 0.5, unknown: 0, no: 0 },
  beginner: { ok: 1, some: 0.5, unknown: 0, no: 0 },
  intermediate: { ok: 0.5, some: 0.3, unknown: 0, no: 0 },
  advanced: { ok: 0, some: 0, unknown: 0, no: 0 },
  native: { ok: 0, some: 0, unknown: 0, no: 0 },
};

export function getLanguageBonus(
  koreanLevel: KoreanLevel,
  jpSupport: JpSupportLevel
): number {
  const levelTable = LANGUAGE_BONUS_TABLE[koreanLevel] ?? LANGUAGE_BONUS_TABLE.none;
  return levelTable[jpSupport] ?? 0;
}

/**
 * アンケートスコアに基づいてメンバーをスコアリング
 * @param members 全メンバーリスト
 * @param surveyScores ユーザーのアンケート回答スコア（属性ごと）
 * @returns スコア順にソートされた候補メンバー
 */
export function scoreMembersBySurvey(
  members: Member[],
  surveyScores: Record<string, number>
): CandidateMember[] {
  const scored = members.map((member) => {
    let surveyScore = 0;
    for (const [key, userScore] of Object.entries(surveyScores)) {
      // 通常属性 + artist系（covers）を同様に加点する
      const memberScore = (member.scores[key] ?? member.covers?.[key]) || 0;
      surveyScore += memberScore * userScore;
    }

    return {
      member,
      surveyScore,
      appearanceCount: 0,
      winCount: 0,
      preferenceScore: 0,
      languageBonus: 0,
      finalScore: 0,
    };
  });

  scored.sort((a, b) => b.surveyScore - a.surveyScore);

  return scored;
}

/**
 * 上位N名の候補を取得
 */
export function getTopCandidates(
  scoredMembers: CandidateMember[],
  count: number = CANDIDATE_COUNT
): CandidateMember[] {
  return scoredMembers.slice(0, count);
}

/**
 * 最終ランキングを計算（ハイブリッド言語ボーナス込み）
 *
 * タイブレーク順序:
 * 1) finalScore（preference + languageBonus）
 * 2) winCount
 * 3) surveyScore
 * 4) 直接対決
 * 5) memberId 昇順
 */
export function calculateFinalRanking(
  candidates: CandidateMember[],
  battleRecords: BattleRecord[],
  userKoreanLevel: KoreanLevel = "none",
  preferJapaneseSupport: boolean = true
): CandidateMember[] {
  const withScores = candidates.map((candidate) => {
    const preferenceScore = candidate.surveyScore + candidate.winCount;
    const languageBonus = preferJapaneseSupport
      ? getLanguageBonus(userKoreanLevel, candidate.member.jpSupport)
      : 0;
    const finalScore = preferenceScore + languageBonus;

    return {
      ...candidate,
      preferenceScore,
      languageBonus,
      finalScore,
    };
  });

  const sorted = withScores.sort((a, b) => {
    const aFinal = a.finalScore ?? 0;
    const bFinal = b.finalScore ?? 0;
    if (bFinal !== aFinal) {
      return bFinal - aFinal;
    }

    if (b.winCount !== a.winCount) {
      return b.winCount - a.winCount;
    }

    if (b.surveyScore !== a.surveyScore) {
      return b.surveyScore - a.surveyScore;
    }

    const directBattle = battleRecords.find(
      (record) =>
        (record.memberA === a.member.id && record.memberB === b.member.id) ||
        (record.memberA === b.member.id && record.memberB === a.member.id)
    );
    if (directBattle) {
      if (directBattle.winnerId === a.member.id) return -1;
      if (directBattle.winnerId === b.member.id) return 1;
    }

    return a.member.id.localeCompare(b.member.id);
  });

  return sorted.slice(0, RESULT_COUNT);
}
