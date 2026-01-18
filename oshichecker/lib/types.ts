// ===========================================
// 基本データ型
// ===========================================

/** グループ情報 */
export interface Group {
  id: string;
  name: string;
  nameKo?: string;
  nameEn?: string;
  color: string; // テーマカラー（例: "#FF5A5F"）
}

export type JpSupportLevel = "ok" | "some" | "unknown" | "no";
export type KoreanLevel = "native" | "advanced" | "intermediate" | "beginner" | "none";

/** メンバー情報 */
export interface Member {
  id: string;
  name: string;
  nameKo?: string;
  nameEn?: string;
  groupId: string;
  photoUrl: string; // 外部URL or ローカルパス
  tags: string[]; // 属性タグ（例: ["cute", "energetic"]）
  scores: Record<string, number>; // 属性スコア（例: { cute: 5, cool: 2 }）
  jpSupport: JpSupportLevel; // 日本語対応状況
  covers?: Record<string, number>; // 日本地下アイドル由来のカバー情報（キーは後で拡張）
}

/** アンケート質問 */
export interface Question {
  id: string;
  text: string;
  textKo?: string;
  textEn?: string;
  type?: "single" | "multi"; // デフォルト: single
  minSelect?: number;
  maxSelect?: number;
  options: QuestionOption[];
}

/** 質問の選択肢 */
export interface QuestionOption {
  id?: string;
  text: string;
  textKo?: string;
  textEn?: string;
  scoreKey: string; // 対応する属性キー（例: "cute", "cool"）
  scoreValue?: number; // 加算スコア（デフォルト: 1）
  scores?: Record<string, number>; // 複数キー加点が必要な場合に使用
}

// ===========================================
// 診断状態管理用の型
// ===========================================

/** 対戦履歴 */
export interface BattleRecord {
  round: number; // 何回目の対戦か（1〜10）
  memberA: string; // メンバーID
  memberB: string; // メンバーID
  winnerId: string; // 勝者のメンバーID
}

/** 候補メンバー（バトル用） */
export interface CandidateMember {
  member: Member;
  surveyScore: number; // アンケートで獲得したスコア
  appearanceCount: number; // バトルでの登場回数
  winCount: number; // バトルでの勝利数
  q2ArtistScore?: number; // Q2（カバー原曲）スコア
  q2UsedTop3?: { key: string; value: number }[]; // Q2で使われた上位3件
  preferenceScore?: number; // アンケ+バトル+カバーの合算
  languageBonus?: number; // 言語ボーナス
  finalScore?: number; // preferenceScore + languageBonus
}

/** 診断全体の状態 */
export interface DiagnosisState {
  // Stage1: アンケート
  currentQuestionIndex: number;
  surveyScores: Record<string, number>; // 属性ごとのスコア合計
  koreanLevel: KoreanLevel; // ユーザーの韓国語レベル
  preferJapaneseSupport: boolean; // 日本語対応優先トグル

  // Stage2: 二択バトル
  candidates: CandidateMember[]; // 上位8名の候補
  battleRecords: BattleRecord[]; // 対戦履歴
  currentBattleRound: number; // 現在のバトル回数（1〜10）

  // 結果
  finalRanking: CandidateMember[]; // 最終ランキング（上位3名）
}

// ===========================================
// アクション型（useReducer用）
// ===========================================

export type DiagnosisAction =
  | { type: "ANSWER_QUESTION"; scoreKey: string; scoreValue: number }
  | { type: "SET_KOREAN_LEVEL"; level: KoreanLevel }
  | { type: "SET_PREFER_JP_SUPPORT"; value: boolean }
  | { type: "ANSWER_MULTI"; scores: Record<string, number> }
  | { type: "ANSWER_KOREAN_LEVEL"; level: KoreanLevel }
  | { type: "SET_CANDIDATES"; candidates: CandidateMember[] }
  | { type: "RECORD_BATTLE"; record: BattleRecord }
  | { type: "SET_FINAL_RANKING"; ranking: CandidateMember[] }
  | { type: "RESET" };

// ===========================================
// 定数
// ===========================================

export const BATTLE_ROUNDS = 10; // バトル回数
export const CANDIDATE_COUNT = 8; // 候補メンバー数
export const RESULT_COUNT = 3; // 結果表示数
