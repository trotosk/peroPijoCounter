import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CounterRecord, CounterGame } from '../../../models/counter.model';
import { FirestoreCounterService } from '../../../services/firestore-counter.service';

@Component({
  selector: 'app-counter-open',
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  templateUrl: './counter-open.component.html',
  styleUrls: ['./counter-open.component.scss'],
})
export class CounterOpenComponent {
  counterId = '';
  record: CounterRecord | null = null;
  recordGame: CounterGame | null = null;

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private fsService: FirestoreCounterService
  ) {}

  async load() {
    const rec = await this.fsService.findCounterById(this.counterId.trim());
    //console.log('Recuperado:', rec);
    if (!this.counterId.trim()) {
      this.showToast('Por favor, introduce un ID antes de continuar.');
      return;
    }

    if (!rec) {
      this.showToast('❌ ID no válido o marcador no encontrado.');
      return;
    }

    // ✅ Si existe, navegamos al marcador
    this.router.navigate(['/app/create'], { queryParams: { id: rec.id } });
  }

  showToast(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-toast'],
    });
  }
}
