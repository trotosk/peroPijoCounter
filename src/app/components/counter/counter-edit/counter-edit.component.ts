import { Component, OnInit } from '@angular/core';
import { CounterService } from '../../../services/counter.service';
import { AuthService } from '../../../services/auth.service';
import { CounterRecord } from '../../../models/counter.model';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-counter-edit',
  templateUrl: './counter-edit.component.html',
  styleUrls: ['./counter-edit.component.scss'],
  imports: [CommonModule,
    FormsModule
  ]
})
export class CounterEditComponent implements OnInit {
  record: CounterRecord | null = null;
  idFromRoute: string | null = null;
  readOnly = false;
  type: string | null = null;

  constructor(
    private counterSvc: CounterService,
    private auth: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Si viene id por query param -> cargar (editar si es del user)
    const id = this.route.snapshot.queryParamMap.get('id');
    this.type = this.route.snapshot.queryParamMap.get('type');
    
    if (!id) {
      const cur = this.auth.currentUser();
      if (!cur) throw new Error('No user');
      this.record = this.counterSvc.createForUser(cur.id, this.type!);
    } else {
      const rec = this.counterSvc.findById(id);
      this.idFromRoute = id;
      if (!rec) {
        alert('ID no válido');
        return;
      }
      const cur = this.auth.currentUser();
      if (cur && rec.ownerId !== cur.id) {
        this.readOnly = true; // modo lectura
      }
      this.record = JSON.parse(JSON.stringify(rec)); // clon para edición local
    }
  }

  inc(side: 'left' | 'right') {
    if (!this.record || this.readOnly) return;
    const pair = side === 'left' ? this.record.left : this.record.right;
    pair.value = pair.value + 1;
    this.save();
  }

  dec(side: 'left' | 'right') {
    if (!this.record || this.readOnly) return;
    const pair = side === 'left' ? this.record.left : this.record.right;
    pair.value = Math.max(0, pair.value - 1);
    this.save();
  }

  reset() {
    if (!this.record || this.readOnly) return;
    this.record.left.value = 0;
    this.record.right.value = 0;
    this.save();
  }

  save() {
    if (!this.record) return;
    this.counterSvc.update(this.record);
  }
}
