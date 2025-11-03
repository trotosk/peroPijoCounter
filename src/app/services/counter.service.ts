import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { CounterRecord, CounterRecordList } from '../models/counter.model';
import { v4 as uuidv4 } from 'uuid';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CounterService {
  private key = 'counters';

  constructor(private storage: StorageService) {}
/*
  private loadAll(): CounterRecord[] {
    return this.storage.get<CounterRecord[]>(this.key) || [];
  }
  private saveAll(items: CounterRecord[]) {
    this.storage.set(this.key, items);
  }

  createCounterForUser(ownerId: string, title = 'Mi contador', type = 'general'): CounterRecord {
    const now = new Date().toISOString();
    const rec: CounterRecord = {
      id: uuidv4(),
      ownerId,
      title,
      type,
      games: [],
      leftName: 'Local',
      rightName: 'Visitante',
      createdAt: now,
      updatedAt: now
    };
    const arr = this.loadAll();
    arr.push(rec);
    this.saveAll(arr);

    //Incluimos un juego al menos
    const game = this.createGame(rec.id, 'Set 1');
    rec.games.push(game);
    return rec;
  }

  updateCounter(rec: CounterRecord) {
    const arr = this.loadAll();
    const idx = arr.findIndex(r => r.id === rec.id);
    if (idx === -1) throw new Error('No encontrado');
    rec.updatedAt = new Date().toISOString();
    arr[idx] = rec;
    this.saveAll(arr);
  }

  removeCounter(id: string) {
    const arr = this.loadAll();
    const idx = arr.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('No encontrado');
    //rec.updatedAt = new Date().toISOString();
    arr.splice(idx, 1);
    this.saveAll(arr);
  }

  findCounterById(id: string): CounterRecord | undefined {
    return this.loadAll().find(r => r.id === id);
  }

  listCountersByUser(userId: string): CounterRecord[] {
    return this.loadAll().filter(r => r.ownerId === userId);
  }

  listCountersByUserForList_b(userId: string): CounterRecordList[] {
    return this.loadAll().filter(r => r.ownerId === userId).map(r => ({
      id: r.id,
      ownerId: r.ownerId,
      title: r.title,
      type: r.type,
      leftValue: r.games?.filter(t => t.id === r.currentGameId)[0]?.leftValue,
      rightValue: r.games?.filter(t => t.id === r.currentGameId)[0]?.rightValue,
      gamesCount: r.games.length,
      leftName: r.leftName,
      rightName: r.rightName,
      currentGameId: r.currentGameId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    }));
  }

  listCountersByUserForList(counters$: Observable<CounterRecord[]>): CounterRecordList[] {
    return this.counters$ = this.counterSvc.getCountersByUser(uid).pipe(
      map(counters =>
        counters.map(c => ({
          id: c.id,
          title: c.title ?? 'Sin título',
          scoreText: `${c.scoreA ?? 0} - ${c.scoreB ?? 0}`
        }))
      )
    );
    return counters$.pipe(map(r => ({
      id: r.id,
      ownerId: r.ownerId,
      title: r.title,
      type: r.type,
      leftValue: r.games?.filter(t => t.id === r.currentGameId)[0]?.leftValue,
      rightValue: r.games?.filter(t => t.id === r.currentGameId)[0]?.rightValue,
      gamesCount: r.games.length,
      leftName: r.leftName,
      rightName: r.rightName,
      currentGameId: r.currentGameId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    })));
  }

  

  createGame(counterId: string, title = 'Set 1') {
    const counter = this.findCounterById(counterId);
    if (!counter) throw new Error('Counter not found');
    const now = new Date().toISOString();
    const game = {
      id: uuidv4(),
      title,
      leftValue: 0,
      rightValue: 0,
      createdAt: now,
      updatedAt: now
    };
    counter.games.push(game);
    counter.currentGameId = game.id; // Hacemos el nuevo juego el activo
    this.updateCounter(counter);
    return game;
  }

  // Elimina un juego
  removeGame(counterId: string, gameId: string): CounterRecord | null {
    const counter = this.findCounterById(counterId);
    if (!counter) return null;

    counter.games = counter.games.filter(g => g.id !== gameId);
    counter.updatedAt = new Date().toISOString();
    this.updateCounter(counter);
    return counter;
  }
  */

}
