import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CounterRecord, CounterGame } from '../../../models/counter.model';

@Component({
  selector: 'app-counter-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './counter-timeline.component.html',
  styleUrls: ['./counter-timeline.component.scss']
})
export class CounterTimelineComponent {
  @Input() record!: CounterRecord;
  @Output() close = new EventEmitter<void>();

  hasAnyPoints(): boolean {
    return this.record.games.some(g => g.points && g.points.length > 0);
  }

  isWinner(game: CounterGame, side: 'left' | 'right'): boolean {
    if (side === 'left') return game.leftValue > game.rightValue;
    return game.rightValue > game.leftValue;
  }

  leftPoints(game: CounterGame): number {
    return game.points?.filter(p => p.side === 'left').length ?? 0;
  }

  rightPoints(game: CounterGame): number {
    return game.points?.filter(p => p.side === 'right').length ?? 0;
  }
}
