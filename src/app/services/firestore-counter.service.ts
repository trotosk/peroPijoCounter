import { Injectable } from '@angular/core';
import { Firestore, doc, docData, updateDoc, setDoc, getDoc, collection, where, query, collectionData, getDocs, orderBy, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { CounterRecord, CounterRecordList } from '../models/counter.model';

@Injectable({ providedIn: 'root' })
export class FirestoreCounterService {
  constructor(private firestore: Firestore) {}

  // 🔥 Escuchar un marcador en tiempo real
  watchCounter(id: string): Observable<CounterRecord | null> {
    const ref = doc(this.firestore, `counters/${id}`);
    return docData(ref, { idField: 'id' }) as Observable<CounterRecord | null>;
  }

  // 🔥 Crear o actualizar marcador
  async saveCounter(counter: CounterRecord) {
    const ref = doc(this.firestore, `counters/${counter.id}`);
    await setDoc(ref, counter, { merge: true });
  }

  // 🔥 Actualizar solo campos parciales (por ejemplo marcador)
  async updateCounter(id: string, data: Partial<CounterRecord>) {
    const ref = doc(this.firestore, `counters/${id}`);
    await updateDoc(ref, data);
  }


  async findCounterById(id: string): Promise<CounterRecord | null> {
    const ref = doc(this.firestore, `counters/${id}`);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as CounterRecord) : null;
  }

  // 🧠 NUEVO: Obtener todos los contadores del usuario actual
  getCountersByUser(userId: string): Observable<CounterRecord[]> {
    const colRef = collection(this.firestore, 'counters');
    const q = query(colRef, where('ownerId', '==', userId));
    return collectionData(q, { idField: 'id' }) as Observable<CounterRecord[]>;
  }

  // ✅ NUEVO: Obtener todos los contadores del usuario y transformarlos
  async getCountersViewByUser(userId: string): Promise<CounterRecordList[]> {
    const countersRef = collection(this.firestore, 'counters');
    const q = query(
        countersRef, 
        where('ownerId', '==', userId)
       ,orderBy('updatedAt', 'desc')
    );
    const snaps = await getDocs(q);

    const list: CounterRecordList[] = snaps.docs.map((d) => {
      const data = d.data() as CounterRecord;
      return {
        id: d.id,
        ownerId: data.ownerId,
        title: data.title,
        type: data.type,
        leftValue: data.games?.filter(t => t.id === data.currentGameId)[0]?.leftValue,
        rightValue: data.games?.filter(t => t.id === data.currentGameId)[0]?.rightValue,
        gamesCount: data.games.length,
        leftName: data.leftName,
        rightName: data.rightName,
        currentGameId: data.currentGameId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
    });

    return list;
  }

  // 🗑️ NUEVO: Eliminar contador por ID
  async deleteCounter(id: string): Promise<void> {
    const ref = doc(this.firestore, `counters/${id}`);
    await deleteDoc(ref);
  }

  async createCounterForUser(ownerId: string, title = 'Mi contador', type = 'general'): Promise<CounterRecord> {
    const now = new Date().toISOString();
    const rec: CounterRecord = {
        id: this.generateShortId(),
        ownerId,
        title,
        type,
        games: [],
        leftName: 'Local',
        rightName: 'Visitante',
        createdAt: now,
        updatedAt: now
      };

      //lo guardamos en Firestore
    this.saveCounter(rec);

    //Incluimos un juego al menos
    const game = await this.createGame(rec.id, 'Set 1');
    rec.games.push(game);
    return rec;
  }   

async createGame(counterId: string, title = 'Set 1') {
    const counter = await this.findCounterById(counterId);
    if (!counter) throw new Error('Counter not found');
    const now = new Date().toISOString();
    const game = {
      id: this.generateShortId(),
      title,
      leftValue: 0,
      rightValue: 0,
      createdAt: now,
      updatedAt: now
    };
    counter.games.push(game);
    counter.currentGameId = game.id; // Hacemos el nuevo juego el activo
    this.updateCounter(counterId,counter);
    return game;
  }

  generateShortId(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
  
}
