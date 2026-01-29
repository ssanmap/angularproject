import { Injectable, signal, computed } from '@angular/core';
import { UserProfile, SimulationOutput, ProductRecommendation, RegimeType, FundOption, FundType } from '../models/advisor.model';

@Injectable({ providedIn: 'root' })
export class AdvisorService {

  private readonly THRESHOLD_HIGH_INCOME = 4867941;
  private readonly UTM = 64793;

  userProfile = signal<UserProfile>({
    salary: 0,
    monthlyContribution: 0,
    goal: 'PENSION',
    horizon: 5,
    age: 30
  });

  // Catálogo Base
  private fundsCatalog: FundOption[] = [
    { type: 'A', label: 'Más Riesgoso', description: 'Inversión agresiva', color: '#d32f2f', percent: 0, annualRate: 0.06 },
    { type: 'B', label: 'Riesgoso', description: 'Crecimiento alto', color: '#e64a19', percent: 0, annualRate: 0.05 },
    { type: 'C', label: 'Moderado', description: 'Equilibrio ideal', color: '#fbc02d', percent: 0, annualRate: 0.04 },
    { type: 'D', label: 'Conservador', description: 'Riesgo bajo', color: '#388e3c', percent: 0, annualRate: 0.03 },
    { type: 'E', label: 'Más Conservador', description: 'Máxima seguridad', color: '#1976d2', percent: 0, annualRate: 0.02 }
  ];

  recommendation = computed((): SimulationOutput | null => {
    const p = this.userProfile();
    if (p.salary <= 0) return null;

    const needsLiquidity = p.goal === 'FLEXIBILITY' || p.goal === 'EMERGENCY' || p.goal === 'PROJECT';
    const isShortTerm = p.horizon < 5;

    if (needsLiquidity || isShortTerm) {
      return {
        bestProduct: 'CUENTA2',
        availableFunds: JSON.parse(JSON.stringify(this.fundsCatalog))
      };
    } else {
      return this.calculateApvScenario(p);
    }
  });

  // Helper para obtener datos de un fondo por su letra (Para las comparaciones)
  getFundData(type: FundType): FundOption | undefined {
    return this.fundsCatalog.find(f => f.type === type);
  }

  // Cálculo Proyección
  calculateProjection(monthlyAmount: number, years: number, selectedFunds: FundOption[]): number {
    let weightedRate = 0;
    selectedFunds.forEach(fund => {
      if (fund.percent > 0) {
        weightedRate += (fund.percent / 100) * fund.annualRate;
      }
    });

    const monthlyRate = weightedRate / 12;
    const months = years * 12;

    if (monthlyRate === 0) return monthlyAmount * months;
    return monthlyAmount * ( (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate );
  }

  // APV Logic
  private calculateApvScenario(p: UserProfile): SimulationOutput {
    const optionA = this.buildApvRegime(p, 'A');
    const optionB = this.buildApvRegime(p, 'B');
    let recommended: RegimeType = 'A';
    
    if (p.salary >= this.THRESHOLD_HIGH_INCOME && optionB.benefitValue > optionA.benefitValue) {
      recommended = 'B';
    }

    optionA.isRecommended = recommended === 'A';
    optionB.isRecommended = recommended === 'B';

    return {
      bestProduct: 'APV',
      apvComparison: { regimeA: optionA, regimeB: optionB, recommendedRegime: recommended }
    };
  }

  private buildApvRegime(p: UserProfile, r: RegimeType): ProductRecommendation {
    const annual = p.monthlyContribution * 12;
    let benefit = 0;
    let msg = '';

    if (r === 'A') {
      benefit = Math.min(annual * 0.15, 6 * this.UTM);
      msg = 'Bonificación Fiscal (15%)';
    } else {
      benefit = annual * 0.23;
      msg = 'Rebaja de Impuestos';
    }

    return {
      type: 'APV',
      regime: r,
      badge: r === 'A' ? 'Bono Estado' : 'Eficiencia Tributaria',
      primaryMessage: `Régimen ${r}`,
      secondaryMessage: msg,
      benefitValue: benefit,
      isRecommended: false
    };
  }

  update(field: keyof UserProfile, value: any) {
    this.userProfile.update(prev => ({ ...prev, [field]: value }));
  }
}