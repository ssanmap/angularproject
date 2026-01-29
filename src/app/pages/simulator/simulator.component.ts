import { Component, inject, signal, effect, ViewChild } from '@angular/core'; // Agregamos ViewChild
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatStepper, MatStepperModule } from '@angular/material/stepper'; // Importar MatStepper
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AdvisorService } from '../../services/advisor.service';
import { FundOption, RegimeType, ProjectionResult, ProjectionScenario, FundType, RegimeComparison } from '../../models/advisor.model';

@Component({
  selector: 'app-simulator',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatStepperModule, MatButtonModule,
    MatInputModule, MatFormFieldModule, MatRadioModule, MatCardModule,
    MatIconModule, MatSliderModule, MatTooltipModule, MatSnackBarModule
  ],
  templateUrl: './simulator.component.html',
  styleUrl: './simulator.component.scss'
})
export class SimulatorComponent {
  // Referencia al HTML para poder mover el wizard
  @ViewChild('stepper') stepper!: MatStepper;

  service = inject(AdvisorService);
  private snackBar = inject(MatSnackBar);

  selectedRegimeOverride = signal<RegimeType | null>(null);
  localFunds = signal<FundOption[]>([]);
  
  // Guardamos el resultado para mostrarlo en el Paso 4
  projectionResult = signal<ProjectionResult | null>(null);

  constructor() {
    effect(() => {
      const res = this.service.recommendation();
      const currentFunds = this.localFunds();
      // Carga inicial de fondos Cuenta 2
      if (res?.bestProduct === 'CUENTA2' && currentFunds.length === 0) {
        this.localFunds.set(JSON.parse(JSON.stringify(res.availableFunds)));
      }
    }, { allowSignalWrites: true });
  }

  get profile() { return this.service.userProfile(); }

  update(field: string, value: any) {
    this.service.update(field as any, value);
    this.selectedRegimeOverride.set(null);
    this.localFunds.set([]);
    this.projectionResult.set(null);
  }

  // --- LÓGICA DE FONDOS (Igual) ---
  toggleFund(fund: FundOption) {
    const currentFunds = this.localFunds();
    if (fund.percent > 0) {
      fund.percent = 0;
    } else {
      const activeFunds = currentFunds.filter(f => f.percent > 0);
      if (activeFunds.length === 0) {
        fund.percent = 100;
      } else {
        const newCount = activeFunds.length + 1;
        const newShare = Math.floor(100 / newCount);
        currentFunds.forEach(f => {
          if (f.percent > 0) f.percent = newShare;
        });
        fund.percent = 100 - (newShare * (newCount - 1)); 
      }
    }
    this.localFunds.set([...currentFunds]);
    this.projectionResult.set(null);
  }

  get totalPercent() { return this.localFunds().reduce((sum, f) => sum + f.percent, 0); }
  get isValidDistribution() { return this.totalPercent === 100; }

  // --- ACCIÓN: IR AL PASO 4 (RESULTADO) ---
  goToResult() {
    const recommendation = this.service.recommendation();
    
    if (recommendation?.bestProduct === 'CUENTA2') {
      if (!this.isValidDistribution) {
        this.snackBar.open('La suma debe ser 100%', 'Corregir', { duration: 3000 });
        return;
      }
      
      // Calculamos la proyección antes de avanzar
      const contribution = this.profile.monthlyContribution;
      const horizon = this.profile.horizon;
      const userAmount = this.service.calculateProjection(contribution, horizon, this.localFunds());
      
      const allFunds: FundType[] = ['A', 'B', 'C', 'D', 'E'];
      const scenarios: ProjectionScenario[] = allFunds.map(type => {
        const fundData = this.service.getFundData(type)!;
        const dummyFundList = [{ ...fundData, percent: 100 }];
        const amount = this.service.calculateProjection(contribution, horizon, dummyFundList);
        
        return {
          fundType: type,
          amount: amount,
          color: fundData.color,
          difference: amount - userAmount
        };
      });

      this.projectionResult.set({
        userStrategyAmount: userAmount,
        scenarios: scenarios
      });

      // AVANZAMOS AL PASO 4
      this.stepper.next();

    } else {
      // Para APV, si ya eligió, avanzamos directo
      this.stepper.next();
    }
  }

  // Helpers APV
  selectRegime(type: RegimeType) { this.selectedRegimeOverride.set(type); }
  
  getRecommendedRegime(comp: RegimeComparison) {
    const override = this.selectedRegimeOverride();
    // Si hay override, ese manda. Si no, el recomendado por sistema.
    if (override) {
      return override === 'A' ? comp.regimeA : comp.regimeB;
    }
    return comp.recommendedRegime === 'A' ? comp.regimeA : comp.regimeB;
  }

  getAlternativeRegime(comp: RegimeComparison) {
    const override = this.selectedRegimeOverride();
    if (override) {
      return override === 'A' ? comp.regimeB : comp.regimeA;
    }
    return comp.recommendedRegime === 'A' ? comp.regimeB : comp.regimeA;
  }

  // Helper para mostrar el título correcto en el paso 4 según lo elegido
  getFinalRegimeSelection() {
    const res = this.service.recommendation();
    if(res?.bestProduct === 'APV') {
        return this.getRecommendedRegime(res.apvComparison!);
    }
    return null;
  }
}