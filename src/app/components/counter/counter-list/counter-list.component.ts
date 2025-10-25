import { Component, OnInit } from '@angular/core';
import { CounterService } from '../../../services/counter.service';
import { AuthService } from '../../../services/auth.service';
import { CounterRecord } from '../../../models/counter.model';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-counter-list',
  templateUrl: './counter-list.component.html',
  imports: [CommonModule,
    FormsModule
  ]
})
export class CounterListComponent implements OnInit {
  counters: CounterRecord[] = [];

  constructor(
    private counterSvc: CounterService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const user = this.auth.currentUser();
    if (!user) return;
    this.counters = this.counterSvc.listByUser(user.id);
  }

  edit(counter: CounterRecord) {
    // Navega a la pantalla de edición pasando ID como query param
    this.router.navigate(['/app/create'], { queryParams: { id: counter.id } });
  }

  eliminar(counter: CounterRecord) {
    // Eliminamos esa posicion y recargamos el listado
    this.counterSvc.remove(counter);
    this.ngOnInit();
  }
}
