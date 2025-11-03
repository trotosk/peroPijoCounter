import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { updateProfile, updatePassword, User as FirebaseUser } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class ConfigComponent implements OnInit {
  user: FirebaseUser | null = null;
  displayName = '';
  oldPassword = '';
  newPassword = '';
  toastMessage = '';
  toastType: 'success' | 'error' | '' = '';
  showPassword = false;

  constructor(private authSvc: AuthService, private firestore: Firestore) {}

  async ngOnInit() {
    const u = this.authSvc.currentUser();
    if (!u) return;

    this.user = this.authSvc['auth'].currentUser;
    this.displayName = this.user?.displayName ?? u.email ?? '';

    // Si quieres recuperar info extendida desde Firestore:
    const userDocRef = doc(this.firestore, `users/${u.id}`);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && data['displayName']) {
        this.displayName = data['displayName'];
      }
    }
  }

  /** ✅ Actualiza nombre (Auth + Firestore) */
  async changeName() {
    if (!this.displayName.trim()) {
      this.showToast('El nombre no puede estar vacío', 'error');
      return;
    }

    if (!this.user) return;

    try {
      await updateProfile(this.user, { displayName: this.displayName });

      // Guarda también en Firestore
      const userDocRef = doc(this.firestore, `users/${this.user.uid}`);
      await setDoc(userDocRef, { displayName: this.displayName, email: this.user.email }, { merge: true });

      this.showToast('Nombre actualizado correctamente', 'success');
    } catch (err) {
      console.error(err);
      this.showToast('Error al actualizar nombre', 'error');
    }
  }

  /** ✅ Actualiza contraseña */
  async changePassword() {
    if (!this.newPassword) {
      this.showToast('Debes introducir la nueva contraseña', 'error');
      return;
    }

    if (this.newPassword.length > 15) {
      this.showToast('La nueva contraseña no puede superar 15 caracteres', 'error');
      return;
    }

    if (!this.user) return;

    try {
      await updatePassword(this.user, this.newPassword);
      this.newPassword = '';
      this.showToast('Contraseña actualizada correctamente', 'success');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        this.showToast('Vuelve a iniciar sesión para cambiar la contraseña', 'error');
      } else {
        this.showToast('Error al actualizar contraseña', 'error');
      }
    }
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
