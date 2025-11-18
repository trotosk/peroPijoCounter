import { Component } from '@angular/core';
import { Router } from '@angular/router';
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
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  validateEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.emailValid = emailRegex.test(this.email);
    this.emailError =
      this.email && !this.emailValid
        ? 'Introduce un correo electrónico válido'
        : '';
  }

  async register() {
    this.error = '';
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

    this.loading = true;

    try {
      const user = await this.auth.register(this.email, this.password, this.name);
      this.loading = false;

      if (!user) {
        this.error = 'No se pudo registrar el usuario';
        return;
      }

      // Redirige automáticamente al login o a la app
      this.router.navigate(['/app/list']);
    } catch (err: any) {
      this.loading = false;
      this.error = err.message || 'Error al registrar usuario.';
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  goBack() {
    this.router.navigate(['/login']);
  }
}
