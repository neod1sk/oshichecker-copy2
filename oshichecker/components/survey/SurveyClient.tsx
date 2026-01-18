"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDiagnosis } from "@/context/DiagnosisContext";
import { Question, QuestionOption, Member, KoreanLevel } from "@/lib/types";
import { Locale } from "@/i18n.config";
import { scoreMembersBySurvey, getTopCandidates } from "@/lib/scoring";
import { CANDIDATE_COUNT } from "@/lib/types";
import ProgressBar from "@/components/ui/ProgressBar";
import QuestionCard from "@/components/ui/QuestionCard";

interface SurveyClientProps {
  questions: Question[];
  members: Member[];
  locale: Locale;
  dict: {
    loading: string;
    calculating: string;
  };
}

export default function SurveyClient({
  questions,
  members,
  locale,
  dict,
}: SurveyClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    state,
    answerQuestion,
    answerMulti,
    setCandidates,
    reset,
    setKoreanLevel,
    setPreferJapaneseSupport,
  } = useDiagnosis();
  const [isCalculating, setIsCalculating] = useState(false);
  const hasInitialized = useRef(false);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);

  const koreanLevelOptions: { value: KoreanLevel; label: string }[] = [
    { value: "none", label: "ほぼ話せない" },
    { value: "beginner", label: "超初級" },
    { value: "intermediate", label: "中級" },
    { value: "advanced", label: "上級" },
    { value: "native", label: "ネイティブ" },
  ];

  const recommendedPrefer =
    state.koreanLevel === "none" ||
    state.koreanLevel === "beginner" ||
    state.koreanLevel === "intermediate";

  // start=1 パラメータがある場合、または途中状態でない場合はリセット
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const isNewStart = searchParams.get("start") === "1";
    
    // 新規スタートの場合はリセット
    if (isNewStart) {
      reset();
      // URLからパラメータを削除
      router.replace(`/${locale}/survey`, { scroll: false });
    }
  }, [searchParams, reset, router, locale]);

  const currentQuestion = questions[state.currentQuestionIndex];
  const isMulti = currentQuestion?.type === "multi";
  const minSelect = currentQuestion?.minSelect ?? 1;
  const maxSelect = currentQuestion?.maxSelect ?? (currentQuestion?.options.length ?? 1);
  const isComplete = state.currentQuestionIndex >= questions.length;

  // 質問に回答
  const handleAnswer = (option: QuestionOption) => {
    if (isMulti) return;
    const scoreValue = option.scoreValue ?? 1;
    answerQuestion(option.scoreKey, scoreValue);
  };

  // 複数選択のトグル
  const handleToggleOption = (option: QuestionOption, idx: number) => {
    const optionId = option.id ?? option.scoreKey ?? String(idx);
    setSelectedOptionIds((prev) => {
      if (prev.includes(optionId)) {
        return prev.filter((id) => id !== optionId);
      }
      if (prev.length >= maxSelect) return prev;
      return [...prev, optionId];
    });
  };

  // 複数選択の送信
  const handleSubmitMulti = () => {
    if (!currentQuestion) return;
  if (selectedOptionIds.length < minSelect) return;
    const selectedOptions = currentQuestion.options.filter((opt, idx) => {
      const optionId = opt.id ?? opt.scoreKey ?? String(idx);
      return selectedOptionIds.includes(optionId);
    });

    const mergedScores = selectedOptions.reduce<Record<string, number>>((acc, opt) => {
      const scores = opt.scores ?? { [opt.scoreKey]: opt.scoreValue ?? 1 };
      for (const [key, val] of Object.entries(scores)) {
        acc[key] = (acc[key] || 0) + val;
      }
      return acc;
    }, {});

    setSelectedOptionIds([]);
    answerMulti(mergedScores);
  };

