import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private storageKey = 'currentUserId';

  constructor(private userService: UserService) {}

  login(email: string, password: string): User | null {
    const user = this.userService.findByEmail(email);
    if (!user) return null;
    if (user.password !== password) return null;
    localStorage.setItem(this.storageKey, user.id);
    return user;
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }

  logout() {
    if (this.isBrowser()) localStorage.removeItem(this.storageKey);
  }

  currentUserId(): string | null {
    return this.isBrowser() ? localStorage.getItem(this.storageKey) : null;
  }

  currentUser(): User | null {
    const id = this.currentUserId();
    return id ? this.userService.findById(id) || null : null;
  }

  isLoggedIn(): boolean {
    return !!this.currentUserId();
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
}
