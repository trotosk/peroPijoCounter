import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { updateProfile, updatePassword, User as FirebaseUser } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { WhatsappService } from '../../../services/whatsapp.service';

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

  // Green API
  greenApiInstanceId = '';
  greenApiToken = '';
  greenApiSaved = false;
  showGreenApiHelp = false;
  greenApiTesting = false;

  constructor(
    private authSvc: AuthService,
    private firestore: Firestore,
    private whatsappSvc: WhatsappService,
  ) {}

  async ngOnInit() {
    const u = this.authSvc.currentUser();
    if (!u) return;

    this.user = this.authSvc['auth'].currentUser;
    this.displayName = this.user?.displayName ?? u.email ?? '';

    const userDocRef = doc(this.firestore, `users/${u.id}`);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data['displayName'])        this.displayName        = data['displayName'];
      if (data['greenApiInstanceId']) this.greenApiInstanceId = data['greenApiInstanceId'];
      if (data['greenApiToken'])      this.greenApiToken      = data['greenApiToken'];
      this.greenApiSaved = !!(this.greenApiInstanceId && this.greenApiToken);
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

  // ─── Green API ────────────────────────────────────────────────────────────────

  async saveGreenApi() {
    const u = this.authSvc.currentUser();
    if (!u) return;
    if (!this.greenApiInstanceId.trim() || !this.greenApiToken.trim()) {
      this.showToast('Introduce el Instance ID y el Token', 'error');
      return;
    }
    const ref = doc(this.firestore, `users/${u.id}`);
    await setDoc(ref, {
      greenApiInstanceId: this.greenApiInstanceId.trim(),
      greenApiToken: this.greenApiToken.trim(),
    }, { merge: true });
    this.greenApiSaved = true;
    this.showToast('Credenciales de WhatsApp guardadas', 'success');
  }

  async testGreenApi() {
    if (!this.greenApiInstanceId || !this.greenApiToken) return;
    this.greenApiTesting = true;
    try {
      const chats = await this.whatsappSvc.getChats(this.greenApiInstanceId, this.greenApiToken);
      this.showToast(`✅ Conexión OK — ${chats.length} chats encontrados`, 'success');
    } catch {
      this.showToast('❌ Error de conexión. Revisa el Instance ID y el Token', 'error');
    } finally {
      this.greenApiTesting = false;
    }
  }
}
