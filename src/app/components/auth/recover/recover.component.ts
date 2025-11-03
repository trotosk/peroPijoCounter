import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-recover',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recover.component.html',
  styleUrls: ['./recover.component.scss']
})
export class RecoverComponent {
  email = '';
  toastMessage = '';
  message = '';
  toastType: 'success' | 'error' | null = null;
  loading = false;

  constructor(private authService: AuthService, private auth: Auth, private router: Router) {}

  async recover() {
    if (!this.email || !this.email.includes('@')) {
      this.showToast('Introduce un correo válido', 'error');
      this.message = 'El correo introducido no es válido.';
      return;
    }

    this.loading = true;
    try {
      await sendPasswordResetEmail(this.auth, this.email);
      this.showToast('📧 Se ha enviado un correo de recuperación', 'success');
      this.loading = false;
    } catch (err: any) {
      this.loading = false;
      this.showToast(err.message || 'Error enviando correo de recuperación', 'error');
      this.message = 'No existe ningún usuario con ese correo o el servicio de recuperación está temporalmente fuera de servicio. Inténtalo más tarde.';
    }
  }

  goBack() {
    this.router.navigate(['/login']);
  }

  showToast(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = '';
      this.toastType = null;
    }, 3000);
  }
}
