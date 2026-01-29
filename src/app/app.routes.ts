import { Routes } from '@angular/router';
// Asumo que creaste el componente donde pusimos la lógica anterior
// ng generate component pages/simulator
import { SimulatorComponent } from './pages/simulator/simulator.component';

export const routes: Routes = [
  {
    path: '', 
    component: SimulatorComponent,
    title: 'Inicio - Simulador'
  },
  {
    path: '**',
    redirectTo: '' // Cualquier ruta desconocida vuelve al inicio
  }
];