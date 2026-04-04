import { Component, inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { COUNTER_CATEGORIES, CounterCategory, CounterGame, CounterRecord, PointEvent, WhatsappConfig } from '../../../models/counter.model';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from "@angular/material/icon";
import { trigger, transition, style, animate, keyframes } from '@angular/animations';
import { RouterModule } from '@angular/router';
import { FirestoreCounterService } from '../../../services/firestore-counter.service';
import { Subscription } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Analytics, getAnalytics, logEvent } from '@angular/fire/analytics';
import { WhatsappService, GreenApiChat } from '../../../services/whatsapp.service';
import { CounterTimelineComponent } from '../counter-timeline/counter-timeline.component';
import { CounterRotationComponent } from '../counter-rotation/counter-rotation.component';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { PresenceService } from '../../../services/presence.service';

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
  imports: [CommonModule, FormsModule, MatIconModule, RouterModule, MatSnackBarModule, CounterTimelineComponent, CounterRotationComponent]
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
        updatedAt: '',
        isPublic: false
      };
  recordGame: CounterGame | null = null;
  idFromRoute: string | null = null;
  readOnly = false;
  type: string | null = null;
  readonly categories: readonly CounterCategory[] = COUNTER_CATEGORIES;
  toastMessage: string | null = null;
  showDeleteConfirm = false;
  isFullscreen = false;
  isFullscreenFijo= false;
  counter: any;
  sub?: Subscription;
  currentUserId: string | null = null;
  isAuthorized= false;
  private platformId = inject(PLATFORM_ID);
  private analytics: Analytics | null = null;
  highlightedTeam: 'left' | 'right' | null = null;
  lastValues = { left: 0, right: 0 };
  showFinishConfirm = false;
  title = 'peroPijoCounter';
  timerDisplay = '00:00';
  private timerInterval?: ReturnType<typeof setInterval>;

  // WhatsApp panel
  showWaPanel = false;
  showTimeline = false;
  showRotation = false;
  waEnabled = false;
  waLoadingChats = false;
  waChats: GreenApiChat[] = [];
  waChatFilter = '';
  waChatId = '';
  waChatName = '';
  waMode: 'onChange' | 'interval' | 'keyMoments' = 'onChange';
  waInterval = 5;
  waLastSent = '';
  private greenApiInstanceId = '';
  private greenApiToken = '';
  private readonly WA_RECENT_KEY = 'wa_recent_chats';

  get filteredWaChats(): GreenApiChat[] {
    const f = this.waChatFilter.trim().toLowerCase();
    const recents: string[] = JSON.parse(localStorage.getItem(this.WA_RECENT_KEY) || '[]');
    const sorted = [...this.waChats].sort((a, b) => {
      const ai = recents.indexOf(a.id);
      const bi = recents.indexOf(b.id);
      if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
    if (!f) return sorted;
    return sorted.filter(c => c.name.toLowerCase().includes(f));
  }
  

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private fsService: FirestoreCounterService,
    private snackBar: MatSnackBar,
    private whatsappSvc: WhatsappService,
    private firestore: Firestore,
    public presenceSvc: PresenceService,
  ) {}

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.stopTimer();
    this.whatsappSvc.stop();
    this.presenceSvc.leave();
  }

  async ngOnInit() {
    const id = this.route.snapshot.queryParamMap.get('id');
    this.type = this.route.snapshot.queryParamMap.get('type');
    const categoryParam = this.route.snapshot.queryParamMap.get('category');
    const cur = this.auth.currentUser();
    this.currentUserId = cur ? cur.id : null;

    // Cargar credenciales Green API del usuario
    if (cur) {
      const userSnap = await getDoc(doc(this.firestore, `users/${cur.id}`));
      if (userSnap.exists()) {
        const d = userSnap.data();
        this.greenApiInstanceId = d['greenApiInstanceId'] ?? '';
        this.greenApiToken      = d['greenApiToken']      ?? '';
      }
    }

    this.analytics = getAnalytics();

    // Nuevo o editar existente
    if (!id) {
      // Crear uno nuevo
      if (!cur) throw new Error('No user');
      this.record = await this.fsService.createCounterForUser(cur.id, this.type!, this.type!, categoryParam ?? undefined);
      // Al crear uno nuevo, seleccionamos el primer juego
      this.record.currentGameId = this.record.games[0].id;
      //lo guardamos en Firestore
      this.fsService.saveCounter(this.record)
        .then(() => console.log('Nuevo contador guardado en Firestore'))
        //.catch(err => console.error('Error guardando nuevo contador en Firestore', err));
        .catch(err => {
          console.error('Error guardando nuevo contador en Firestore', err);
            if(this.analytics) logEvent(this.analytics, 'Error guardando nuevo contador en Firestore: ', { err });
          });
      // 🔥 IMPORTANTE: actualizar URL al nuevo ID sin recargar
      window.history.replaceState({}, '', `/app/create?id=${this.record.id}`);
      this.presenceSvc.join(this.record.id);

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
       // Registrar presencia como espectador
      this.presenceSvc.join(id);

      // Escucha Firestore en tiempo real
      this.sub = this.fsService.watchCounter(id).subscribe(c => {
        //console.log('Datos Firestore recibidos:', c);
        if (!c) return;
        
        // Para que el modo lectura y fullscreen sepan el ultimo en marcar
        const prevLeft = this.lastValues.left;
        const prevRight = this.lastValues.right;

        // Actualizamos los últimos valores
        this.counter = c;
        this.record = JSON.parse(JSON.stringify(c));
        this.getSelectedGame();

        // Actualizar pico de espectadores si se supera
        const current = this.presenceSvc.liveViewers;
        const peak = this.record.peakViewers ?? 0;
        if (current > peak) {
          this.record.peakViewers = current;
          this.fsService.updateCounter(this.record.id, { peakViewers: current }).catch(() => {});
        }

        const currentGame = this.record.games.find(g => g.id === this.record.currentGameId);
        if (!currentGame) return;

        // Detectar lado actualizado
        if (currentGame.leftValue !== prevLeft) {
          this.highlightedTeam = 'left';
        } else if (currentGame.rightValue !== prevRight) {
          this.highlightedTeam = 'right';
        }

        // Guardar valores actuales
        this.lastValues.left = currentGame.leftValue;
        this.lastValues.right = currentGame.rightValue;

        // Restaurar config WhatsApp del contador si existe
        if (this.record.whatsappConfig) {
          this.waChatId   = this.record.whatsappConfig.groupChatId;
          this.waChatName = this.record.whatsappConfig.groupName;
          this.waMode     = this.record.whatsappConfig.mode;
          this.waInterval = this.record.whatsappConfig.intervalMinutes;
        }

        // Reanudar o mostrar timer según estado del partido
        if (this.record.matchStartedAt && !this.timerInterval) {
          if (this.record.matchFinishedAt) {
            this.timerDisplay = this.calcElapsed(this.record.matchStartedAt, this.record.matchFinishedAt, this.record.matchPausedMs ?? 0);
          } else if (!this.record.isFinished) {
            this.startTimer();
          }
        }
      });

      // Determinar modo de lectura
      if (!cur) {
        // Usuario público (no logueado)
        this.readOnly = true;
        this.isFullscreen = true;
        this.isFullscreenFijo = true;
        this.isAuthorized = false;
        logEvent(this.analytics, 'View_' + this.idFromRoute );
      } else if (rec?.ownerId !== cur.id && !(rec?.authorizedUserIds || []).includes(cur.id)) {
        // Usuario logueado pero no propietario ni autorizado
        this.readOnly = true;
        this.isFullscreen = true;
        this.isFullscreenFijo = true;
        this.isAuthorized = false;
        logEvent(this.analytics, 'View_'+ this.idFromRoute);
      } else if ((rec?.authorizedUserIds || []).includes(cur.id)) {
        // Usuario autorizado
        this.readOnly = false;
        this.isFullscreen = false;
        this.isFullscreenFijo = false;
        this.isAuthorized = true; 
        logEvent(this.analytics, 'Auth_use_'+ this.idFromRoute);
      } else {
        // Propietario
        this.readOnly = false;
        this.isFullscreen = false;
        this.isFullscreenFijo = false;
        this.isAuthorized = false;
        if (this.analytics) {
          logEvent(this.analytics, 'Owner_use_'+ this.idFromRoute, { id: this.idFromRoute || 'unknown' });
        }
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

  private elapsedMinutes(): number {
    if (!this.record?.matchStartedAt) return 0;
    const ms = Date.now() - new Date(this.record.matchStartedAt).getTime() - (this.record.matchPausedMs ?? 0);
    return Math.floor(ms / 60000);
  }

  // Incrementar el marcador del lado indicado
  inc(side: 'left' | 'right') {
    if (!this.record || !this.recordGame ||this.readOnly) return;
    const prevHighlighted = this.highlightedTeam;
    if (side === 'left') {
      this.recordGame.leftValue = this.recordGame.leftValue +1;
      this.highlightedTeam = 'left';
    } else {
      this.recordGame.rightValue = this.recordGame.rightValue +1;
      this.highlightedTeam = 'right';
    }
    // Auto-rotación: el equipo local recupera el saque
    if (side === 'left' && prevHighlighted === 'right') {
      this.autoRotate();
    }

    // Arrancar el timer en el primer punto del partido
    const isFirstPoint = !this.record.matchStartedAt;
    if (isFirstPoint) {
      this.record.matchStartedAt = new Date().toISOString();
      this.startTimer();
    }

    // Registrar punto en el timeline
    if (!this.recordGame.points) this.recordGame.points = [];
    this.recordGame.points.push({ side, minute: this.elapsedMinutes() });

    this.recordGame.updatedAt = new Date().toISOString();
    this.record.updatedAt = this.recordGame.updatedAt;

    this.saveCounter();

    if (this.waEnabled && this.greenApiInstanceId && this.greenApiToken && this.record.whatsappConfig) {
      const mode = this.record.whatsappConfig.mode;
      if (mode === 'onChange') {
        const msg = this.whatsappSvc.buildMessage(this.record);
        this.whatsappSvc.triggerOnChange(this.record.whatsappConfig, this.greenApiInstanceId, this.greenApiToken, msg)
          .then(() => this.waLastSent = new Date().toLocaleTimeString())
          .catch(console.error);
      } else if (mode === 'keyMoments' && isFirstPoint) {
        const msg = this.whatsappSvc.buildMatchStartMessage(this.record);
        this.whatsappSvc.sendMessage(this.greenApiInstanceId, this.greenApiToken, this.record.whatsappConfig.groupChatId, msg)
          .then(() => this.waLastSent = new Date().toLocaleTimeString())
          .catch(console.error);
      }
    }
  }


  // Decrementar el marcador del lado indicado
  dec(side: 'left' | 'right') {
    if (!this.record || !this.recordGame ||this.readOnly) return;
    const currentVal = side === 'left' ? this.recordGame.leftValue : this.recordGame.rightValue;
    if (currentVal <= 0) return;

    if (side === 'left'){
      this.recordGame.leftValue = this.recordGame.leftValue - 1;
    } else {
      this.recordGame.rightValue = this.recordGame.rightValue - 1;
    }

    // Eliminar el último punto de ese lado del timeline
    if (this.recordGame.points?.length) {
      const lastIdx = [...this.recordGame.points].map((p, i) => ({ p, i }))
        .reverse().find(({ p }) => p.side === side)?.i;
      if (lastIdx !== undefined) this.recordGame.points.splice(lastIdx, 1);
    }

    // ⭐ SI SE RESTA → APAGAR ILUMINACIÓN
    this.highlightedTeam = null;

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
    if (!this.record || !this.recordGame) return;

    // Restricciones de voley
    if (this.record.type === 'Voley') {
      const l = this.recordGame.leftValue;
      const r = this.recordGame.rightValue;
      if (l === r) {
        this.showToast('No se puede añadir set: el set actual está empatado');
        return;
      }
      if (Math.abs(l - r) < 2) {
        this.showToast('No se puede añadir set: el equipo ganador debe tener al menos 2 puntos de ventaja');
        return;
      }
    }

    const finishedGame = this.recordGame;
    const newGame = await this.fsService.createGame(this.record!.id, `Set ${this.record!.games.length + 1}`);
    this.record.games.push(newGame);
    this.record.currentGameId = newGame.id;
    this.changeCurrentGame(newGame.id);
    this.saveCounter();
    this.showToast(`Se añadió ${newGame.title}`);

    if (this.waEnabled && this.greenApiInstanceId && this.greenApiToken && this.record.whatsappConfig
        && this.record.whatsappConfig.mode === 'keyMoments' && finishedGame) {
      const msg = this.whatsappSvc.buildSetEndMessage(this.record, finishedGame);
      this.whatsappSvc.sendMessage(this.greenApiInstanceId, this.greenApiToken, this.record.whatsappConfig.groupChatId, msg)
        .then(() => this.waLastSent = new Date().toLocaleTimeString())
        .catch(console.error);
    }
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
    const left = this.record?.leftName || '';
    const right = this.record?.rightName || '';
    const teams = left && right ? ` ${left} vs ${right}` : '';
    const category = this.record?.category ? ` | ${this.record.category} |` : '';
    const text = encodeURIComponent(`¡Mira este marcador en vivo!${teams}${category}`);
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
    this.renumberSets();   // ⬅️ renombra todos los sets
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

  goToPermissions() {
      this.router.navigate(['/app/permissions'], { queryParams: { id: this.record!.id } });
  }

  private renumberSets() {
    if (!this.record?.games) return;
    this.record.games = this.record.games.map((g, index) => ({
      ...g,
      name: `Set ${index + 1}`,
      title: `Set ${index + 1}`
    }));
  }

  // Solicitar confirmación de finalizar partido
  requestFinish() {
    if (!this.record || !this.recordGame) return;

    // Mismas restricciones que al añadir set
    if (this.record.type === 'Voley') {
      const l = this.recordGame.leftValue;
      const r = this.recordGame.rightValue;
      if (l === r) {
        this.showToast('No se puede finalizar: el set activo está empatado');
        return;
      }
      if (Math.abs(l - r) < 2) {
        this.showToast('No se puede finalizar: el equipo ganador debe tener al menos 2 puntos de ventaja');
        return;
      }
    }

    this.showFinishConfirm = true;
  }

  // Confirmar finalización
  confirmFinish() {
    if (!this.record) return;
    this.record.isFinished = true;
    this.record.matchFinishedAt = new Date().toISOString();
    this.showFinishConfirm = false;
    this.stopTimer();
    if (this.record.matchStartedAt) {
      this.timerDisplay = this.calcElapsed(this.record.matchStartedAt, this.record.matchFinishedAt!, this.record.matchPausedMs ?? 0);
    }
    this.saveCounter();

    if (this.waEnabled && this.record.whatsappConfig && this.greenApiInstanceId && this.greenApiToken) {
      const finalMsg = this.whatsappSvc.buildFinalMessage(this.record);
      this.whatsappSvc.sendMessage(this.greenApiInstanceId, this.greenApiToken, this.record.whatsappConfig.groupChatId, finalMsg)
        .catch(console.error);
      this.whatsappSvc.stop();
      this.waEnabled = false;
    }
  }

  // Reactivar partido
  reactivateMatch() {
    if (!this.record) return;
    // Acumular el tiempo que estuvo parado para descontarlo del total
    if (this.record.matchFinishedAt) {
      const pausedSegment = Date.now() - new Date(this.record.matchFinishedAt).getTime();
      this.record.matchPausedMs = (this.record.matchPausedMs ?? 0) + pausedSegment;
      this.record.matchFinishedAt = undefined;
    }
    this.record.isFinished = false;
    this.saveCounter();
    if (this.record.matchStartedAt) this.startTimer();
  }

  togglePrivacy() {
    if (!this.record) return;
    this.record.isPublic = !this.record.isPublic;
    this.saveCounter();
    this.showToast(
      this.record.isPublic
        ? 'El marcador ahora es público'
        : 'El marcador ahora es privado'
    );
  }

  get leftSetsWon(): number {
    if (!this.record) return 0;
    return this.record.games.filter(g =>
      (this.record!.isFinished || g.id !== this.record?.currentGameId) &&
      g.leftValue > g.rightValue
    ).length;
  }

  get rightSetsWon(): number {
    if (!this.record) return 0;
    return this.record.games.filter(g =>
      (this.record!.isFinished || g.id !== this.record?.currentGameId) &&
      g.rightValue > g.leftValue
    ).length;
  }

  range(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }

  // ─── WhatsApp panel ───────────────────────────────────────────────────────────

  get hasGreenApiCredentials(): boolean {
    return !!(this.greenApiInstanceId && this.greenApiToken);
  }

  async loadWhatsappChats() {
    if (!this.hasGreenApiCredentials) {
      this.showToast('Configura las credenciales de Green API en Ajustes');
      return;
    }
    this.waLoadingChats = true;
    try {
      this.waChats = await this.whatsappSvc.getChats(this.greenApiInstanceId, this.greenApiToken);
    } catch {
      this.showToast('Error al conectar con Green API. Revisa las credenciales en Ajustes.');
    } finally {
      this.waLoadingChats = false;
    }
  }

  selectWaChat(chat: GreenApiChat) {
    this.waChatId   = chat.id;
    this.waChatName = chat.name;
    this.waChatFilter = '';
    const recents: string[] = JSON.parse(localStorage.getItem(this.WA_RECENT_KEY) || '[]');
    const updated = [chat.id, ...recents.filter(id => id !== chat.id)].slice(0, 20);
    localStorage.setItem(this.WA_RECENT_KEY, JSON.stringify(updated));
  }

  toggleWaEnabled() {
    if (!this.waEnabled) {
      if (!this.waChatId) { this.showToast('Elige un grupo primero'); return; }
      if (!this.hasGreenApiCredentials) { this.showToast('Configura Green API en Ajustes'); return; }

      const config: WhatsappConfig = {
        groupChatId: this.waChatId,
        groupName:   this.waChatName,
        mode:        this.waMode,
        intervalMinutes: this.waInterval,
      };
      this.record.whatsappConfig = config;
      this.saveCounter();

      this.waEnabled = true;

      if (this.waMode === 'interval') {
        this.whatsappSvc.start(config, this.greenApiInstanceId, this.greenApiToken,
          () => this.whatsappSvc.buildMessage(this.record));
        this.showToast(`Enviando cada ${this.waInterval} min a ${this.waChatName}`);
      } else if (this.waMode === 'keyMoments') {
        this.showToast(`Enviando a ${this.waChatName} en momentos clave`);
      } else {
        this.showToast(`Enviando a ${this.waChatName} al cambiar el marcador`);
      }
    } else {
      this.waEnabled = false;
      this.whatsappSvc.stop();
      this.showToast('Envío por WhatsApp desactivado');
    }
  }

  private startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      if (this.record?.matchStartedAt) {
        this.timerDisplay = this.calcElapsed(
          this.record.matchStartedAt,
          new Date().toISOString(),
          this.record.matchPausedMs ?? 0,
        );
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
  }

  private autoRotate(): void {
    if (!this.record.rotation?.enabled) return;
    const p = this.record.rotation.positions;
    this.record.rotation.positions = [p[1], p[2], p[3], p[4], p[5], p[0]];
    // Se persiste en Firestore junto con el punto via saveCounter()
  }

  private calcElapsed(from: string, to: string, pausedMs = 0): string {
    const ms = Math.max(0, new Date(to).getTime() - new Date(from).getTime() - pausedMs);
    const totalSec = Math.floor(ms / 1000);
    const h   = Math.floor(totalSec / 3600);
    const min = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
    const sec = (totalSec % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${min}:${sec}` : `${min}:${sec}`;
  }

}
