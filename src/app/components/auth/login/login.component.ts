import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  imports: [CommonModule,
    FormsModule
  ]
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  login() {
    this.error = '';
    const u = this.auth.login(this.email, this.password);
    if (!u) {
      this.error = 'Email o password incorrecto';
      return;
    }
    this.router.navigate(['/app']);
  }

   go(r: string) {
    this.router.navigate(['/', r]);
  }
}

