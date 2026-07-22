export interface PersonalInfo {
  occupation: string;
  education: string;
  marital_status: string;
}

export interface PHQ9Questions {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  q6: number;
  q7: number;
  q8: number;
  q9: number;
}

export interface GAD7Questions {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  q6: number;
  q7: number;
}

export interface StressQuestion {
  question: string;
  answer: number;
}

export interface SleepQuestions {
  duration: number;
  quality: string;
  night_awakenings: number;
  difficulty_falling_asleep: boolean;
}

export interface LifestyleQuestions {
  exercise: string;
  screen_time: number;
  alcohol: string;
  smoking: boolean;
  water_intake: number;
  diet: string;
}

export interface WellbeingQuestions {
  happiness: number;
  energy: number;
  motivation: number;
  concentration: number;
  social_support: string;
}

export interface AssessmentRequest {
  personal_info: PersonalInfo;
  phq9: PHQ9Questions;
  gad7: GAD7Questions;
  stress: StressQuestion[];
  sleep: SleepQuestions;
  lifestyle: LifestyleQuestions;
  wellbeing: WellbeingQuestions;
  status: string;
}

export interface AIAnalysis {
  summary: string;
  risk_assessment: string;
  recommendations: string[];
  follow_up: string;
  disclaimer: string;
}

export interface MetadataInfo {
  model: string;
  schema_version: string;
  generated_at: string;
}

export interface RiskScoreBreakdown {
  score: number;
  severity: string;
}

export interface OverallRisk {
  score: number;
  level: string;
}

export interface RiskProfile {
  phq9: RiskScoreBreakdown;
  gad7: RiskScoreBreakdown;
  stress: RiskScoreBreakdown;
  sleep: RiskScoreBreakdown;
  lifestyle: RiskScoreBreakdown;
  overall_risk: OverallRisk;
}

export interface AssessmentResponse {
  id: string;
  created_at?: string;
  status?: string;
  risk_profile: RiskProfile;
  ai_analysis: AIAnalysis;
  metadata: MetadataInfo;
}

export interface AssessmentListResponse {
  assessments: AssessmentResponse[];
}
