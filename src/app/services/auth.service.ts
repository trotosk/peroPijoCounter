import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { User } from '../models/user.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  [x: string]: any;
  private storageKey = 'currentUserId';

  // observable para informacion del logado
  private _isAuthenticated$ = new BehaviorSubject<boolean>(this.isLoggedIn());
  public readonly isAuthenticated$ = this._isAuthenticated$.asObservable();

  constructor(private userService: UserService) {}

  login(email: string, password: string): User | null {
    const user = this.userService.findByEmail(email);
    if (!user) return null;
    if (user.password !== password) return null;
    localStorage.setItem(this.storageKey, user.id);
    this._isAuthenticated$.next(true); // notifica a todos los observadores
    return user;
  }

  // Verifica si estamos en navegador
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }

  // Cierra sesión
  logout() {
    if (this.isBrowser()) localStorage.removeItem(this.storageKey);
    this._isAuthenticated$.next(false); // notifica a todos los observadores
  }
  
  // Recupera el ID del usuario logueado
  currentUserId(): string | null {
    return this.isBrowser() ? localStorage.getItem(this.storageKey) : null;
  }

  // Recupera el usuario logueado
  currentUser(): User | null {
    const id = this.currentUserId();
    return id ? this.userService.findById(id) || null : null;
  }

  // Comprueba si hay un usuario logueado
  isLoggedIn(): boolean {
    return !!this.currentUserId();
  }

  /** ✅ Devuelve el estado actual sin necesidad de suscribirse */
  isAuthenticated(): boolean {
    return this._isAuthenticated$.value;
  }

  // Recuperar: por defecto abre mailto, y te dejo un punto para integrar un backend.
  sendRecovery(email: string): { ok: boolean; message: string } {
    const pw = this.userService.getPasswordByEmail(email);
    if (!pw) return { ok: false, message: 'Usuario no encontrado' };

    // Opción básica: abrir mailto (inseguro y depende del cliente)
    const subject = encodeURIComponent('Recuperación de contraseña');
    const body = encodeURIComponent(`Tu contraseña es: ${pw}`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;

    // Si tuvieras un backend, aquí harías una petición POST al endpoint de envio de correo.
    return { ok: true, message: 'Se abrió cliente de correo para enviar la contraseña.' };
  }

  // Recuperar: por defecto abre mailto, y te dejo un punto para integrar un backend.
  findUserByEmail(email: string): { ok: boolean; message: string } {
    const pw = this.userService.getPasswordByEmail(email);
    if (!pw) return { ok: false, message: 'Usuario no encontrado' };

    return { ok: true, message: 'Existe un usuario con ese correo.' };
  }
}
