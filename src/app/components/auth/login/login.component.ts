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

  login() {
    this.error = '';
    this.loading = true;

    setTimeout(() => {
      const user = this.auth.login(this.email, this.password);
      this.loading = false;

      if (!user) {
        this.error = '❌ El usuario no existe o la contraseña es incorrecta.';
        return;
      }

      this.router.navigate(['/app']);
    }, 1200); // simula una carga más realista
  }

  go(r: string) {
    this.router.navigate(['/', r]);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}
