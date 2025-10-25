import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { StorageService } from '../../../services/storage.service';
import { UserService } from '../../../services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  standalone: true,
  imports: [CommonModule,
    FormsModule
  ]
})
export class ConfigComponent implements OnInit {
  user: any = {};
  appTitle = '';
  defaultCounterValue = 0;
  newName = '';
  newPassword = '';
  message = '';

  constructor(private auth: AuthService, private storage: StorageService, private userSvc: UserService) {}

  ngOnInit() {
    const u = this.auth.currentUser();
    if (!u) return;
    this.user = u;
    this.newName = u.name;

    const cfg = this.storage.get<any>('appConfig') || {};
    this.appTitle = cfg.appTitle || 'Mi App de Contadores';
    this.defaultCounterValue = cfg.defaultCounterValue || 0;
  }

  saveConfig() {
    this.storage.set('appConfig', { appTitle: this.appTitle, defaultCounterValue: this.defaultCounterValue });
    this.message = 'Configuración guardada.';
  }

  changeName() {
    if (!this.newName) return;
    this.user.name = this.newName;
    this.userSvc.update(this.user);
    this.message = 'Nombre actualizado.';
  }

  changePassword() {
    if (!this.newPassword || this.newPassword.length > 15) {
      this.message = 'Password inválido (máx 15 caracteres)';
      return;
    }
    this.user.password = this.newPassword;
    this.userSvc.update(this.user);
    this.message = 'Password actualizado.';
  }
}
