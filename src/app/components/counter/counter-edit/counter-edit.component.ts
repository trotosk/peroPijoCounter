import { Component, OnInit } from '@angular/core';
import { CounterService } from '../../../services/counter.service';
import { AuthService } from '../../../services/auth.service';
import { CounterGame, CounterRecord } from '../../../models/counter.model';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIcon, MatIconModule } from "@angular/material/icon";

@Component({
  selector: 'app-counter-edit',
  templateUrl: './counter-edit.component.html',
  styleUrls: ['./counter-edit.component.scss'],
  imports: [CommonModule,
    FormsModule, MatIconModule, MatIcon]
})
export class CounterEditComponent implements OnInit {
  record: CounterRecord | null = null;
  recordGame: CounterGame | null = null;
  idFromRoute: string | null = null;
  readOnly = false;
  type: string | null = null;

  constructor(
    private counterSvc: CounterService,
    private auth: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Si viene id por query param -> cargar (editar si es del user)
    const id = this.route.snapshot.queryParamMap.get('id');
    this.type = this.route.snapshot.queryParamMap.get('type');
    
    if (!id) {
      const cur = this.auth.currentUser();
      if (!cur) throw new Error('No user');
      this.record = this.counterSvc.createCounterForUser(cur.id, this.type!, this.type!);
      console.log('Nuevo contador creado. Ahora puedes editarlo. Juegos: ' + this.record.games.length);
      // Al crear uno nuevo, seleccionamos el primer juego
      this.record.currentGameId = this.record.games[0].id;
    } else {
      const rec = this.counterSvc.findCounterById(id);
      this.idFromRoute = id;
      if (!rec) {
        alert('ID no válido');
        return;
      }
      const cur = this.auth.currentUser();
      if (cur && rec.ownerId !== cur.id) {
        this.readOnly = true; // modo lectura
      }
      this.record = JSON.parse(JSON.stringify(rec)); // clon para edición local
    }
    this.getSelectedGame(); // Cargar el juego seleccionado
  }
/*
  inc(side: 'left' | 'right') {
    if (!this.record || this.readOnly) return;
    const pair = side === 'left' ? this.record.left : this.record.right;
    pair.value = pair.value + 1;
    this.save();
  }
*/

  getSelectedGame() {
    if (!this.record) return;
    console.log('CurrentGameId:', this.record.currentGameId);
    this.recordGame = this.record.games.find(g => g.id === this.record?.currentGameId) || null;

  }

  changeCurrentGame(gameId: string) {
    if (!this.record) return;
    this.record.currentGameId = gameId;
    this.getSelectedGame();
  }

  // Incrementar el marcador del lado indicado
  inc(side: 'left' | 'right') {
    if (!this.record || !this.recordGame ||this.readOnly) return;
    if (side === 'left') {
      this.recordGame.leftValue = this.recordGame.leftValue +1;
    } else {
      this.recordGame.rightValue = this.recordGame.rightValue +1;
    }
   
    this.recordGame.updatedAt = new Date().toISOString();
    this.record.updatedAt = this.recordGame.updatedAt;
    this.saveCounter();
  }

  /*
  dec(side: 'left' | 'right') {
    if (!this.record || this.readOnly) return;
    const pair = side === 'left' ? this.record.left : this.record.right;
    pair.value = Math.max(0, pair.value - 1);
    this.saveCounter();
  }
*/
  // Decrementar el marcador del lado indicado
  dec(side: 'left' | 'right') {
    if (!this.record || !this.recordGame ||this.readOnly) return;
    
    if (side === 'left'){
      this.recordGame.leftValue = Math.max(0, this.recordGame.leftValue - 1);
    } else {
      this.recordGame.rightValue = Math.max(0, this.recordGame.rightValue - 1);
    }

    this.recordGame.updatedAt = new Date().toISOString();
    this.record.updatedAt = this.recordGame.updatedAt;
    this.saveCounter();
  }

  resetGame() {
    if (!this.record || !this.recordGame ||  this.readOnly) return;
    this.recordGame.leftValue = 0;
    this.recordGame.rightValue = 0;
    this.saveCounter();
  }

  saveCounter() {
    if (!this.record) return;
    this.counterSvc.updateCounter(this.record);
  }

}
