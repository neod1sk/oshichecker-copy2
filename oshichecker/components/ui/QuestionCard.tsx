"use client";

import { Question, QuestionOption } from "@/lib/types";
import { Locale } from "@/i18n.config";
import { getLocalizedText } from "@/lib/utils";

interface QuestionCardProps {
  question: Question;
  locale: Locale;
  onAnswer: (option: QuestionOption) => void;
  onToggleOption?: (option: QuestionOption, index: number) => void;
  selectedOptionIds?: string[];
  onSubmitMulti?: () => void;
  onSkipMulti?: () => void;
  canSubmitMulti?: boolean;
  maxReached?: boolean;
  questionNumber: number;
  totalQuestions: number;
}

export default function QuestionCard({
  question,
  locale,
  onAnswer,
  onToggleOption,
  selectedOptionIds = [],
  onSubmitMulti,
  onSkipMulti,
  canSubmitMulti = true,
  maxReached = false,
  questionNumber,
  totalQuestions,
}: QuestionCardProps) {
  const questionText = getLocalizedText(question, locale);
  const isMulti = question.type === "multi";
  const minSelect = question.minSelect ?? 1;
  const maxSelect = question.maxSelect ?? question.options.length;
  const isFaceAnimal = question.id === "q_face_animal";
  const prefixSizeClass = question.id === "q_genre_worldview" ? "text-base" : "text-sm";

  return (
    <div className="card p-6 w-full animate-scale-in">
      {/* 質問番号 */}
      <div className="text-center mb-4">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600">
          Q{questionNumber} / {totalQuestions}
        </span>
      </div>

      {/* 質問文 */}
      <h2 className="text-lg font-bold text-gray-800 text-center mb-6 leading-relaxed">
        {questionText}
      </h2>

      {isMulti && onSkipMulti && (
        <div className="text-right mb-3 space-y-2">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onSubmitMulti}
              disabled={!canSubmitMulti}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                canSubmitMulti
                  ? "bg-orange-500 text-white shadow hover:bg-orange-600"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              次へ
            </button>
          </div>
          <button
            type="button"
            onClick={onSkipMulti}
            className="text-sm text-gray-500 hover:text-orange-500 transition-colors"
          >
            スキップする
          </button>
        </div>
      )}

      {/* 選択肢 */}
      <div className="space-y-3">
        {question.options.map((option, index) => {
          const optionText = getLocalizedText(option, locale);
          const optionId = option.id ?? String(index);
          const isSelected = selectedOptionIds.includes(optionId);
          const disableSelect = isMulti && maxReached && !isSelected;
          const iconSrc =
            (isFaceAnimal && option.id)
              ? `/images/animals/${option.id}.svg`
              : null;
          const prefix =
            (question.id === "q_genre_worldview" ||
              question.id === "q_vibe_style" ||
              question.id === "q_performance_focus" ||
              question.id === "q_event_communication")
              ? String.fromCharCode(65 + index)
              : (optionText?.trim()?.[0] || String.fromCharCode(65 + index)).toUpperCase();

          const handleClick = () => {
            if (isMulti) {
              if (disableSelect) return;
              onToggleOption?.(option, index);
              return;
            }
            onAnswer(option);
          };

          return (
            <button
              key={index}
              onClick={handleClick}
              disabled={disableSelect}
              className={`w-full p-4 rounded-2xl text-left transition-all duration-200 border text-gray-700 font-medium ${
                isSelected
                  ? "bg-orange-50 border-orange-300 shadow-md"
                  : "bg-white/60 border-gray-200 hover:bg-white hover:border-orange-300 hover:shadow-md"
              } ${disableSelect ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <span className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-100 to-pink-100 
                  flex items-center justify-center font-semibold text-orange-500 ${prefixSizeClass}">
                  {iconSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={iconSrc}
                      alt={optionText}
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    prefix
                  )}
                </span>
                <span>{optionText}</span>
              </span>
            </button>
          );
        })}
      </div>

      {isMulti && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {selectedOptionIds.length}/{maxSelect} 選択中（最低 {minSelect}）
          </div>
          <button
            type="button"
            onClick={onSubmitMulti}
            disabled={!canSubmitMulti}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              canSubmitMulti
                ? "bg-orange-500 text-white shadow hover:bg-orange-600"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            次へ
          </button>
        </div>
      )}
    </div>
  );
}
