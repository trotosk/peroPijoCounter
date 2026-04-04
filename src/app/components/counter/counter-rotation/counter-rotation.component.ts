import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CounterRecord, RotationState } from '../../../models/counter.model';
import { FirestoreCounterService } from '../../../services/firestore-counter.service';

/** Orden de rotación: zona 2→1, 3→2, 4→3, 5→4, 6→5, 1→6 */
function rotatePositions(p: string[]): string[] {
  return [p[1], p[2], p[3], p[4], p[5], p[0]];
}

const DEFAULT_POSITIONS: string[] = ['1', '2', '3', '4', '5', '6'];

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

  editingZone: number | null = null;
  editingValue = '';

  constructor(private fsService: FirestoreCounterService) {}

  ngOnChanges(): void {
    // Ensure positions array is always 6 elements
    if (this.record.rotation && this.record.rotation.positions.length < 6) {
      this.record.rotation.positions = [...DEFAULT_POSITIONS];
    }
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  get rotation(): RotationState {
    return this.record.rotation ?? { enabled: false, positions: [...DEFAULT_POSITIONS] };
  }

  /** Dorsal en la zona indicada (1-6) */
  playerAt(zone: number): string {
    return this.rotation.positions[zone - 1] ?? '?';
  }

  /** Jugadora que saca ahora (zona 1) */
  get currentServer(): string {
    return this.playerAt(1);
  }

  /**
   * Jugadora que sacaría TRAS la próxima rotación (zona 2 ahora).
   * Solo aplica si se pierde el punto actual.
   */
  get nextServer(): string {
    return this.playerAt(2);
  }

  // ── Acciones ───────────────────────────────────────────────────────────────

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

  cancelEdit(): void {
    this.editingZone = null;
  }

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
    this.record.rotation = rotation;
    this.fsService.updateCounter(this.record.id, { rotation }).catch(console.error);
  }
}
