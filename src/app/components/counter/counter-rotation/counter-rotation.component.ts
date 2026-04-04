import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CounterRecord, RotationState } from '../../../models/counter.model';
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
  imports: [CommonModule, FormsModule],
})
export class CounterRotationComponent implements OnChanges {
  @Input() record!: CounterRecord;
  @Input() readOnly = false;
  @Output() close = new EventEmitter<void>();

  activeSide: 'left' | 'right' = 'left';
  editingZone: number | null = null;
  editingValue = '';

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

  /** Zona donde está la jugadora que el líbero reemplaza (aunque no esté en pista) */
  get replacedPlayerZone(): number | null {
    const r = this.rotation;
    if (!r.hasLibero || !r.liberoReplaces) return null;
    const idx = r.positions.indexOf(r.liberoReplaces);
    return idx === -1 ? null : idx + 1;
  }

  get liberoOnCourt(): boolean { return this.liberoActiveZone !== null; }

  get currentServer(): string { return this.playerAt(1); }
  get nextServer(): string    { return this.playerAt(2); }

  // ── Acciones ───────────────────────────────────────────────────────────────

  switchSide(side: 'left' | 'right'): void {
    this.activeSide = side;
    this.editingZone = null;
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
    if (this.readOnly) return;
    this.editingZone = zone;
    // Show original dorsal (not libero) when editing
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
    this.save({ ...this.rotation, positions: [...DEFAULT_POSITIONS], hasLibero: false, liberoNumber: undefined, liberoReplaces: undefined });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private save(rotation: RotationState): void {
    const key = this.activeSide === 'left' ? 'rotationLeft' : 'rotationRight';
    this.record[key] = rotation;
    this.fsService.updateCounter(this.record.id, { [key]: rotation }).catch(console.error);
  }
}
