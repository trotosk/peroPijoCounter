// counter-permissions.component.ts

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FirestoreCounterService } from '../../../services/firestore-counter.service';
import { CounterRecord, AuthorizedUser } from '../../../models/counter.model';
import { User } from '../../../models/user.model';
import { AuthService } from '../../../services/auth.service';
import { getDoc, doc, Firestore } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FirestoreUserService } from '../../../services/firestore-user.service';

@Component({
  selector: 'app-counter-permissions',
  templateUrl: './counter-permissions.component.html',
  styleUrls: ['./counter-permissions.component.scss'],
  imports: [CommonModule,
    FormsModule, MatIconModule,RouterModule,MatSnackBarModule,]
})
export class CounterPermissionsComponent implements OnInit {
  counter!: CounterRecord | null;
  counterId!: string;
  currentUser!: User | null;
  isOwner = false;
  loading = true;
  showAddModal = false;
  newUserEmail = '';
  toastMessage: string | null = null;
  userToDelete: AuthorizedUser | null = null;

  // paginación
  page = 1;
  pageSize = 5;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestore: Firestore,
    private counterService: FirestoreCounterService,
    private authService: AuthService,
    private firestoreUserSvc: FirestoreUserService
  ) {}

  async ngOnInit() {
    this.counterId = this.route.snapshot.queryParamMap.get('id')!; 
    this.currentUser = await this.authService.currentUser();
    await this.loadCounter();

    // validar propiedad
    this.isOwner = this.currentUser?.id === this.counter?.ownerId;
    if (!this.isOwner) {
      this.showToast('Solo el propietario puede gestionar los permisos.');
      this.router.navigate(['/']);
      return;
    }
  }

  /**
   * Cargar datos del marcador desde Firestore
   */
  async loadCounter() {
    //const docRef = doc(this.firestore, 'counters', this.counterId);
    //const snap = await getDoc(docRef);
    this.counter = await this.counterService.findCounterById(this.counterId);
    this.loading = false;
  }

  /**
   * Abrir modal para añadir usuario
   */
  openAddModal() {
    this.newUserEmail = '';
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  /**
   * Añadir usuario autorizado con permiso de edición
   */
  /*
  async addAuthorizedUser() {
    if (!this.newUserEmail.trim()) {
      this.showToast('Introduce un correo electrónico.');
      return;
    }

    try {
      const foundUser = await this.firestoreUserSvc.getUserByEmail(this.newUserEmail.trim());
      //this.counterService.validateUserByEmail(this.newUserEmail.trim());

      if (!foundUser) {
        this.showToast('No se encontró un usuario con ese correo.');
        return;
      }

      const alreadyExists = this.counter?.authorizedUsers?.some(u => u.userId === foundUser.id);
      if (alreadyExists) {
        this.showToast('Este usuario ya está autorizado.');
        return;
      }

      const newAuth: AuthorizedUser = {
        userId: foundUser.id!,
        email: foundUser.email,
        permission: 'E' // siempre edición
      };

      await this.counterService.addAuthorizedUser(this.counterId, newAuth);
      this.counter!.authorizedUsers = [...(this.counter?.authorizedUsers || []), newAuth];
      this.showToast(`Permiso otorgado a ${foundUser.email}`);
      this.closeAddModal();
    } catch (err) {
      console.error(err);
      this.showToast('Error al añadir usuario.');
    }
  }
*/

  async addAuthorizedUser() {
    const email = this.newUserEmail.trim();

    if (!email) {
      this.showToast('Introduce un correo electrónico.');
      return;
    }

    // No permitir propietario
    if (email === this.currentUser?.email) {
      this.showToast('No puedes añadirte a ti mismo como autorizado.');
      return;
    }

    try {
      const foundUser = await this.firestoreUserSvc.getUserByEmail(email);

      if (!foundUser) {
        this.showToast('No se encontró un usuario con ese correo.');
        return;
      }

      // No permitir duplicados
      const exists = this.counter?.authorizedUsers?.some(u => u.userId === foundUser.id);

      if (exists) {
        this.showToast('Este usuario ya está autorizado.');
        return;
      }

      const newAuth: AuthorizedUser = {
        userId: foundUser.id!,
        email: foundUser.email,
        permission: 'E'
      };

      await this.counterService.addAuthorizedUser(this.counterId, newAuth);

      this.counter!.authorizedUsers = [...(this.counter?.authorizedUsers || []), newAuth];

      this.showToast(`Permiso otorgado a ${foundUser.email}`);
      this.closeAddModal();

    } catch (err) {
      console.error(err);
      this.showToast('Error al añadir usuario.');
    }
  }

  /**
   * Eliminar usuario autorizado (confirmación)
   */
  /*
  async removeAuthorizedUser(user: AuthorizedUser) {
    const confirmed = confirm(`¿Eliminar permiso para ${user.email}?`);
    if (!confirmed) return;

    try {
      await this.counterService.removeAuthorizedUser(this.counterId, user);
      this.counter!.authorizedUsers = this.counter?.authorizedUsers?.filter(u => u.userId !== user.userId);
      this.showToast(`Permiso eliminado para ${user.email}`);
    } catch {
      this.showToast('Error al eliminar usuario.');
    }
  }
    */
   async removeAuthorizedUser(user: AuthorizedUser) {
    this.userToDelete = user;
  }

  /**
   * Volver a la pantalla anterior
   */
  goBack() {
    this.router.navigate(['/app/create'], { queryParams: { id: this.counterId } });
  }

  showToast(message: string) {
    this.toastMessage = message;
    setTimeout(() => this.toastMessage = null, 2500);
  }

  async confirmDelete() {
    if (!this.userToDelete) return;

    try {
      await this.counterService.removeAuthorizedUser(this.counterId, this.userToDelete);
      this.counter!.authorizedUsers = this.counter!.authorizedUsers!.filter(
        u => u.userId !== this.userToDelete!.userId
      );
      this.showToast(`Permiso eliminado para ${this.userToDelete.email}`);
    } catch {
      this.showToast('Error al eliminar usuario.');
    }

    this.userToDelete = null;
  }

  cancelDelete() {
    this.userToDelete = null;
  }
}
