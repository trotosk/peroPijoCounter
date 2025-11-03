import { Injectable } from '@angular/core';
import { Firestore, doc, docData, updateDoc, setDoc, getDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { CounterRecord } from '../models/counter.model';

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
}
