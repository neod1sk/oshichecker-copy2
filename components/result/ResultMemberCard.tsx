"use client";

import Image from "next/image";
import { CandidateMember } from "@/lib/types";
import { Locale } from "@/i18n.config";
import { getLocalizedName, isExternalUrl } from "@/lib/utils";
import { AttributeTagList } from "@/components/AttributeTag";

interface ResultMemberCardProps {
  candidate: CandidateMember;
  rank: number;
  locale: Locale;
  size?: "large" | "small";
}

export default function ResultMemberCard({
  candidate,
  rank,
  locale,
  size = "large",
}: ResultMemberCardProps) {
  const { member } = candidate;
  const name = getLocalizedName(member, locale);
  const isExternal = isExternalUrl(member.photoUrl);

  // ランクに応じたスタイル
  const rankStyles = {
    1: {
      ring: "ring-4 ring-yellow-400",
      badge: "bg-gradient-to-r from-yellow-400 to-amber-500",
      emoji: "👑",
      shadow: "shadow-2xl",
    },
    2: {
      ring: "ring-2 ring-gray-300",
      badge: "bg-gradient-to-r from-gray-300 to-gray-400",
      emoji: "🥈",
      shadow: "shadow-lg",
    },
    3: {
      ring: "ring-2 ring-amber-600",
      badge: "bg-gradient-to-r from-amber-600 to-amber-700",
      emoji: "🥉",
      shadow: "shadow-lg",
    },
  };

  const style = rankStyles[rank as 1 | 2 | 3] || rankStyles[3];

  // 1位用の大きいカード
  if (size === "large") {
    return (
      <div
        className={`
          relative bg-white rounded-2xl overflow-hidden
          ${style.ring} ${style.shadow}
        `}
      >
        {/* 横並びレイアウト */}
        <div className="flex">
          {/* 画像（左側） */}
          <div className="relative w-2/5 aspect-[3/4] flex-shrink-0 overflow-hidden">
            {isExternal ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.photoUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Image
                src={member.photoUrl}
                alt={name}
                fill
                className="object-cover"
                sizes="160px"
              />
            )}
            
            {/* ランクバッジ */}
            <div
              className={`
                absolute top-2 left-2 z-10
                w-8 h-8 rounded-full ${style.badge}
                flex items-center justify-center
                text-white font-bold text-sm shadow-lg
              `}
            >
              {rank}
            </div>
          </div>

          {/* 情報エリア（右側） */}
          <div className="flex-1 p-4 flex flex-col justify-center">
            {/* 名前とエモジ */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{style.emoji}</span>
              <h3 className="text-lg font-bold text-gray-800 leading-tight">{name}</h3>
            </div>

            {/* 属性タグ */}
            <div className="mb-2">
              <AttributeTagList tags={member.tags} locale={locale} maxDisplay={3} />
            </div>

            {/* スコア情報 */}
            <div className="text-xs text-gray-400 space-y-0.5">
              <div className="flex justify-between">
                <span>Score</span>
                <span>{candidate.surveyScore.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span>Wins</span>
                <span>{candidate.winCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2位・3位用の小さいカード
  return (
    <div
      className={`
        relative bg-white rounded-xl overflow-hidden
        ${style.ring} ${style.shadow}
      `}
    >
      {/* 画像 */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {isExternal ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.photoUrl}
            alt={name}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <Image
            src={member.photoUrl}
            alt={name}
            fill
            className="object-cover object-top"
            sizes="180px"
          />
        )}
        
        {/* ランクバッジ */}
        <div
          className={`
            absolute top-2 left-2 z-10
            w-7 h-7 rounded-full ${style.badge}
            flex items-center justify-center
            text-white font-bold text-xs shadow-md
          `}
        >
          {rank}
        </div>

        {/* グラデーションオーバーレイ */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        
        {/* 名前（画像上に表示） */}
        <div className="absolute bottom-2 left-2 right-2">
          <div className="flex items-center gap-1">
            <span className="text-base">{style.emoji}</span>
            <h3 className="text-sm font-bold text-white drop-shadow-lg truncate">{name}</h3>
          </div>
        </div>
      </div>

      {/* 情報エリア（コンパクト） */}
      <div className="p-2">
        <AttributeTagList tags={member.tags} locale={locale} maxDisplay={2} size="sm" />
      </div>
    </div>
  );
}
