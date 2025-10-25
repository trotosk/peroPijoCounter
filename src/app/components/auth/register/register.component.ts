import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  imports: [CommonModule,
    FormsModule
  ]
})
export class RegisterComponent {
  email = '';
  name = '';
  password = '';
  error = '';

  constructor(private userSvc: UserService, private auth: AuthService, private router: Router) {}

  register() {
    try {
      if (!this.email || !this.name || !this.password) {
        this.error = 'Rellena todos los campos';
        return;
      }
      if (this.password.length > 15) {
        this.error = 'Password máximo 15 caracteres';
        return;
      }
      const u = this.userSvc.create(this.email, this.name, this.password);
      // auto login
      this.auth.login(this.email, this.password);
      this.router.navigate(['/app']);
    } catch (e: any) {
      this.error = e.message || 'Error';
    }
  }
}
