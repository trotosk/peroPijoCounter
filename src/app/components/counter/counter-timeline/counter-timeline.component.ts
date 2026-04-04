import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CounterRecord, CounterGame, PointEvent } from '../../../models/counter.model';

export interface ServerStat {
  dorsal: string;
  points: number;
  serves: number;
  efficiency: number; // points / serves * 100
}

export interface ScorerStat {
  dorsal: string;
  points: number;
}

export interface SetSummary {
  title: string;
  leftScore: number;
  rightScore: number;
  leftPoints: number;
  rightPoints: number;
  winner: 'left' | 'right' | 'tie';
}

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

  activeTab: 'timeline' | 'stats' = 'timeline';

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

  // ── Stats ──────────────────────────────────────────────────────────────────

  get allPoints(): PointEvent[] {
    return this.record.games.flatMap(g => g.points ?? []);
  }

  get setSummaries(): SetSummary[] {
    return this.record.games
      .filter(g => (g.points?.length ?? 0) > 0)
      .map(g => ({
        title: g.title,
        leftScore: g.leftValue,
        rightScore: g.rightValue,
        leftPoints: this.leftPoints(g),
        rightPoints: this.rightPoints(g),
        winner: g.leftValue > g.rightValue ? 'left' : g.rightValue > g.leftValue ? 'right' : 'tie',
      } as SetSummary));
  }

  get leftServerStats(): ServerStat[] {
    return this.buildServerStats('left');
  }

  get rightServerStats(): ServerStat[] {
    return this.buildServerStats('right');
  }

  private buildServerStats(side: 'left' | 'right'): ServerStat[] {
    const pts = this.allPoints.filter(p => p.side === side && p.server);
    const map = new Map<string, { points: number; serves: number }>();

    // Count all points scored by this side grouped by server
    pts.forEach(p => {
      const s = p.server!;
      if (!map.has(s)) map.set(s, { points: 0, serves: 0 });
      map.get(s)!.points++;
    });

    // Count serve attempts: a server serves until the other side gets a point
    // Approximate: serve count = times this server appears as server on a point scored by this side
    // (the actual serve count equals the consecutive run while that player was serving)
    // Better: count distinct serve runs
    const allSidePoints = this.allPoints.filter(p => p.server);
    // Count how many points each server from this side was "on serve" for
    allSidePoints.forEach(p => {
      if (p.server && p.side === side) {
        // Already counted above
      }
    });

    // Simpler: efficiency = points scored while serving / total points that player served
    // We count serves as: each consecutive run where server=X and side=side counts as one serve start
    // For simplicity: serves = number of times player appears as server in any point where side changed
    // Use: serves = points (since in volleyball you only score on your serve, each point = 1 serve)
    // That means efficiency = 100% always. Better: count serve rotations
    // Realistic approach: count distinct serve runs per server
    const serveRuns = this.countServeRuns(side);

    return Array.from(map.entries())
      .map(([dorsal, { points }]) => ({
        dorsal,
        points,
        serves: serveRuns.get(dorsal) ?? points,
        efficiency: Math.round((points / (serveRuns.get(dorsal) ?? points)) * 100),
      }))
      .sort((a, b) => b.points - a.points);
  }

  private countServeRuns(side: 'left' | 'right'): Map<string, number> {
    // A serve run = consecutive points where side=side and server=X
    // Count how many distinct serve turns each server had
    const map = new Map<string, number>();
    let prevServer: string | undefined;
    let prevSide: string | undefined;

    for (const pt of this.allPoints) {
      if (pt.side === side && pt.server) {
        // New serve run starts when server changes or side changes
        if (pt.server !== prevServer || prevSide !== side) {
          map.set(pt.server, (map.get(pt.server) ?? 0) + 1);
        }
        prevServer = pt.server;
        prevSide = side;
      } else {
        // Side changed
        prevSide = pt.side;
        prevServer = undefined;
      }
    }
    return map;
  }

  get leftScorerStats(): ScorerStat[] {
    return this.buildScorerStats('left');
  }

  get rightScorerStats(): ScorerStat[] {
    return this.buildScorerStats('right');
  }

  private buildScorerStats(side: 'left' | 'right'): ScorerStat[] {
    const pts = this.allPoints.filter(p => p.side === side && p.scorer && p.scorer !== 'error');
    const map = new Map<string, number>();
    pts.forEach(p => map.set(p.scorer!, (map.get(p.scorer!) ?? 0) + 1));
    return Array.from(map.entries())
      .map(([dorsal, points]) => ({ dorsal, points }))
      .sort((a, b) => b.points - a.points);
  }

  get hasStats(): boolean {
    return this.allPoints.some(p => p.scorer || p.server);
  }
}
