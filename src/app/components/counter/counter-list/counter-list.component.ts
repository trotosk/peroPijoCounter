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
    'actions',
    'leftName',
    'rightName',
    'category',
    'state',
    'isPublic',
    'gamesCount',
    'createdAt',
    'updatedAt',
    'id'
  ];

  authorizedDisplayed: string[] = [
    'actions',
    'leftName',
    'rightName',
    'category',
    'state',
    'isPublic',
    'gamesCount',
    'createdAt',
    'updatedAt',
    'id'
  ];
  dataSource = new MatTableDataSource<CounterRecordList>([]);
  originalData: CounterRecordList[] = [];
    columnHeaders: { [key: string]: string } = {
    id: 'ID',
    isFinished: 'Estado',
    isPublic: 'Visibilidad',
    createdAt: 'Creado',
    updatedAt: 'Última Modificación',
    leftName: 'Local',
    rightName: 'Visitante',
    gamesCount: 'Sets',
    category: 'Categoría',
  };
  // ---------------------------------------------------------
  // Para la tabla autorizados mantenemos las mismas columnas
  authorizedColumns = [
    //'actions',
    'leftName',
    'rightName',
    'state',
    'isPublic',
    'gamesCount',
    'createdAt',
    'updatedAt',
    'id'
  ];

  // Guarda el id del usuario actual para condicionar opciones del menú
  currentUserId: string | null = null;
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
    this.currentUserId = user.id;

    await this.loadData();
  }

  // Carga/recarga los datos para ambas tablas
  private async loadData() {
    const user = this.auth.currentUser();
    if (!user) return;

    // Cargar tus marcadores
    const counters = await this.counterfireStore.getCountersViewByUser(user.id);
    // Asignar las opciones a cada elemento
    this.dataSource.data = counters.map(c => ({
      ...c,
      actionOptions: this.buildActionOptions(c, c.ownerId === user.id)
    }));
    this.originalData = counters;

    // Cargar marcadores autorizados
    const authorized = await this.counterfireStore.getAuthorizedCounters(user.id);
    this.authorizedDataSource.data = authorized.map(c => ({
      ...c,
      actionOptions: this.buildActionOptions(c, false) // no es owner
    }));
    // refrescar paginador/orden si ya existen
    if (this.paginator) this.dataSource.paginator = this.paginator;
    if (this.sort) this.dataSource.sort = this.sort;
  }

  async togglePublic(row: CounterRecordList) {
    try {
      const newVal = !row.isPublic;
      await this.counterfireStore.updateCounter(row.id, {
        isPublic: newVal,
        updatedAt: new Date().toISOString()
      });
      this.snackBar.open(
        `🔁 Marcador ahora ${newVal ? 'Público' : 'Privado'}`,
        'Cerrar',
        { duration: 2000, panelClass: ['success-toast'] }
      );
      await this.loadData(); // refrescar tabla
    } catch (err) {
      console.error('Error toggling public:', err);
      alert('No se pudo cambiar la visibilidad.');
    }
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

  range(n: number): number[] {
    return Array(n || 0).fill(0);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  }

  executeAction(action: any, row: CounterRecordList) {
    console.log('Ejecutando acción:', action, 'en fila:', row);
    if (action.id === 'load') return this.edit(row);
    if (action.id === 'delete') return this.eliminar(row);
    if (action.id === 'toggleVisibility') return this.togglePublic(row);
    if (action.id === 'copyId') return this.copyId(row.id);
    if (action.id === 'copyUrl') return this.copyCurrentUrl(row.id);
    if (action.internalRoute) {
      return this.router.navigate([action.internalRoute], { queryParams: { id: row.id } });
    }
    if (action.externalUrl) return window.open(action.externalUrl, '_blank');
  }
/*
  getActionOptions(row: CounterRecordList, isOwner: boolean) {
    const options = [];

    // Cargar siempre
    options.push({ id: 'load', label: 'Cargar', icon: 'upload', internalRoute: '/app/create' });

    if (isOwner) {
      // Cambiar público/privado
      options.push({ id: 'togglePublic', label: row.isPublic ? 'Hacer privado' : 'Hacer público', icon: 'visibility' });

      // Eliminar
      options.push({ id: 'delete', label: 'Eliminar', icon: 'delete' });

      // Gestión de permisos
      options.push({ id: 'permissions', label: 'Gestión de permisos a terceros', icon: 'admin_panel_settings', internalRoute: '/app/permissions' });
    }

    // Copiar ID y URL siempre al final
    options.push({ id: 'copyId', label: 'Copiar ID', icon: 'content_copy' });
    options.push({ id: 'copyUrl', label: 'Copiar URL', icon: 'link' });

    return options;
  }
  */

  private buildActionOptions(row: CounterRecordList, isOwner: boolean) {
  const options = [];

    // Cargar siempre
    options.push({ id: 'load', label: 'Cargar', icon: 'upload', internalRoute: '/app/create' });
    if (isOwner) {
      options.push({ id: 'toggleVisibility', label: row.isPublic ? 'Hacer privado' : 'Hacer público', icon: 'visibility' });
      options.push({ id: 'delete', label: 'Eliminar', icon: 'delete' });
      options.push({ id: 'permissions', label: 'Gestión de permisos a terceros', icon: 'admin_panel_settings', internalRoute: '/app/permissions' });
    }

    // Siempre al final
    options.push({ id: 'copyId', label: 'Copiar ID', icon: 'content_copy' });
    options.push({ id: 'copyUrl', label: 'Copiar URL', icon: 'link' });

    return options;
  }
}
