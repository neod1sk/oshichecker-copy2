"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from "react";
import {
  DiagnosisState,
  DiagnosisAction,
  CandidateMember,
  BattleRecord,
  BATTLE_ROUNDS,
} from "@/lib/types";
import { recordBattleResult } from "@/lib/battleLogic";
import { calculateFinalRanking } from "@/lib/scoring";

const defaultPreferForLevel = (): boolean => false;

// ===========================================
// SessionStorage キー
// ===========================================

const STORAGE_KEY = "oshichecker_diagnosis_state";

// ===========================================
// 初期状態
// ===========================================

const initialState: DiagnosisState = {
  // Stage1: アンケート
  currentQuestionIndex: 0,
  surveyScores: {},
  koreanLevel: "none",
  preferJapaneseSupport: defaultPreferForLevel(),

  // Stage2: 二択バトル
  candidates: [],
  battleRecords: [],
  currentBattleRound: 0,

  // 結果
  finalRanking: [],
};

// ===========================================
// SessionStorage ユーティリティ
// ===========================================

function loadStateFromStorage(): DiagnosisState {
  if (typeof window === "undefined") return initialState;
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as DiagnosisState;
      // 基本的な検証
      if (typeof parsed.currentQuestionIndex === "number") {
        return {
          ...initialState,
          ...parsed,
          koreanLevel: parsed.koreanLevel ?? "none",
          preferJapaneseSupport:
            parsed.preferJapaneseSupport ?? defaultPreferForLevel(),
        };
      }
    }
  } catch (e) {
    console.error("Failed to load state from sessionStorage:", e);
  }
  return initialState;
}

function saveStateToStorage(state: DiagnosisState): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state to sessionStorage:", e);
  }
}

function clearStorageState(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear sessionStorage:", e);
  }
}

// ===========================================
// Reducer
// ===========================================

function diagnosisReducer(
  state: DiagnosisState,
  action: DiagnosisAction
): DiagnosisState {
  let newState: DiagnosisState;

  switch (action.type) {
    case "ANSWER_QUESTION": {
      const { scoreKey, scoreValue } = action;
      newState = {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
        surveyScores: {
          ...state.surveyScores,
          [scoreKey]: (state.surveyScores[scoreKey] || 0) + scoreValue,
        },
      };
      break;
    }

    case "SET_CANDIDATES": {
      newState = {
        ...state,
        candidates: action.candidates,
        currentBattleRound: 0,
        battleRecords: [],
      };
      break;
    }

    case "RECORD_BATTLE": {
      const { record } = action;
      const { updatedCandidates } = recordBattleResult(
        state.candidates,
        record.round,
        record.memberA,
        record.memberB,
        record.winnerId
      );

      const newBattleRecords = [...state.battleRecords, record];
      const newRound = state.currentBattleRound + 1;

      // バトル完了時に最終ランキングを計算
      let finalRanking = state.finalRanking;
      if (newRound >= BATTLE_ROUNDS) {
        finalRanking = calculateFinalRanking(
          updatedCandidates,
          newBattleRecords,
          state.koreanLevel ?? "none",
          state.preferJapaneseSupport
        );
      }

      newState = {
        ...state,
        candidates: updatedCandidates,
        battleRecords: newBattleRecords,
        currentBattleRound: newRound,
        finalRanking,
      };
      break;
    }

    case "SET_KOREAN_LEVEL": {
      newState = {
        ...state,
        koreanLevel: action.level,
      };
      break;
    }

    case "SET_PREFER_JP_SUPPORT": {
      newState = {
        ...state,
        preferJapaneseSupport: action.value,
      };
      break;
    }

    case "ANSWER_MULTI": {
      newState = {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
        surveyScores: Object.entries(action.scores).reduce((acc, [key, value]) => {
          acc[key] = (acc[key] || 0) + value;
          return acc;
        }, { ...state.surveyScores }),
      };
      break;
    }

    case "ANSWER_KOREAN_LEVEL": {
      newState = {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
        koreanLevel: action.level,
      };
      break;
    }

    case "SET_FINAL_RANKING": {
      newState = {
        ...state,
        finalRanking: action.ranking,
      };
      break;
    }

    case "RESET": {
      clearStorageState();
      return initialState;
    }

    default:
      return state;
  }

  // 状態をsessionStorageに保存
  saveStateToStorage(newState);
  return newState;
}