const handleSkipMulti = () => {
  setSelectedOptionIds([]);
  answerMulti({});
};

  const handleKoreanLevelChange = (level: KoreanLevel) => {
    setKoreanLevel(level);
  };

  const handlePreferToggle = (value: boolean) => {
    setPreferJapaneseSupport(value);
  };

  // 質問が変わったら選択をリセット
  useEffect(() => {
    setSelectedOptionIds([]);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [state.currentQuestionIndex]);

  // アンケート完了時の処理
  useEffect(() => {
    if (isComplete && !isCalculating && state.candidates.length === 0) {
      setIsCalculating(true);

      // スコアリング実行
      const scored = scoreMembersBySurvey(members, state.surveyScores);
      const topCandidates = getTopCandidates(scored, CANDIDATE_COUNT);

      // 候補をセット
      setCandidates(topCandidates);

      // 少し待ってからバトルページへ遷移
      setTimeout(() => {
        router.push(`/${locale}/battle`);
      }, 800);
    }
  }, [isComplete, isCalculating, members, state.surveyScores, state.candidates.length, setCandidates, router, locale]);

  // 既にバトルに進んでいる場合はバトルページへリダイレクト
  useEffect(() => {
    if (state.candidates.length > 0 && state.currentBattleRound < 10) {
      router.push(`/${locale}/battle`);
    }
  }, [state.candidates.length, state.currentBattleRound, router, locale]);

  // 計算中の表示
  if (isCalculating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <div className="card p-8 w-full max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-100 to-pink-100 
            flex items-center justify-center animate-pulse">
            <span className="text-2xl">✨</span>
          </div>
          <p className="text-gray-600 font-medium">{dict.calculating}</p>
        </div>
      </div>
    );
  }

  // 質問がない場合
  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">{dict.loading}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-[75vh] py-4">
      {/* プログレスバー */}
      <div className="w-full max-w-sm mb-6">
        <ProgressBar
          current={state.currentQuestionIndex + 1}
          total={questions.length}
        />
      </div>

      {/* 言語設定 */}
      <div className="w-full max-w-sm mb-4 p-4 rounded-lg bg-white shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">韓国語レベル</p>
            <p className="text-xs text-gray-500">目安でOKです</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {koreanLevelOptions.map((option) => {
            const isActive = state.koreanLevel === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleKoreanLevelChange(option.value)}
                className={`px-3 py-1.5 rounded-full text-sm border transition ${
                  isActive
                    ? "border-orange-400 bg-orange-50 text-orange-600"
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:border-orange-200"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                日本語対応がある子を優先したい
              </p>
              <p className="text-xs text-gray-500">
                おすすめ: {recommendedPrefer ? "ON" : "OFF"}
              </p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={state.preferJapaneseSupport}
                onChange={(e) => handlePreferToggle(e.target.checked)}
              />
              <div
                className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-orange-400 transition-colors"
              >
                <div
                  className={`h-5 w-5 bg-white rounded-full shadow transform transition-transform mt-0.5 ml-0.5 ${
                    state.preferJapaneseSupport ? "translate-x-5" : ""
                  }`}
                />
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* 質問カード */}
      <div className="w-full max-w-sm" key={state.currentQuestionIndex}>
        <QuestionCard
          question={currentQuestion}
          locale={locale}
          onAnswer={handleAnswer}
          onToggleOption={
            isMulti
              ? (option, idx) => handleToggleOption(option, idx)
              : undefined
          }
          selectedOptionIds={isMulti ? selectedOptionIds : undefined}
          onSubmitMulti={isMulti ? handleSubmitMulti : undefined}
          onSkipMulti={
            isMulti && currentQuestion.id === "q_cover_artist"
              ? handleSkipMulti
              : undefined
          }
          canSubmitMulti={
            !isMulti ||
            (selectedOptionIds.length >= minSelect && selectedOptionIds.length <= maxSelect)
          }
          maxReached={isMulti && selectedOptionIds.length >= maxSelect}
          questionNumber={state.currentQuestionIndex + 1}
          totalQuestions={questions.length}
        />
      </div>

      {/* リセットボタン */}
      <button
        onClick={() => {
          reset();
        setSelectedOptionIds([]);
          router.push(`/${locale}`);
        }}
        className="mt-8 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        最初からやり直す
      </button>
    </div>
  );
}
