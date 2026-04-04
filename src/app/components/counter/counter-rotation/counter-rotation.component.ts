import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CounterRecord, RotationState } from '../../../models/counter.model';
import { FirestoreCounterService } from '../../../services/firestore-counter.service';

export function rotatePositions(p: string[]): string[] {
  return [p[1], p[2], p[3], p[4], p[5], p[0]];
}

export const DEFAULT_POSITIONS: string[] = ['1', '2', '3', '4', '5', '6'];

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
    // Ensure positions arrays are always 6 elements
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

  get eitherEnabled(): boolean {
    return !!(this.record.rotationLeft?.enabled || this.record.rotationRight?.enabled);
  }

  playerAt(zone: number): string {
    return this.rotation.positions[zone - 1] ?? '?';
  }

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

  startEdit(zone: number): void {
    if (this.readOnly) return;
    this.editingZone = zone;
    this.editingValue = this.playerAt(zone);
  }

  confirmEdit(): void {
    if (this.editingZone === null) return;
    const positions = [...this.rotation.positions];
    positions[this.editingZone - 1] = this.editingValue.trim() || '?';
    this.save({ ...this.rotation, positions });
    this.editingZone = null;
  }

  cancelEdit(): void { this.editingZone = null; }

  manualRotate(): void {
    if (this.readOnly) return;
    this.save({ ...this.rotation, positions: rotatePositions(this.rotation.positions) });
  }

  resetPositions(): void {
    if (this.readOnly) return;
    this.save({ ...this.rotation, positions: [...DEFAULT_POSITIONS] });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private save(rotation: RotationState): void {
    const key = this.activeSide === 'left' ? 'rotationLeft' : 'rotationRight';
    this.record[key] = rotation;
    this.fsService.updateCounter(this.record.id, { [key]: rotation }).catch(console.error);
  }
}