// ===========================================
// 初期化関数（sessionStorageから復元）
// ===========================================

function initializeState(): DiagnosisState {
  return loadStateFromStorage();
}

// ===========================================
// Context
// ===========================================

interface DiagnosisContextType {
  state: DiagnosisState;
  // アクション関数
  answerQuestion: (scoreKey: string, scoreValue: number) => void;
  setKoreanLevel: (level: DiagnosisState["koreanLevel"]) => void;
  setPreferJapaneseSupport: (value: boolean) => void;
  answerMulti: (scores: Record<string, number>) => void;
  answerKoreanLevel: (level: DiagnosisState["koreanLevel"]) => void;
  setCandidates: (candidates: CandidateMember[]) => void;
  recordBattle: (
    memberAId: string,
    memberBId: string,
    winnerId: string
  ) => void;
  reset: () => void;
  // 便利なゲッター
  isSurveyComplete: (totalQuestions: number) => boolean;
  isBattleComplete: boolean;
  currentProgress: {
    survey: { current: number; total: number };
    battle: { current: number; total: number };
  };
}

const DiagnosisContext = createContext<DiagnosisContextType | null>(null);

// ===========================================
// Provider
// ===========================================

interface DiagnosisProviderProps {
  children: ReactNode;
  totalQuestions?: number;
}

export function DiagnosisProvider({
  children,
  totalQuestions = 6,
}: DiagnosisProviderProps) {
  // useReducerの第3引数で初期化関数を指定
  const [state, dispatch] = useReducer(
    diagnosisReducer,
    initialState,
    initializeState
  );

  // アクション関数
  const answerQuestion = useCallback((scoreKey: string, scoreValue: number) => {
    dispatch({ type: "ANSWER_QUESTION", scoreKey, scoreValue });
  }, []);

  const setKoreanLevel = useCallback((level: DiagnosisState["koreanLevel"]) => {
    dispatch({ type: "SET_KOREAN_LEVEL", level });
  }, []);

  const setPreferJapaneseSupport = useCallback((value: boolean) => {
    dispatch({ type: "SET_PREFER_JP_SUPPORT", value });
  }, []);

  const answerMulti = useCallback((scores: Record<string, number>) => {
    dispatch({ type: "ANSWER_MULTI", scores });
  }, []);

  const answerKoreanLevel = useCallback((level: DiagnosisState["koreanLevel"]) => {
    dispatch({ type: "ANSWER_KOREAN_LEVEL", level });
  }, []);

  const setCandidates = useCallback((candidates: CandidateMember[]) => {
    dispatch({ type: "SET_CANDIDATES", candidates });
  }, []);

  const recordBattle = useCallback(
    (memberAId: string, memberBId: string, winnerId: string) => {
      const record: BattleRecord = {
        round: state.currentBattleRound + 1,
        memberA: memberAId,
        memberB: memberBId,
        winnerId,
      };
      dispatch({ type: "RECORD_BATTLE", record });
    },
    [state.currentBattleRound]
  );

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  // ゲッター
  const isSurveyComplete = useCallback(
    (total: number) => state.currentQuestionIndex >= total,
    [state.currentQuestionIndex]
  );

  const isBattleComplete = state.currentBattleRound >= BATTLE_ROUNDS;

  const currentProgress = {
    survey: {
      current: state.currentQuestionIndex,
      total: totalQuestions,
    },
    battle: {
      current: state.currentBattleRound,
      total: BATTLE_ROUNDS,
    },
  };

  const value: DiagnosisContextType = {
    state,
    answerQuestion,
    setKoreanLevel,
    setPreferJapaneseSupport,
    answerMulti,
    answerKoreanLevel,
    setCandidates,
    recordBattle,
    reset,
    isSurveyComplete,
    isBattleComplete,
    currentProgress,
  };

  return (
    <DiagnosisContext.Provider value={value}>
      {children}
    </DiagnosisContext.Provider>
  );
}

// ===========================================
// Hook
// ===========================================

export function useDiagnosis(): DiagnosisContextType {
  const context = useContext(DiagnosisContext);
  if (!context) {
    throw new Error("useDiagnosis must be used within a DiagnosisProvider");
  }
  return context;
}

// デフォルトエクスポート
export default DiagnosisProvider;
