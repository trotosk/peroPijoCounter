import { Router, NavigationEnd } from '@angular/router';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Analytics, getAnalytics, logEvent } from '@angular/fire/analytics';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class RouterAnalyticsService {
  private router = inject(Router);
  private analytics = inject(Analytics, { optional: true }); // puede ser null
  private platformId = inject(PLATFORM_ID);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return; // solo navegador
    
    // inicializa Firebase Analytics aquí
    this.analytics = getAnalytics();

    if (!this.analytics) {
      console.warn('Analytics no disponible en este entorno');
      return;
    }

    console.log("RouterAnalyticsService inicializado");
    setTimeout(() => { // esperar a que Angular hidrate
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd && this.analytics) {
          logEvent(this.analytics, 'pag. nav.: ' + event.urlAfterRedirects, {
            page_path: event.urlAfterRedirects
          });
          console.log('Logged page_view for ', event.urlAfterRedirects);
        }
      });
    }); // retraso para evitar conflictos con SSR
  }
}
