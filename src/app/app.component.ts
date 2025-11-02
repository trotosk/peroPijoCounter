import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CreateCounterTypeDialogComponent } from './components/counter/create-counter-type-dialog/create-counter-type-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from './services/auth.service';
import { MenuItem } from './models/menu.model';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatDialogModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'peroPijoCounter';
  menuItems: MenuItem[] = [];
  private authSub?: Subscription;

  config: any; // Ver si hace falta
  counterService: any; // Ver si hace falta


  constructor(private dialog: MatDialog, private auth: AuthService, private router: Router) {}
  
  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
  }

  ngOnInit() {
    // 🔁 Se actualiza automáticamente cuando cambia el estado de login
    this.authSub = this.auth.isAuthenticated$.subscribe(() => {
      this.refreshMenu();
    });
    this.refreshMenu(); // inicial
  }

   /** 🔁 Genera dinámicamente el menú según estado del usuario */
  refreshMenu() {
    const isAuth = this.auth.isLoggedIn();

    this.menuItems = [
      {
        title: '🆕 Crear marcador nuevo',
        action: () => this.createCounter(),
        requiresAuth: true,
      },
      {
        title: '🔎 Tus marcadores',
        link: '/app/list',
        requiresAuth: true,
      },
      {
        title: '📂 Cargar marcador',
        link: '/open',
       // requiresAuth: true,
      },
      {
        title: '⚙️ Configuración',
        link: '/app/config',
        requiresAuth: true,
      },
      {
        title: '🔐 Iniciar sesión',
        link: '/login',
        hideWhenAuth: true,
      },
      {
        title: '🚪 Cerrar sesión',
        action: () => this.logout(),
        requiresAuth: true,
      },
    ].filter(item => {
      if (item.requiresAuth && !isAuth) return false;
      if (item.hideWhenAuth && isAuth) return false;
      return true;
    });
  }

  createCounter() {
    const dialogRef = this.dialog.open(CreateCounterTypeDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe((type: any) => {
      if (!type) return; // Cancelado

      const userId = this.auth.currentUserId()!;

      //this.router.navigate(['/app/create'], { queryParams: { type: type } }); //Ir a la pantalla de creacion
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate(['/app/create'], { queryParams: { type: type } });
      });

    });
  }

   logout() {
    this.auth.logout();
    this.refreshMenu(); // 🔁 actualiza menú dinámicamente
    this.router.navigate(['/login']);
  }
  
}


