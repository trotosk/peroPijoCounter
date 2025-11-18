import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule, FormsModule],
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  loading = false;
  showPassword = false;

  constructor(private auth: AuthService, private router: Router) {}

  async login() {
    this.error = '';
    this.loading = true;

    try {
      const user = await this.auth.login(this.email, this.password);
      this.loading = false;

      if (!user) {
        this.error = '❌ El usuario no existe o la contraseña es incorrecta.';
        return;
      }

      this.router.navigate(['/app/list']); // redirige al listado o panel principal
    } catch (err: any) {
      this.loading = false;
      if (err.message.includes('auth/invalid-credential') || err.message.includes('auth/user-not-found') || err.message.includes('auth/wrong-password') || err.message.includes('auth/invalid-email')) {
        this.error = '❌ El usuario no existe o la contraseña es incorrecta.';
      }
      else{
        //this.error = err.message || 'Error al iniciar sesión.';
        this.error = '❌ Error al iniciar sesión. Revisa tu conexión e inténtalo de nuevo.';
      }
      
    }
  }

  async loginWithGoogle() {
    this.error = '';
    this.loading = true;
    try {
      const user = await this.auth.loginWithGoogle();
      this.loading = false;
      if (!user) {
        this.error = 'No se pudo iniciar sesión con Google.';
        return;
      }
      this.router.navigate(['/app/list']);
    } catch (err: any) {
      this.loading = false;
      this.error = err.message || 'Error al iniciar sesión con Google.';
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  go(r: string) {
    this.router.navigate(['/', r]);
  }
}
