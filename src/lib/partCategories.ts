import type { Part } from "./types";

export type PartCategory =
  | "Control & Handling"
  | "Wheel & Brake"
  | "Frame & Body"
  | "Engine & Drive"
  | "Other";

const categoryKeywords: Record<PartCategory, string[]> = {
  "Control & Handling": [
    "handlebar",
    "grip",
    "mirror",
    "signal",
    "light",
    "lever",
    "switch",
    "damper",
    "steering",
  ],
  "Wheel & Brake": [
    "wheel",
    "tire",
    "tyre",
    "brake",
    "disc",
    "caliper",
    "rotor",
    "pad",
    "axle",
  ],
  "Frame & Body": [
    "tank",
    "fuel",
    "seat",
    "fairing",
    "body",
    "panel",
    "guard",
    "bash",
    "peg",
    "frame",
  ],
  "Engine & Drive": [
    "engine",
    "exhaust",
    "header",
    "pipe",
    "muffler",
    "chain",
    "belt",
    "sprocket",
    "clutch",
    "oil",
    "filter",
    "pump",
    "ecu",
  ],
  Other: [],
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ");
}

export function categorizePartsByName(parts: Part[]): Record<PartCategory, Part[]> {
  const categorized: Record<PartCategory, Part[]> = {
    "Control & Handling": [],
    "Wheel & Brake": [],
    "Frame & Body": [],
    "Engine & Drive": [],
    Other: [],
  };

  parts.forEach((part) => {
    const normalized = normalize(part.name);
    let found = false;

    // Try to match against category keywords
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (found) break;
      if (keywords.some((kw) => normalized.includes(kw))) {
        categorized[category as PartCategory].push(part);
        found = true;
      }
    }

    // If no match found, add to Other
    if (!found) {
      categorized.Other.push(part);
    }
  });

  return categorized;
}

export const categoryOrder: PartCategory[] = [
  "Control & Handling",
  "Wheel & Brake",
  "Frame & Body",
  "Engine & Drive",
  "Other",
];

export function getCategoryEmoji(category: PartCategory): string {
  const emojis: Record<PartCategory, string> = {
    "Control & Handling": "🎯",
    "Wheel & Brake": "⚙️",
    "Frame & Body": "🏗️",
    "Engine & Drive": "⚡",
    Other: "🔧",
  };
  return emojis[category];
}
