import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CounterRecord, RotationState, SubstitutionEvent } from '../../../models/counter.model';
import { FirestoreCounterService } from '../../../services/firestore-counter.service';

export function rotatePositions(p: string[]): string[] {
  return [p[1], p[2], p[3], p[4], p[5], p[0]];
}

export const DEFAULT_POSITIONS: string[] = ['1', '2', '3', '4', '5', '6'];

const BACK_ZONES = [1, 5, 6];

@Component({
  selector: 'app-counter-rotation',
  templateUrl: './counter-rotation.component.html',
  styleUrls: ['./counter-rotation.component.scss'],
  imports: [CommonModule, FormsModule, DragDropModule],
})
export class CounterRotationComponent implements OnChanges {
  @Input() record!: CounterRecord;
  @Input() readOnly = false;
  @Output() close = new EventEmitter<void>();

  activeSide: 'left' | 'right' = 'left';
  editingZone: number | null = null;
  editingValue = '';

  // Drag & drop state
  isDragging = false;
  pendingSwap: { fromZone: number; toZone: number; fromDorsal: string; toDorsal: string } | null = null;
  private _pendingPositions: string[] | null = null;

  constructor(private fsService: FirestoreCounterService) {}

  ngOnChanges(): void {
    for (const key of ['rotationLeft', 'rotationRight'] as const) {
      if (this.record[key] && this.record[key]!.positions.length < 6) {
        this.record[key]!.positions = [...DEFAULT_POSITIONS];
      }
    }
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  get teamName(): string {
    return this.activeSide === 'left'
      ? (this.record.leftName || 'Local')
      : (this.record.rightName || 'Visitante');
  }

  get rotation(): RotationState {
    const key = this.activeSide === 'left' ? 'rotationLeft' : 'rotationRight';
    return this.record[key] ?? { enabled: false, positions: [...DEFAULT_POSITIONS] };
  }

  /** IDs de los drop lists para conectarlos entre sí */
  zoneId(z: number): string {
    return `${this.activeSide}-zone-${z}`;
  }

  get zoneIds(): string[] {
    return [1, 2, 3, 4, 5, 6].map(z => this.zoneId(z));
  }

  /** Zona (1-6) donde el líbero está actualmente en pista, o null si no aplica */
  get liberoActiveZone(): number | null {
    const r = this.rotation;
    if (!r.hasLibero || !r.liberoReplaces || !r.liberoNumber) return null;
    const idx = r.positions.indexOf(r.liberoReplaces);
    if (idx === -1) return null;
    const zone = idx + 1;
    return BACK_ZONES.includes(zone) ? zone : null;
  }

  /** Dorsal real a mostrar en cada zona (líbero si corresponde) */
  playerAt(zone: number): string {
    if (this.liberoActiveZone === zone) return this.rotation.liberoNumber ?? 'L';
    return this.rotation.positions[zone - 1] ?? '?';
  }

  isLiberoZone(zone: number): boolean {
    return this.liberoActiveZone === zone;
  }

  get replacedPlayerZone(): number | null {
    const r = this.rotation;
    if (!r.hasLibero || !r.liberoReplaces) return null;
    const idx = r.positions.indexOf(r.liberoReplaces);
    return idx === -1 ? null : idx + 1;
  }

  get liberoOnCourt(): boolean { return this.liberoActiveZone !== null; }

  get currentServer(): string { return this.playerAt(1); }
  get nextServer(): string    { return this.playerAt(2); }

  get matchStarted(): boolean { return !!this.record.matchStartedAt; }

  // ── Drag & drop ────────────────────────────────────────────────────────────

  onDragStart(): void { this.isDragging = true; }

  onDragEnd(): void {
    // pequeño delay para que el click posterior no abra el editor
    setTimeout(() => { this.isDragging = false; }, 50);
  }

  onDrop(event: CdkDragDrop<number>): void {
    if (this.readOnly) return;
    const fromZone: number = event.previousContainer.data;
    const toZone: number   = event.container.data;
    if (fromZone === toZone) return;

    // No mover zona líbero (es virtual)
    if (this.isLiberoZone(fromZone) || this.isLiberoZone(toZone)) return;

    const positions = [...this.rotation.positions];
    const fromDorsal = positions[fromZone - 1];
    const toDorsal   = positions[toZone - 1];

    // Intercambio de posiciones
    positions[fromZone - 1] = toDorsal;
    positions[toZone - 1]   = fromDorsal;

    if (this.matchStarted) {
      // Preguntar si es sustitución
      this.pendingSwap     = { fromZone, toZone, fromDorsal, toDorsal };
      this._pendingPositions = positions;
    } else {
      this.save({ ...this.rotation, positions });
    }
  }

  confirmSubstitution(isSubstitution: boolean): void {
    if (!this.pendingSwap || !this._pendingPositions) return;
    const rotation: RotationState = { ...this.rotation, positions: this._pendingPositions };

    if (isSubstitution) {
      const sub: SubstitutionEvent = {
        minute:    this.elapsedMinutes(),
        outDorsal: this.pendingSwap.fromDorsal,
        inDorsal:  this.pendingSwap.toDorsal,
        timestamp: new Date().toISOString(),
      };
      rotation.substitutions = [...(rotation.substitutions ?? []), sub];
    }

    this.save(rotation);
    this.pendingSwap     = null;
    this._pendingPositions = null;
  }

  // ── Edición inline ─────────────────────────────────────────────────────────

  switchSide(side: 'left' | 'right'): void {
    this.activeSide = side;
    this.editingZone = null;
    this.pendingSwap = null;
  }

  toggleEnabled(): void {
    if (this.readOnly) return;
    this.save({ ...this.rotation, enabled: !this.rotation.enabled });
  }

  toggleLibero(): void {
    if (this.readOnly) return;
    this.save({ ...this.rotation, hasLibero: !this.rotation.hasLibero });
  }

  startEdit(zone: number): void {
    if (this.readOnly || this.isDragging) return;
    this.editingZone  = zone;
    this.editingValue = this.rotation.positions[zone - 1] ?? '';
  }

  confirmEdit(): void {
    if (this.editingZone === null) return;
    const positions = [...this.rotation.positions];
    positions[this.editingZone - 1] = this.editingValue.trim() || '?';
    this.save({ ...this.rotation, positions });
    this.editingZone = null;
  }

  cancelEdit(): void { this.editingZone = null; }

  updateLiberoNumber(value: string): void {
    if (this.readOnly) return;
    this.save({ ...this.rotation, liberoNumber: value.trim() });
  }

  updateLiberoReplaces(dorsal: string): void {
    if (this.readOnly) return;
    this.save({ ...this.rotation, liberoReplaces: dorsal });
  }

  manualRotate(): void {
    if (this.readOnly) return;
    this.save({ ...this.rotation, positions: rotatePositions(this.rotation.positions) });
  }

  resetPositions(): void {
    if (this.readOnly) return;
    this.save({ ...this.rotation, positions: [...DEFAULT_POSITIONS], hasLibero: false, liberoNumber: undefined, liberoReplaces: undefined, substitutions: [] });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private elapsedMinutes(): number {
    if (!this.record?.matchStartedAt) return 0;
    const ms = Date.now() - new Date(this.record.matchStartedAt).getTime() - (this.record.matchPausedMs ?? 0);
    return Math.floor(ms / 60000);
  }

  private save(rotation: RotationState): void {
    const key = this.activeSide === 'left' ? 'rotationLeft' : 'rotationRight';
    this.record[key] = rotation;
    this.fsService.updateCounter(this.record.id, { [key]: rotation }).catch(console.error);
  }
}
