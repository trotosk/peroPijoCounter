import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { CounterGame, CounterRecord } from '../../../models/counter.model';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from "@angular/material/icon";
import { trigger, transition, style, animate, keyframes } from '@angular/animations';
import { RouterModule } from '@angular/router';
import { FirestoreCounterService } from '../../../services/firestore-counter.service';
import { Subscription } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-counter-edit',
  templateUrl: './counter-edit.component.html',
  styleUrls: ['./counter-edit.component.scss'],
  animations: [
    trigger('bounce', [
      transition(':increment, :decrement', [
        animate('0.3s ease', keyframes([
          style({ transform: 'scale(1)', offset: 0 }),
          style({ transform: 'scale(1.3)', offset: 0.3 }),
          style({ transform: 'scale(0.9)', offset: 0.6 }),
          style({ transform: 'scale(1)', offset: 1 })
        ]))
      ])
    ])
  ],
  imports: [CommonModule,
    FormsModule, MatIconModule,RouterModule,MatSnackBarModule,]
})

export class CounterEditComponent implements OnInit, OnDestroy {
  record: CounterRecord = {
        id: '',
        ownerId: '',
        title: '',
        type: '',
        games: [],
        leftName: 'Local',
        rightName: 'Visitante',
        createdAt: '',
        updatedAt: ''
      };
  recordGame: CounterGame | null = null;
  idFromRoute: string | null = null;
  readOnly = false;
  type: string | null = null;
  toastMessage: string | null = null;
  showDeleteConfirm = false;
  isFullscreen = false;
  isFullscreenFijo= false;
  counter: any;
  sub?: Subscription;
  

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private fsService: FirestoreCounterService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  async ngOnInit() {
    // Si viene id por query param -> cargar (editar si es del user)
    const id = this.route.snapshot.queryParamMap.get('id');
    this.type = this.route.snapshot.queryParamMap.get('type');
    const cur = this.auth.currentUser();

    // Nuevo o editar existente
    if (!id) {
      // Crear uno nuevo
      if (!cur) throw new Error('No user');
      this.record = await this.fsService.createCounterForUser(cur.id, this.type!, this.type!);
      // Al crear uno nuevo, seleccionamos el primer juego
      this.record.currentGameId = this.record.games[0].id;
      //lo guardamos en Firestore
      this.fsService.saveCounter(this.record)
        .then(() => console.log('Nuevo contador guardado en Firestore'))
        .catch(err => console.error('Error guardando nuevo contador en Firestore', err));
    } else {
      // Cargar existente
      const rec = await this.fsService.findCounterById(id);//this.counterSvc.findCounterById(id);
      this.idFromRoute = id;
/*
      if (!rec) {
        alert('ID no válido');
        return;
      }
*/
       // Escucha Firestore en tiempo real
      this.sub = this.fsService.watchCounter(id).subscribe(c => {
        //console.log('Datos Firestore recibidos:', c);
        if (!c) return;
        this.counter = c;
        this.record = JSON.parse(JSON.stringify(c));
        this.getSelectedGame();
      });

      // Determinar modo de lectura
      if (!cur) {
        // Usuario público (no logueado)
        this.readOnly = true;
        this.isFullscreen = true;
        this.isFullscreenFijo = true;
      } else if (rec?.ownerId !== cur.id) {
        // Usuario logueado pero no propietario
        this.readOnly = true;
        this.isFullscreen = true;
        this.isFullscreenFijo = true;
      } else {
        // Propietario
        this.readOnly = false;
        this.isFullscreen = false;
        this.isFullscreenFijo = false;
      }

/*
      if (!cur || rec.ownerId !== cur.id) {
        this.readOnly = true; // modo lectura
        this.isFullscreen = true;
        this.isFullscreenFijo = true;
      }

      this.record = JSON.parse(JSON.stringify(rec)); // clon para edición local
      */
    }
    this.getSelectedGame(); // Cargar el juego seleccionado
  }


  getSelectedGame() {
    if (!this.record) return;
    //console.log('CurrentGameId:', this.record.currentGameId);
    this.recordGame = this.record.games.find(g => g.id === this.record?.currentGameId) || null;

  }

  changeCurrentGame(gameId: string) {
    if (!this.record) return;
    this.record.currentGameId = gameId;
    this.getSelectedGame();
    this.saveCounter();
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
    // Guardar cambios en el servicio en memoria local
    this.fsService.updateCounter(this.record.id,this.record);

     // 🔥 Sincroniza con Firestore
    this.fsService.saveCounter(this.record)
      .then(() => console.log('Guardado en Firestore'))
      .catch(err => console.error('Error guardando en Firestore', err));
  }

  selectGame(gameId: string) {
    if (!this.record) return;
    this.record.currentGameId = gameId;
  }

  async addGame() {
    if (!this.record) return;
    const newGame = await this.fsService.createGame(this.record!.id, `Set ${this.record!.games.length + 1}`);
    this.record.games.push(newGame);
    this.record.currentGameId = newGame.id;
    this.changeCurrentGame(newGame.id);
    this.saveCounter();
    this.showToast(`Se añadió ${newGame.title}`);
  }

  changeScore(side: 'left' | 'right', delta: number) {
    if (!this.record) return;
    const game = this.recordGame;
    if (!game) return;

    if (delta>0) {
      this.inc(side);
    } else {
      this.dec(side);
    }

  }

  copyIdToClipboard() {
    if (!this.record) return;
    navigator.clipboard.writeText(this.record.id);

    this.snackBar.open('📋 ID copiado al portapapeles', 'Cerrar', {
      duration: 2000,
      panelClass: ['info-toast']
    });
  }

  copyCurrentUrl() {
    const url = window.location.href;
    navigator.clipboard.writeText(url)
      .then(() => this.snackBar.open('📋 URL copiado al portapapeles', 'Cerrar', {
      duration: 2000,
      panelClass: ['info-toast']
      })).catch(() => alert('❌ No se pudo copiar el enlace'));
  }

  get whatsappShareUrl(): string {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent('¡Mira este marcador en vivo!');
    return `https://wa.me/?text=${text}%20${url}`;
  }

  showToast(message: string) {
    this.toastMessage = message;
    setTimeout(() => this.toastMessage = null, 2500);
  }

  requestDelete() {
    if (!this.record) return;
    if (this.record.games.length === 1) {
      this.showToast('No se puede eliminar el único set');
      return;
    }
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    if (!this.record) return;
    const current = this.recordGame;
    if (!current) return;
    this.record.games = this.record.games.filter(g => g.id !== current.id);
    this.record.currentGameId = this.record.games[this.record.games.length - 1].id;
    this.changeCurrentGame(this.record.games[this.record.games.length - 1].id);
    this.saveCounter();
    this.showDeleteConfirm = false;
    this.showToast(`${current.title} eliminado correctamente`);
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
  }

  toggleFullscreen() {
    //Verificamos si no entramos solo en modo lectura fijo
    if (this.isFullscreenFijo) {
      //Navegamos a la pantalla de cargar panel por id
      this.router.navigate(['/open']);
    } else {
      this.isFullscreen = !this.isFullscreen;
    }
    
  }

  async addPoint(team: 'A'|'B') {
    if (!this.counter) return;
    // ejemplo: actualiza score en firestore
    const newScore = { /* calcula */ };
    await this.fsService.updateCounter(this.counter.id!, { /*score: newScore*/ });
  }

}
