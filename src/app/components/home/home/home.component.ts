import { Component } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterOutlet } from '@angular/router';
import { StorageService } from '../../../services/storage.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  imports: [RouterOutlet]
})
export class HomeComponent {
  appTitle = 'Mi App de Contadores'; // podría venir de configService
  userName = '';

  constructor(private auth: AuthService, private storage: StorageService, private router: Router) {
    const u = this.auth.currentUser();
    this.userName = u ? u.name : '';

    const cfg = this.storage.get<any>('appConfig') || {};
    this.appTitle = cfg.appTitle || 'Mi App de Contadores';
  
  }

  go(r: string) {
    this.router.navigate(['/app', r]);
  }
}
