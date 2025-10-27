import { Component, OnInit } from '@angular/core';
import { CounterService } from '../../../services/counter.service';
import { AuthService } from '../../../services/auth.service';
import { CounterRecord, CounterRecordList } from '../../../models/counter.model';
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
  counters: CounterRecordList[] = [];

  constructor(
    private counterSvc: CounterService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const user = this.auth.currentUser();
    if (!user) return;
    this.counters = this.counterSvc.listCountersByUserForList(user.id);
  }

  edit(counter: CounterRecordList) {
    // Navega a la pantalla de edición pasando ID como query param
    this.router.navigate(['/app/create'], { queryParams: { id: counter.id } });
  }

  eliminar(counter: CounterRecordList) {
    // Eliminamos esa posicion y recargamos el listado
    this.counterSvc.removeCounter(counter.id);
    this.ngOnInit();
  }
}
