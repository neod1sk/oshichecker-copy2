import { Locale } from "@/i18n.config";

export type AttributeCategory = "genre" | "vibe" | "performance" | "meet";

type AttributeDefinition = {
  key: string;
  category: AttributeCategory;
  label: {
    ja: string;
    ko?: string;
    en?: string;
  };
};

// カテゴリ付きで固定キーを一元管理（jaのみ定義、後でko/enを追加予定）
export const ATTRIBUTE_DEFINITIONS = [
  // genre
  { key: "genre_orthodox", category: "genre", label: { ja: "王道" } },
  { key: "genre_denpa", category: "genre", label: { ja: "電波" } },
  { key: "genre_loud", category: "genre", label: { ja: "ラウド" } },
  { key: "genre_alt", category: "genre", label: { ja: "オルタナ" } },
  { key: "genre_dark", category: "genre", label: { ja: "ダーク" } },
  { key: "genre_gothic", category: "genre", label: { ja: "ゴシック" } },
  { key: "genre_cyber", category: "genre", label: { ja: "サイバー" } },
  { key: "genre_magical", category: "genre", label: { ja: "マジカル" } },
  { key: "genre_yami", category: "genre", label: { ja: "病み" } },

  // vibe
  { key: "cute", category: "vibe", label: { ja: "キュート" } },
  { key: "squirrel", category: "vibe", label: { ja: "リス系" } },
  { key: "cool", category: "vibe", label: { ja: "クール" } },
  { key: "pure", category: "vibe", label: { ja: "ピュア" } },
  { key: "sexy", category: "vibe", label: { ja: "セクシー" } },
  { key: "elegant", category: "vibe", label: { ja: "エレガント" } },
  { key: "healing", category: "vibe", label: { ja: "癒し" } },
  { key: "youthful", category: "vibe", label: { ja: "フレッシュ" } },
  { key: "mysterious", category: "vibe", label: { ja: "ミステリアス" } },
  { key: "unique", category: "vibe", label: { ja: "個性派" } },
  { key: "idol_kpop", category: "vibe", label: { ja: "K-POPアイドル" } },
  { key: "idol_polished", category: "vibe", label: { ja: "洗練アイドル" } },
  // face (vibe扱い)
  { key: "face_cat", category: "vibe", label: { ja: "猫顔" } },
  { key: "face_dog", category: "vibe", label: { ja: "犬顔" } },
  { key: "face_rabbit", category: "vibe", label: { ja: "ウサギ顔" } },
  { key: "face_raccoon_dog", category: "vibe", label: { ja: "タヌキ顔" } },
  { key: "face_fox", category: "vibe", label: { ja: "キツネ顔" } },
  { key: "face_squirrel", category: "vibe", label: { ja: "リス顔" } },
  { key: "face_chick", category: "vibe", label: { ja: "ひよこ顔" } },
  { key: "face_bird", category: "vibe", label: { ja: "小鳥顔" } },

  // performance
  { key: "dance", category: "performance", label: { ja: "ダンス" } },
  { key: "vocal", category: "performance", label: { ja: "ボーカル" } },
  { key: "expression", category: "performance", label: { ja: "表現力" } },
  { key: "energy", category: "performance", label: { ja: "エナジー" } },
  { key: "stability", category: "performance", label: { ja: "安定感" } },
  { key: "growth", category: "performance", label: { ja: "成長性" } },
  { key: "presence", category: "performance", label: { ja: "存在感" } },
  { key: "facial", category: "performance", label: { ja: "表情管理" } },
  { key: "charisma", category: "performance", label: { ja: "カリスマ" } },

  // meet
  { key: "comfort", category: "meet", label: { ja: "安心感" } },
  { key: "cheer", category: "meet", label: { ja: "わくわく" } },
  { key: "charming", category: "meet", label: { ja: "愛嬌" } },
  { key: "calm", category: "meet", label: { ja: "穏やか" } },
  { key: "dry", category: "meet", label: { ja: "ドライ" } },
  { key: "kind", category: "meet", label: { ja: "優しさ" } },
  { key: "talk", category: "meet", label: { ja: "トーク力" } },
  { key: "recognition", category: "meet", label: { ja: "認知度" } },
  { key: "closeness", category: "meet", label: { ja: "距離感" } },
  { key: "social", category: "meet", label: { ja: "社交性" } },
  { key: "gap", category: "meet", label: { ja: "ギャップ" } },
] as const satisfies readonly AttributeDefinition[];

export type AttributeKey = (typeof ATTRIBUTE_DEFINITIONS)[number]["key"];

export const ATTRIBUTE_KEYS = ATTRIBUTE_DEFINITIONS.map(
  (attr) => attr.key
) as readonly AttributeKey[];

export const ATTRIBUTE_LABELS: Record<
  AttributeKey,
  { ja: string; ko?: string; en?: string }
> = ATTRIBUTE_DEFINITIONS.reduce((acc, attr) => {
  acc[attr.key as AttributeKey] = attr.label;
  return acc;
}, {} as Record<AttributeKey, { ja: string; ko?: string; en?: string }>);

export const ATTRIBUTE_CATEGORIES: Record<AttributeCategory, AttributeKey[]> =
  ATTRIBUTE_DEFINITIONS.reduce(
    (acc, attr) => {
      acc[attr.category].push(attr.key as AttributeKey);
      return acc;
    },
    {
      genre: [] as AttributeKey[],
      vibe: [] as AttributeKey[],
      performance: [] as AttributeKey[],
      meet: [] as AttributeKey[],
    }
  );

const CATEGORY_COLORS: Record<AttributeCategory, string> = {
  genre: "#8b5cf6",        // パープル
  vibe: "#ec4899",         // ピンク
  performance: "#22c55e",  // グリーン
  meet: "#f59e0b",         // オレンジ
};

export function getAttributeLabel(key: AttributeKey, locale: Locale): string {
  const labels = ATTRIBUTE_LABELS[key];
  if (!labels) return key;
  return (labels as Record<string, string>)[locale] || labels.ja;
}

export function isValidAttributeKey(key: string): key is AttributeKey {
  return ATTRIBUTE_KEYS.includes(key as AttributeKey);
}

export function getAttributeColor(key: AttributeKey): string {
  const category = ATTRIBUTE_DEFINITIONS.find((attr) => attr.key === key)?.category;
  return (category && CATEGORY_COLORS[category]) || "#9ca3af";
}
