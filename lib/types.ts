export type Region = "Europe" | "North America" | "Middle East" | "Asia-Pacific";

export type Vertical = "payments" | "fintech" | "treasury" | "travel" | "saas" | "general";

export type AudienceType = "buyers" | "mixed" | "vendors";

export type Interest = "interested" | "not_now";

export type Tier = "Strong" | "Worth a look" | "Skip";

export type Conference = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  city: string;
  country: string;
  region: Region;
  vertical: Vertical;
  audienceSize: number;
  audienceType: AudienceType;
  url: string;
};

export type Meeting = {
  id: string;
  conferenceId: string;
  capturedAt: string;
  personName: string;
  company: string;
  email?: string;
  linkedinUrl?: string;
  note: string;
  interest: Interest;
};

export type Confirmation = {
  normalizedName: string;
  decision: "same_person" | "different_people";
};

export type ConferenceScore = {
  points: number;
  tier: Tier;
  reasons: string[];
};

export type TripCluster = {
  region: Region;
  conferenceIds: string[];
  dayGap: number;
};

export type PersonGroup = {
  key: string;
  meetings: Meeting[];
  matchLevel: "exact" | "likely" | "single";
  companyChanged: boolean;
};

export type PossibleMatch = {
  normalizedName: string;
  groupKeys: string[];
};

export type GroupedMeetings = {
  people: PersonGroup[];
  possibleMatches: PossibleMatch[];
};
