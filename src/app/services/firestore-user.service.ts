import { Injectable } from '@angular/core';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  docData,
  collection,
  collectionData,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class FirestoreUserService {
  constructor(private firestore: Firestore) {}

  /**
   * 🔥 Crea un documento de usuario en Firestore cuando se registra.
   * Si ya existe, lo sobreescribe parcialmente (merge).
   */
  async createUser(uid: string, email: string, name: string): Promise<void> {
    const ref = doc(this.firestore, `users/${uid}`);
    const userData: User = {
      id: uid,
      email,
      name,
      createdAt: new Date().toISOString(),
    };
    console.log('Creating user in Firestore:', userData);
    await setDoc(ref, userData, { merge: true });
  }

  /**
   * 🧩 Obtiene un usuario por su ID (UID de Firebase Auth)
   */
  async getUserById(uid: string): Promise<User | null> {
    const ref = doc(this.firestore, `users/${uid}`);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as User) : null;
  }

  /**
   * 🧩 Escucha en tiempo real los cambios de un usuario
   */
  watchUser(uid: string): Observable<User | null> {
    const ref = doc(this.firestore, `users/${uid}`);
    return docData(ref, { idField: 'id' }) as Observable<User | null>;
  }

  /**
   * 🧠 Devuelve todos los usuarios registrados (solo si lo necesitas en admin)
   */
  getAllUsers(): Observable<User[]> {
    const ref = collection(this.firestore, 'users');
    return collectionData(ref, { idField: 'id' }) as Observable<User[]>;
  }

  /**
   * ✏️ Actualiza los datos de un usuario
   */
  async updateUser(uid: string, data: Partial<User>): Promise<void> {
    const ref = doc(this.firestore, `users/${uid}`);
    await updateDoc(ref, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * 🗑️ Elimina un usuario de Firestore (no borra su cuenta en Firebase Auth)
   */
  async deleteUser(uid: string): Promise<void> {
    const ref = doc(this.firestore, `users/${uid}`);
    await deleteDoc(ref);
  }

  /**
   * 🔍 Obtiene un usuario por su email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('email', '==', email.toLowerCase()));
    const snaps = await getDocs(q);
    if (snaps.empty) return null;
    const docSnap = snaps.docs[0];
    return (docSnap.data() as User);
  }
}
