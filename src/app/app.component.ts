import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CreateCounterTypeDialogComponent } from './components/counter/create-counter-type-dialog/create-counter-type-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatDialogModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'peroPijoCounter';

  config: any;
  counterService: any;


  constructor(private dialog: MatDialog, private auth: AuthService, private router: Router) {}

  createCounter() {
    const dialogRef = this.dialog.open(CreateCounterTypeDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe((type: any) => {
      if (!type) return; // Cancelado

      const userId = this.auth.currentUserId()!;
/*
      // Crear el contador según tipo seleccionado
      const cfg = this.config.getConfig();
      const userId = this.auth.currentUserId()!;
      const counter = this.counterService.createCounter(
        userId,
        cfg.defaultCounterLeftName,
        cfg.defaultCounterRightName,
        cfg.defaultInitialValue
      );
*/
      // Podrías guardar el tipo en el objeto también si lo agregas al modelo
      // counter.type = type;

      //this.router.navigate(['/app/create']); // ir a pantalla de edición
      this.router.navigate(['/app/create'], { queryParams: { type: type } }); //Ir a la pantalla de creacion

    });
  }
  
}


