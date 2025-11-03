import { Injectable } from '@angular/core';
import { Auth, user, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _isAuthenticated$ = new BehaviorSubject<boolean>(false);
  public readonly isAuthenticated$ = this._isAuthenticated$.asObservable();

  private _isLoading$ = new BehaviorSubject<boolean>(true); // 👈 nuevo estado
  public readonly isLoading$ = this._isLoading$.asObservable();

  constructor(private auth: Auth) {
    // Observa los cambios de sesión
    user(this.auth).subscribe(u => {
      this._isAuthenticated$.next(!!u);
      this._isLoading$.next(false); // 👈 ya se resolvió Firebase
    });
  }

  /** 🔑 Registro nuevo usuario con email y contraseña */
  async register(email: string, password: string): Promise<User> {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    return { id: cred.user.uid, email: cred.user.email ?? '', password: '' };
  }

  /** 🔐 Login con email y contraseña */
  async login(email: string, password: string): Promise<User | null> {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    const u = cred.user;
    return { id: u.uid, email: u.email ?? '', password: '' };
  }

  /** 🔑 Login con Google */
  async loginWithGoogle(): Promise<User | null> {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(this.auth, provider);
    const u = cred.user;
    return { id: u.uid, email: u.email ?? '', password: '' };
  }

  /** 🚪 Logout */
  async logout(): Promise<void> {
    await signOut(this.auth);
    this._isAuthenticated$.next(false);
  }

  /** 👤 Usuario actual */
  currentUser(): User | null {
    const u = this.auth.currentUser;
    return u ? { id: u.uid, email: u.email ?? '', password: '' } : null;
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
}
