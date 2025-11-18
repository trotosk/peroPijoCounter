import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { AuthService } from '../../../services/auth.service';
import { CounterRecord, CounterRecordList } from '../../../models/counter.model';
import { Observable } from 'rxjs';
import { FirestoreCounterService } from '../../../services/firestore-counter.service';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-counter-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatMenuModule 
  ],
  templateUrl: './counter-list.component.html',
  styleUrls: ['./counter-list.component.scss']
})
export class CounterListComponent implements OnInit {
  displayedColumns: string[] = [
    'id',
    'createdAt',
    'updatedAt',
    'leftName',
    'rightName',
    'sets',
    'actions'
  ];
  dataSource = new MatTableDataSource<CounterRecordList>([]);
  originalData: CounterRecordList[] = [];

  searchId = '';
  startDate: Date | null = null;
  endDate: Date | null = null;
  counters$!: Observable<CounterRecord[]>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  actionOptions = [
    {
      id: 'load',
      label: 'Cargar',
      icon: 'upload',
      internalRoute: '/app/create'
    },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: 'delete',
    },
    {
      id: 'permissions',
      label: 'Gestión de permisos a terceros',
      icon: 'admin_panel_settings',
      internalRoute: '/app/permissions'
    }
  ];

  // Segunda tabla
  authorizedDataSource = new MatTableDataSource<CounterRecordList>([]);
  authorizedDisplayed = ['id', 'createdAt', 'updatedAt', 'leftName', 'rightName', 'sets', 'actions'];
  authorizedColumns = ['id', 'createdAt', 'updatedAt', 'leftName', 'rightName', 'sets'];
  showDeleteConfirm = false;
  rowDelete: CounterRecordList | null = null;

  constructor(
    private auth: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private counterfireStore: FirestoreCounterService
  ) {}

  async ngOnInit() {
    const user = this.auth.currentUser();
    if (!user) return;

    const counters = await this.counterfireStore.getCountersViewByUser(user.id);

    this.dataSource.data = counters;
    this.originalData = counters;

    // Cargar marcadores autorizados
    this.authorizedDataSource.data = await this.counterfireStore.getAuthorizedCounters(user.id);
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter() {
    this.dataSource.data = this.originalData.filter((item) => {
      const idMatch = this.searchId
        ? item.id.toLowerCase().includes(this.searchId.toLowerCase())
        : true;

      const startOk = this.startDate
        ? new Date(item.createdAt) >= this.startDate ||
          new Date(item.updatedAt) >= this.startDate
        : true;

      const endOk = this.endDate
        ? new Date(item.createdAt) <= this.endDate ||
          new Date(item.updatedAt) <= this.endDate
        : true;

      return idMatch && startOk && endOk;
    });
  }

  resetFilters() {
    this.searchId = '';
    this.startDate = null;
    this.endDate = null;
    this.dataSource.data = this.originalData;
  }

  copyId(id: string) {
    navigator.clipboard.writeText(id);
    this.snackBar.open('📋 ID copiado al portapapeles', 'Cerrar', {
      duration: 2000,
      panelClass: ['info-toast']
    });
  }

  copyCurrentUrl(id: string) {
    const url = `${window.location.origin}/app/create?id=${id}`;
    navigator.clipboard.writeText(url)
      .then(() => this.snackBar.open('📋 URL copiado al portapapeles', 'Cerrar', {
      duration: 2000,
      panelClass: ['info-toast']
      })).catch(() => alert('❌ No se pudo copiar el enlace'));
  }


  edit(counter: CounterRecordList) {
    this.router.navigate(['/app/create'], { queryParams: { id: counter.id } });
  }

  /*
  async eliminar(counter: CounterRecordList) {
    const confirmDelete = confirm(
      `¿Seguro que quieres eliminar el marcador "${counter.leftName} vs ${counter.rightName}"?`
    );
    if (confirmDelete) {

      try {
        await this.counterfireStore.deleteCounter(counter.id);
        this.snackBar.open('🗑️ Marcador eliminado correctamente', 'Cerrar', {
          duration: 2000,
          panelClass: ['success-toast']
        });
        this.ngOnInit();
      } catch (err) {
        console.error('Error al eliminar contador:', err);
        alert('No se pudo eliminar el contador.');
      }
    }
  }
    */

  async eliminar(counter: CounterRecordList) {
    this.rowDelete = counter;
    this.showDeleteConfirm = true;
  }

  async confirmDelete() {
    if (!this.rowDelete) return;
    try {
        await this.counterfireStore.deleteCounter(this.rowDelete.id);
        this.snackBar.open('🗑️ Marcador eliminado correctamente', 'Cerrar', {
          duration: 2000,
          panelClass: ['success-toast']
        });
        this.ngOnInit();
      } catch (err) {
        console.error('Error al eliminar contador:', err);
        alert('No se pudo eliminar el contador.');
      }
      this.showDeleteConfirm = false;
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  }

  executeAction(action: any, row: CounterRecordList) {
    if (action.id === 'load') {
      return this.edit(row);
    }

    if (action.id === 'delete') {
      return this.eliminar(row);
    }

    if (action.internalRoute) {
      // Navegación interna
      return this.router.navigate([action.internalRoute], {
        queryParams: { id: row.id }
      });
    }

    if (action.externalUrl) {
      // Navegación externa
      return window.open(action.externalUrl, '_blank');
    }
  }
}
