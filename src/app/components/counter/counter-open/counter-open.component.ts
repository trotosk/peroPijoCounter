import { Component } from '@angular/core';
import { CounterService } from '../../../services/counter.service';
import { CounterGame, CounterRecord } from '../../../models/counter.model';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-counter-open',
  templateUrl: './counter-open.component.html',
  imports: [CommonModule,
    FormsModule
  ]
})
export class CounterOpenComponent {
  counterId = '';
  record: CounterRecord | null = null;
  recordGame: CounterGame | null = null;
  message = '';
  readOnly = true;
  intervalId: any;

  constructor(private counterSvc: CounterService, private auth: AuthService) {}

  load() {
    const rec = this.counterSvc.findCounterById(this.counterId);
    if (!rec) {
      this.record = null;
      this.message = 'ID no válido';
      return;
    }
    this.record = JSON.parse(JSON.stringify(rec)); // clon
    this.getSelectedGame();
    const currentUser = this.auth.currentUser();
    this.readOnly = !currentUser || currentUser.id !== rec.ownerId;
    this.message = '';

    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => this.refresh(), 5000);
  }

  refresh() {
    if (!this.record) return;
    const rec = this.counterSvc.findCounterById(this.record.id);
    if (!rec) return;
    const recordGameL = this.record.games.find(g => g.id === this.record?.currentGameId) || null;
    if (this.recordGame && recordGameL) {
      this.recordGame.leftValue = recordGameL.leftValue;
      this.recordGame.rightValue = recordGameL.rightValue;
      this.record.updatedAt = rec.updatedAt;
    }
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  getSelectedGame() {
    if (!this.record) return;
    this.recordGame = this.record.games.find(g => g.id === this.record?.currentGameId) || null;

  }
}
