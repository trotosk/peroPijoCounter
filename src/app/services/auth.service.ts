import { inject, Injectable } from '@angular/core';
import { Auth, user, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, fetchSignInMethodsForEmail } from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
//import { User } from '../models/user.model';
import { user as firebaseUser } from '@angular/fire/auth';
import { User } from '../models/user.model';
import { collection, getDocs, query, where } from '@angular/fire/firestore';
import { FirestoreUserService } from './firestore-user.service';
import { Analytics, logEvent } from '@angular/fire/analytics';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _isAuthenticated$ = new BehaviorSubject<boolean>(false);
  public readonly isAuthenticated$ = this._isAuthenticated$.asObservable();

  private _isLoading$ = new BehaviorSubject<boolean>(true); // 👈 nuevo estado
  public readonly isLoading$ = this._isLoading$.asObservable();
  analytics = inject(Analytics);

  constructor(private auth: Auth,
    private firestoreUserSvc: FirestoreUserService
  ) {
    // Observa los cambios de sesión
    user(this.auth).subscribe(u => {
      this._isAuthenticated$.next(!!u);
      this._isLoading$.next(false); // 👈 ya se resolvió Firebase
    });
  }

  /** 🔑 Registro nuevo usuario con email y contraseña */
  async register(email: string, password: string, nameUser: string): Promise<User> {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);

    // ✅ Creamos documento en Firestore
    await this.firestoreUserSvc.createUser(cred.user.uid, cred.user.email!, nameUser!);

    //ANalitycS
    logEvent(this.analytics, '_newUser: ' + cred.user.email );

    return { id: cred.user.uid, email: cred.user.email ?? '', password: '', name: nameUser ?? '', createdAt: new Date().toISOString() };
  }

  /** 🔐 Login con email y contraseña */
  async login(email: string, password: string): Promise<User | null> {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    const u = cred.user;
    return { id: u.uid, email: u.email ?? '', password: '', name: '', createdAt: '' };
  }

  /** 🔑 Login con Google */
  async loginWithGoogle(): Promise<User | null> {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(this.auth, provider);
    const u = cred.user;
    return { id: u.uid, email: u.email ?? '', password: '', name: '', createdAt: '' };
  }

  /** 🚪 Logout */
  async logout(): Promise<void> {
    await signOut(this.auth);
    this._isAuthenticated$.next(false);
  }

  /** 👤 Usuario actual */
  currentUser(): User | null {
    const u = this.auth.currentUser;
    return u ? { id: u.uid, email: u.email ?? '', password: '',  name: '', createdAt: '' } : null;
  }

  /** 🧠 ID del usuario actual */
  currentUserId(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  /** ✅ Estado actual (booleano) */
  isAuthenticated(): boolean {
    //console.log('AuthService.isAuthenticated:', this.auth.currentUser);
    return this.auth.currentUser ? true : false; 
  }

  isLoading(): boolean {
    return this._isLoading$.value;
  }
  
  /**
   * Verifica si un email está registrado en Firebase Authentication.
   * Devuelve true si el email existe, false si no.
   */
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const methods = await fetchSignInMethodsForEmail(this.auth, email);
      return methods.length > 0; // si tiene métodos, el email existe
    } catch (err: any) {
      // Si Firebase lanza error por formato inválido
      if (err.code === 'auth/invalid-email') {
        console.warn('Formato de email inválido.');
        return false;
      }
      console.error('Error comprobando email:', err);
      return false;
    }
  }
}
