// Auto-generated from Pydantic models — do not edit manually

export interface HealthResponse {
  status: string;
  skills_loaded: number;
  skills_available: boolean;
  database: string;
  version: string;
}

export interface SkillItem {
  name: string;
  description: string;
  layer: number;
  version: string;
  depends_on: string[];
}

export interface SkillsResponse {
  count: number;
  skills: SkillItem[];
}

export interface ApiError {
  error: string;
}
