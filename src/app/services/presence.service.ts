import { Injectable, OnDestroy } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe
} from '@angular/fire/firestore';

const VIEWER_TTL_MS = 60_000;   // 60 s — viewer is "live" while lastSeen is fresher than this
const PING_INTERVAL_MS = 20_000; // ping every 20 s

@Injectable({ providedIn: 'root' })
export class PresenceService implements OnDestroy {

  /** Current number of live viewers (updated in real-time). */
  liveViewers = 0;

  private sessionId: string = this.getOrCreateSessionId();
  private counterId: string | null = null;
  private pingTimer?: ReturnType<typeof setInterval>;
  private unsubscribeSnapshot?: Unsubscribe;

  constructor(private firestore: Firestore) {}

  /** Call when the user opens a counter. */
  join(counterId: string): void {
    if (this.counterId === counterId) return; // already joined
    this.leave(); // clean up any previous session
    this.counterId = counterId;
    this.ping();
    this.pingTimer = setInterval(() => this.ping(), PING_INTERVAL_MS);
    this.subscribeToViewers(counterId);
  }

  /** Call when the user leaves / component is destroyed. */
  leave(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = undefined;
    }
    if (this.unsubscribeSnapshot) {
      this.unsubscribeSnapshot();
      this.unsubscribeSnapshot = undefined;
    }
    if (this.counterId) {
      this.removeSelf(this.counterId).catch(() => {});
      this.counterId = null;
    }
    this.liveViewers = 0;
  }

  ngOnDestroy(): void {
    this.leave();
  }

  // ─── private ────────────────────────────────────────────────────────────────

  private async ping(): Promise<void> {
    if (!this.counterId) return;
    try {
      const ref = doc(
        this.firestore,
        `counters/${this.counterId}/viewers/${this.sessionId}`
      );
      await setDoc(ref, { lastSeen: Date.now() }, { merge: true });
    } catch {
      // Graceful failure — viewer count is best-effort
    }
  }

  private async removeSelf(counterId: string): Promise<void> {
    try {
      const ref = doc(
        this.firestore,
        `counters/${counterId}/viewers/${this.sessionId}`
      );
      await deleteDoc(ref);
    } catch {
      // Graceful failure
    }
  }

  private subscribeToViewers(counterId: string): void {
    const colRef = collection(this.firestore, `counters/${counterId}/viewers`);
    this.unsubscribeSnapshot = onSnapshot(
      colRef,
      snapshot => {
        const cutoff = Date.now() - VIEWER_TTL_MS;
        this.liveViewers = snapshot.docs.filter(d => {
          const data = d.data();
          return typeof data['lastSeen'] === 'number' && data['lastSeen'] >= cutoff;
        }).length;
      },
      () => {
        // Error (e.g. permission denied) — silently ignore
      }
    );
  }

  private getOrCreateSessionId(): string {
    const KEY = 'ppc_session_id';
    let id = sessionStorage.getItem(KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(KEY, id);
    }
    return id;
  }
}
