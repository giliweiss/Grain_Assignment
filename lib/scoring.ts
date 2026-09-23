import type { AudienceType, Conference, ConferenceScore, Tier, Vertical } from "./types";

const verticalPoints: Record<Vertical, number> = {
  payments: 40,
  fintech: 35,
  treasury: 35,
  travel: 30,
  saas: 15,
  general: 5,
};

const audiencePoints: Record<AudienceType, number> = {
  buyers: 20,
  mixed: 10,
  vendors: 0,
};

const verticalReasons: Record<Vertical, string> = {
  payments: "Payments audience",
  fintech: "Fintech audience",
  treasury: "Treasury audience",
  travel: "Travel audience",
  saas: "SaaS audience",
  general: "General tech audience",
};

const audienceReasons: Record<AudienceType, string> = {
  buyers: "Buyer-heavy",
  mixed: "Mixed audience",
  vendors: "Vendor-heavy",
};

function sizePoints(audienceSize: number): number {
  if (audienceSize < 1000) return 5;
  if (audienceSize <= 5000) return 10;
  return 5;
}

function sizeReason(audienceSize: number): string {
  if (audienceSize < 1000) return "Specialist size";
  if (audienceSize <= 5000) return "Mid-size audience";
  return "Very large audience";
}

function tierForPoints(points: number): Tier {
  if (points >= 60) return "Strong";
  if (points >= 35) return "Worth a look";
  return "Skip";
}

export function scoreConference(conference: Conference): ConferenceScore {
  const points =
    verticalPoints[conference.vertical] +
    audiencePoints[conference.audienceType] +
    sizePoints(conference.audienceSize);

  return {
    points,
    tier: tierForPoints(points),
    reasons: [
      verticalReasons[conference.vertical],
      audienceReasons[conference.audienceType],
      sizeReason(conference.audienceSize),
    ],
  };
}
