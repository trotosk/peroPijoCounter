import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { CounterRecord } from '../models/counter.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class CounterService {
  private key = 'counters';

  constructor(private storage: StorageService) {}

  private loadAll(): CounterRecord[] {
    return this.storage.get<CounterRecord[]>(this.key) || [];
  }
  private saveAll(items: CounterRecord[]) {
    this.storage.set(this.key, items);
  }

  createForUser(ownerId: string, title = 'Mi contador'): CounterRecord {
    const now = new Date().toISOString();
    const rec: CounterRecord = {
      id: uuidv4(),
      ownerId,
      title,
      left: { name: 'Left', value: 0 },
      right: { name: 'Right', value: 0 },
      createdAt: now,
      updatedAt: now
    };
    const arr = this.loadAll();
    arr.push(rec);
    this.saveAll(arr);
    return rec;
  }

  update(rec: CounterRecord) {
    const arr = this.loadAll();
    const idx = arr.findIndex(r => r.id === rec.id);
    if (idx === -1) throw new Error('No encontrado');
    rec.updatedAt = new Date().toISOString();
    arr[idx] = rec;
    this.saveAll(arr);
  }

  remove(rec: CounterRecord) {
    const arr = this.loadAll();
    const idx = arr.findIndex(r => r.id === rec.id);
    if (idx === -1) throw new Error('No encontrado');
    rec.updatedAt = new Date().toISOString();
    arr.splice(idx, 1);
    this.saveAll(arr);
  }

  findById(id: string): CounterRecord | undefined {
    return this.loadAll().find(r => r.id === id);
  }

  listByUser(userId: string): CounterRecord[] {
    return this.loadAll().filter(r => r.ownerId === userId);
  }
}
