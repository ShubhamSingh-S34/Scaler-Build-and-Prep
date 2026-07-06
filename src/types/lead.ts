export const LEARNING_FOCUS_OPTIONS = [
  "Backend development & APIs",
  "Frontend development & UI",
  "Full-stack development",
  "System design & architecture",
] as const;

export const CAREER_GOAL_OPTIONS = [
  "Move to a better company (same level)",
  "Level up (senior role / promotion)",
  "Higher compensation",
  "Switch to different tech domain",
  "Upskilling in current role",
] as const;

export const DREAM_ROLE_OPTIONS = [
  "Senior Backend Engineer",
  "Senior Full-Stack Engineer",
  "Backend / API Engineer",
  "Full-Stack Engineer",
  "Data Science Engineer",
  "DevOps Engineer",
  "AI/ML Engineer",
  "Tech Lead / Staff Engineer",
] as const;

export const TARGET_COMPANY_OPTIONS = [
  "FAANG / Big Tech",
  "Product Unicorns/Scaleups",
  "High Growth Startups",
  "Better Service Company",
  "Still evaluating",
] as const;

export const AI_USAGE_OPTIONS = [
  "I build agents or AI-powered features",
  "I use Cursor / Copilot daily",
  "I use it for specific tasks (debugging/docs)",
  "Only when stuck (quick ChatGPT help)",
  "Haven't integrated AI into workflow yet",
] as const;

export const AI_SHIPPED_OPTIONS = [
  "A production feature is live",
  "Internal tool or side project using LLM API",
  "Experimented with prompts/scripts only",
  "Haven't built anything with AI yet",
] as const;

export const CODING_PRACTICE_OPTIONS = [
  "Very Active (100+ problems)",
  "Moderately Active (50-100 problems)",
  "Somewhat Active (10-50 problems)",
  "Not Active (0-10 problems)",
] as const;

export const SYSTEM_DESIGN_OPTIONS = [
  "Led design discussions",
  "Participated in discussions",
  "Self-learning only",
  "Not yet, will learn",
] as const;

export const GITHUB_ACTIVITY_OPTIONS = [
  "Active (5+ public repos)",
  "Limited (1-5 repos)",
  "Inactive (old activity)",
  "No portfolio yet",
] as const;

export type LeadProfile = {
  name: string;
  /** International format, e.g. +919876543210 — where the final PDF gets sent. */
  phone: string;
  /** Current status in plain English, e.g. "Software Engineer, TCS" or "Final-year B.Tech student, Tier-3 college" */
  currentRole: string;
  /** null/blank for students or when unknown */
  yearsOfExperience: number | null;
  /** What the lead told us about why they're exploring Scaler, in their own words */
  intent: string;
  /** Free text: education, past companies, certifications, LinkedIn-style facts. Optional. */
  background: string;

  // Structured CRM questionnaire signals — "" means the lead didn't answer.
  learningFocus: string;
  careerGoal: string;
  dreamRole: string;
  targetCompanyType: string;
  aiUsage: string;
  aiShipped: string;
  codingPracticeActivity: string;
  systemDesignComfort: string;
  githubActivity: string;
};

export const LEAD_PROFILE_COOKIE = "lead_profile";
