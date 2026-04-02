import { Component, ViewChild, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CounterRecordList } from '../../../models/counter.model';
import { FirestoreCounterService } from '../../../services/firestore-counter.service';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-counter-open',
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './counter-open.component.html',
  styleUrls: ['./counter-open.component.scss'],
})
export class CounterOpenComponent {

  displayedColumns: string[] = [
    'actions', 'leftName', 'rightName', 'type', 'category', 'state', 'gamesCount', 'createdAt', 'updatedAt', 'id'
  ];

  columnHeaders: { [key: string]: string } = {
    actions: 'Acciones',
    id: 'ID',
    isFinished: 'Estado',
    createdAt: 'Creado',
    updatedAt: 'Última Modificación',
    leftName: 'Local',
    rightName: 'Visitante',
    gamesCount: 'Partes',
    type: 'Tipo',
    category: 'Categoría'
  };

  dataSource = new MatTableDataSource<CounterRecordList>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  counterId = '';
  publicCounters: CounterRecordList[] = [];
  paginatedPublic: CounterRecordList[] = [];
  page = 1;
  openMenuIndex: number | null = null;

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private fsService: FirestoreCounterService,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      await this.loadPublicCounters();
    }
  }

  async loadPublicCounters() {
    const list = await this.fsService.getPublicCounters();

    this.ngZone.run(() => {
      this.dataSource.data = list.map(c => ({
        ...c,
        actionOptions: this.buildActionOptionsPublic(c)
      } as any));

      setTimeout(() => {
        if (this.paginator) this.dataSource.paginator = this.paginator;
        if (this.sort) this.dataSource.sort = this.sort;
      });
    });
  }

  executeAction(action: any, row: CounterRecordList) {
    if (action.id === 'load') return this.router.navigate(['/app/create'], { queryParams: { id: row.id } });
    if (action.id === 'copyId') return this.copyId(row.id);
    if (action.id === 'copyUrl') return this.copyUrl(row.id);
    if (action.internalRoute) return this.router.navigate([action.internalRoute], { queryParams: { id: row.id } });
    if (action.externalUrl && isPlatformBrowser(this.platformId)) window.open(action.externalUrl, '_blank');
  }

  buildActionOptionsPublic(row: CounterRecordList) {
    return [
      { id: 'load', label: 'Cargar', icon: 'upload', internalRoute: '/app/create' },
      { id: 'copyUrl', label: 'Copiar URL', icon: 'link' },
      { id: 'copyId', label: 'Copiar ID', icon: 'content_copy' }
    ];
  }

  copyUrl(id: string) {
    if (!isPlatformBrowser(this.platformId)) return;
    const url = `${window.location.origin}/app/create?id=${id}`;
    navigator.clipboard.writeText(url);
    this.snackBar.open('📋 URL copiado al portapapeles', 'Cerrar', { duration: 2000, panelClass: ['info-toast'] });
  }

  copyId(id: string) {
    if (!isPlatformBrowser(this.platformId)) return;
    navigator.clipboard.writeText(id);
    this.snackBar.open('📋 ID copiado al portapapeles', 'Cerrar', { duration: 2000, panelClass: ['info-toast'] });
  }

  toggleMenu(index: number, event: MouseEvent) {
    event.stopPropagation();
    this.openMenuIndex = this.openMenuIndex === index ? null : index;
  }

  async load() {
    if (!isPlatformBrowser(this.platformId)) return;

    const id = this.counterId.trim();
    if (!id) {
      this.showToast('Por favor, introduce un ID.');
      return;
    }

    const rec = await this.fsService.findCounterById(id);

    this.ngZone.run(() => {
      if (!rec) {
        this.showToast('❌ ID no válido o marcador no encontrado.');
        return;
      }
      this.router.navigate(['/app/create'], { queryParams: { id: rec.id } });
    });
  }

  range(n: number): number[] {
    return Array(n || 0).fill(0);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  }

  showToast(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-toast'],
    });
  }

  rowClick(item: CounterRecordList) {
    this.loadCounter(item);
  }

  loadCounter(item: CounterRecordList) {
    this.router.navigate(['/app/create'], { queryParams: { id: item.id } });
  }

  refreshPagination() {
    const start = (this.page - 1) * 10;
    const end = start + 10;
    this.paginatedPublic = this.publicCounters.slice(start, end);
  }

  nextPage() {
    if (this.page * 10 >= this.publicCounters.length) return;
    this.page++;
    this.refreshPagination();
  }

  prevPage() {
    if (this.page === 1) return;
    this.page--;
    this.refreshPagination();
  }
}
