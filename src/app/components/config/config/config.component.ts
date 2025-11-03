import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { StorageService } from '../../../services/storage.service';
import { UserService } from '../../../services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class ConfigComponent implements OnInit {
  user: any = {};
  newName = '';
  oldPassword = '';
  newPassword = '';
  toastMessage = '';
  toastType: 'success' | 'error' | '' = '';
  showPassword = false;

  constructor(
    private auth: AuthService,
    private storage: StorageService,
    private userSvc: UserService
  ) {}

  ngOnInit() {
    const u = this.auth.currentUser();
    if (!u) return;
    this.user = u;
    this.newName = u.email;
  }

  // ✅ Actualiza nombre
  changeName() {
    if (!this.newName.trim()) {
      this.showToast('El nombre no puede estar vacío', 'error');
      return;
    }

    this.user.name = this.newName;
    this.userSvc.update(this.user);
    this.showToast('Nombre actualizado correctamente', 'success');
  }

  // ✅ Actualiza contraseña
  changePassword() {
    if (!this.oldPassword || !this.newPassword) {
      this.showToast('Debes rellenar ambas contraseñas', 'error');
      return;
    }

    if (this.oldPassword !== this.user.password) {
      this.showToast('La contraseña antigua no coincide', 'error');
      return;
    }

    if (this.newPassword.length > 15) {
      this.showToast('La nueva contraseña no puede superar 15 caracteres', 'error');
      return;
    }

    this.user.password = this.newPassword;
    this.userSvc.update(this.user);
    this.oldPassword = '';
    this.newPassword = '';
    this.showToast('Contraseña actualizada correctamente', 'success');
  }

  // ✅ Toasts con auto cierre
  showToast(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.toastType = type;

    setTimeout(() => {
      this.toastMessage = '';
      this.toastType = '';
    }, 3000);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}
