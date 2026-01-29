export type GoalType = 'PENSION' | 'FLEXIBILITY' | 'EMERGENCY' | 'PROJECT';
export type ProductType = 'APV' | 'CUENTA2';
export type RegimeType = 'A' | 'B';
export type FundType = 'A' | 'B' | 'C' | 'D' | 'E';

export interface UserProfile {
  salary: number;
  monthlyContribution: number;
  goal: GoalType;
  horizon: number;
  age: number;
}

export interface FundOption {
  type: FundType;
  label: string;
  description: string;
  color: string;
  percent: number;
  annualRate: number;
}

// Estructura para comparar escenarios (Tu idea)
export interface ProjectionScenario {
  fundType: FundType;
  amount: number;
  color: string;
  difference: number; // Diferencia vs la estrategia del usuario
}

// Estructura para el resultado final de proyección
export interface ProjectionResult {
  userStrategyAmount: number; // El monto de su mix elegido
  scenarios: ProjectionScenario[]; // La lista comparativa (A, B, C, D, E)
}

// APV Recomendación
export interface ProductRecommendation {
  type: ProductType;
  regime?: RegimeType;
  badge: string;
  primaryMessage: string;
  secondaryMessage: string;
  benefitValue: number;
  isRecommended: boolean;
}

// Comparativa Regímenes
export interface RegimeComparison {
  regimeA: ProductRecommendation;
  regimeB: ProductRecommendation;
  recommendedRegime: RegimeType;
}

// Output Servicio
export interface SimulationOutput {
  bestProduct: ProductType;
  apvComparison?: RegimeComparison;
  availableFunds?: FundOption[];
}