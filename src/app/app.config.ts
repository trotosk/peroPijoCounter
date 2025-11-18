// src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';

// Firebase imports
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { environment } from '../environments/environment';
import { provideAnalytics, getAnalytics } from '@angular/fire/analytics';
import { RouterAnalyticsService } from './services/router-analytics.service';


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideAnimations(), // 👈 Esto habilita las animaciones

    // Firebase providers
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    //provideAnalytics(() => getAnalytics()),
    provideAnalytics(() => {
      if (typeof window !== 'undefined') {
        return getAnalytics();
      }
      return null as any; // ❌ evita que devuelva null inesperado
    }),
    // Tracking automático de pantallas
    RouterAnalyticsService,
    //ScreenTrackingService,
    
    provideAuth(() => getAuth()),
  ]
};

