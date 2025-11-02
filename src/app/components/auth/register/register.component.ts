import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [CommonModule, FormsModule],
})
export class RegisterComponent {
  email = '';
  name = '';
  password = '';
  error = '';
  emailError = '';
  emailValid = false;
  showPassword = false;

  constructor(
    private userSvc: UserService,
    private auth: AuthService,
    private router: Router
  ) {}

  validateEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.emailValid = emailRegex.test(this.email);
    this.emailError =
      this.email && !this.emailValid
        ? 'Introduce un correo electrónico válido'
        : '';
  }

  register() {
    this.error = '';
    this.emailError = '';

    if (!this.email || !this.name || !this.password) {
      this.error = 'Rellena todos los campos';
      return;
    }

    if (!this.emailValid) {
      this.error = 'Correo electrónico inválido';
      return;
    }

    if (this.password.length > 15) {
      this.error = 'Password máximo 15 caracteres';
      return;
    }

    try {
      const u = this.userSvc.create(this.email, this.name, this.password);
      if (!u) {
        this.error = 'El usuario ya existe';
        return;
      }

      // Auto login y redirección
      this.auth.login(this.email, this.password);
      this.router.navigate(['/app/list']);
    } catch (e: any) {
      this.error = e.message || 'Error al crear usuario';
    }
  }

  goBack() {
    this.router.navigate(['/login']);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}
