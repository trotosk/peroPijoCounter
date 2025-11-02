import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-recover',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recover.component.html',
  styleUrls: ['./recover.component.scss']
})
export class RecoverComponent {
  email = '';
  message = '';
  toastMessage = '';
  toastType: 'success' | 'error' | null = null;

  constructor(private auth: AuthService, private router: Router) {}

  recover() {
    if (!this.email || !this.email.includes('@')) {
      this.showToast('Introduce un correo válido', 'error');
      this.message = 'El correo introducido no es válido.';
      return;
    }

    const userMail = this.auth.findUserByEmail?.(this.email); // Comprueba si existe el usuario
    if (!userMail || !userMail.ok) {
      this.showToast('El correo no existe en el sistema', 'error');
      this.message = 'No existe ningún usuario con ese correo.';
      return;
    }

    // Simulamos envío de correo con su contraseña
    this.showToast('📧 Servicio temporalmente fuera de servicio', 'error');
    this.message = 'El servicio de recuperación está temporalmente fuera de servicio.';
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
