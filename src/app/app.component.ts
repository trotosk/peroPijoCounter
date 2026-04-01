import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CreateCounterTypeDialogComponent } from './components/counter/create-counter-type-dialog/create-counter-type-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from './services/auth.service';
import { MenuItem } from './models/menu.model';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { RouterAnalyticsService } from './services/router-analytics.service';
import { Meta, Title } from '@angular/platform-browser';

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
  private analytics = inject(RouterAnalyticsService);

  constructor(private dialog: MatDialog, 
    public auth: AuthService, 
    private router: Router,
    private title_: Title, 
    private meta: Meta) {}
  
  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
  }

  ngOnInit() {
    // 🔁 Se actualiza automáticamente cuando cambia el estado de login
    this.authSub = this.auth.isAuthenticated$.subscribe(() => {
      this.refreshMenu();
    });
    this.refreshMenu(); // inicial

    this.title_.setTitle(this.title);
    this.meta.updateTag({ name: 'description', content: 'Sigue en directo y gratis el marcador de partidos amateur o infantiles. Actualiza el resultado y compártelo con padres, familiares o amigos para que todos sigan el partido en tiempo real, estén donde estén.' });
  }

   /** 🔁 Genera dinámicamente el menú según estado del usuario */
  refreshMenu() {
    const isAuth = this.auth.isAuthenticated();

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

    dialogRef.afterClosed().subscribe((result: { type: string; category: string } | null) => {
      if (!result) return; // Cancelado

      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate(['/app/create'], { queryParams: { type: result.type, category: result.category } });
      });
    });
  }

   logout() {
    this.auth.logout();
    this.refreshMenu(); // 🔁 actualiza menú dinámicamente
    this.router.navigate(['/login']);
  }
  
}


