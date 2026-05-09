// ─── プリセット（出力フォーマット）定義 ─────────────────────────

export const PRESETS = {
  "video-slide": {
    name: "video-slide",
    label: "動画用スライド (16:9)",
    size: "16:9",
    constraints: [
      "Design for 10-20 seconds viewing time per slide",
      "Keep bottom 8% clear for caption/lower-third area",
      "One headline + supporting elements only",
    ],
  },
  "presentation": {
    name: "presentation",
    label: "プレゼン用スライド (16:9)",
    size: "16:9",
    constraints: [
      "Optimized for projection at 2-5m viewing distance",
      "Title must be readable from the back of a 30-person room",
      "Minimal text density — speakers narrate, slides anchor",
    ],
  },
  "thumbnail": {
    name: "thumbnail",
    label: "YouTubeサムネイル (16:9)",
    size: "16:9",
    constraints: [
      "Must be readable at 320px wide thumbnail size",
      "ONE big visual + maximum 8-12 characters of text",
      "Extreme contrast (test at 30% size)",
    ],
  },
  "sns-square": {
    name: "sns-square",
    label: "SNS スクエア (1:1)",
    size: "1:1",
    constraints: [
      "Optimized for Instagram/X square format",
      "Text legible on 360px mobile screen",
      "Edge-safe: keep critical content within 90% of frame",
    ],
  },
  "sns-story": {
    name: "sns-story",
    label: "ストーリー縦型 (9:16)",
    size: "9:16",
    constraints: [
      "Vertical format for Instagram/TikTok stories",
      "Critical content in CENTER 70% (top/bottom can be obscured by UI)",
      "Single thumb-stoppable hero element",
    ],
  },
  "doc-slide": {
    name: "doc-slide",
    label: "資料・配布用 (16:9・情報密度高め)",
    size: "16:9",
    constraints: [
      "Optimized to be READ on screen, not projected",
      "Acceptable to have 3-5 information chunks per slide",
      "Use clear visual hierarchy: H1 > H2 > body > caption",
    ],
  },
};

export const SIZE_MAP = {
  "16:9": "16:9 (1920x1080px)",
  "1:1": "1:1 (1080x1080px)",
  "9:16": "9:16 (1080x1920px)",
};

export const PRESET_NAMES = Object.keys(PRESETS);
