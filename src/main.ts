import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { inject } from '@angular/core';
import { RouterAnalyticsService } from './app/services/router-analytics.service';

//const analyticsService = inject(RouterAnalyticsService); // ✅ fuerza instanciación

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
