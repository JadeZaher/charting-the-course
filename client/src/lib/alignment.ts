import type { ProfileTile } from "@/components/profile/tiles";

export interface AlignmentResult {
  score: number;
  commonDimensions: string[];
  insights: string[];
}

/**
 * Calculate alignment/similarity between two users based on their profile tiles
 * Returns a score from 0-100 and common areas
 */
export function calculateAlignment(
  viewerTiles: ProfileTile[],
  profileTiles: ProfileTile[]
): AlignmentResult {
  if (viewerTiles.length === 0 || profileTiles.length === 0) {
    return {
      score: 0,
      commonDimensions: [],
      insights: ["Complete more quizzes to see your alignment with this person."],
    };
  }

  const viewerDimensions = new Set(viewerTiles.map(t => t.dimension).filter(Boolean));
  const profileDimensions = new Set(profileTiles.map(t => t.dimension).filter(Boolean));
  
  const commonDimensions: string[] = [];
  viewerDimensions.forEach(dim => {
    if (dim && profileDimensions.has(dim)) {
      commonDimensions.push(dim);
    }
  });

  const viewerValues = new Set<string>();
  const profileValues = new Set<string>();

  viewerTiles.forEach(tile => {
    if (tile.content) {
      if (tile.content.text) viewerValues.add(String(tile.content.text).toLowerCase());
      if (tile.content.badge_key) viewerValues.add(String(tile.content.badge_key).toLowerCase());
      if (tile.content.items && Array.isArray(tile.content.items)) {
        tile.content.items.forEach((item: any) => {
          if (item.label) viewerValues.add(String(item.label).toLowerCase());
        });
      }
    }
  });

  profileTiles.forEach(tile => {
    if (tile.content) {
      if (tile.content.text) profileValues.add(String(tile.content.text).toLowerCase());
      if (tile.content.badge_key) profileValues.add(String(tile.content.badge_key).toLowerCase());
      if (tile.content.items && Array.isArray(tile.content.items)) {
        tile.content.items.forEach((item: any) => {
          if (item.label) profileValues.add(String(item.label).toLowerCase());
        });
      }
    }
  });

  const commonValues: string[] = [];
  viewerValues.forEach(val => {
    if (profileValues.has(val)) {
      commonValues.push(val);
    }
  });

  const totalUnique = new Set([...viewerValues, ...profileValues]).size;
  const jaccardSimilarity = totalUnique > 0 
    ? commonValues.length / totalUnique 
    : 0;

  const dimensionBonus = commonDimensions.length * 10;
  const score = Math.min(100, Math.round(jaccardSimilarity * 70 + dimensionBonus));

  const insights: string[] = [];
  
  if (commonDimensions.length > 0) {
    insights.push(`You share insights in ${commonDimensions.join(", ")}.`);
  }
  
  if (score >= 70) {
    insights.push("High alignment! You likely share similar perspectives.");
  } else if (score >= 40) {
    insights.push("Moderate alignment with some shared traits.");
  } else if (score > 0) {
    insights.push("Different perspectives - potential for learning from each other.");
  }

  return {
    score,
    commonDimensions,
    insights,
  };
}

/**
 * Create an alignment tile to inject into the profile view
 */
export function createAlignmentTile(alignment: AlignmentResult): ProfileTile {
  return {
    id: "alignment-tile",
    user_id: "",
    submission_id: "",
    tile_type: "score",
    dimension: null,
    title: "Your Alignment",
    content: {
      score_value: alignment.score,
      score_max: 100,
      score_label: alignment.insights[0] || "Alignment score based on shared profile insights",
    },
    display_order: -1,
    is_visible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
