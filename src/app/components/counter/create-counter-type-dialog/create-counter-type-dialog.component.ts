import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MatDialogContent, MatDialogActions, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { COUNTER_CATEGORIES, CounterCategory } from '../../../models/counter.model';

@Component({
  selector: 'app-create-counter-type-dialog',
  templateUrl: './create-counter-type-dialog.component.html',
  styleUrls: ['./create-counter-type-dialog.component.scss'],
  imports: [MatDialogContent, MatDialogActions,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    CommonModule,
    FormsModule
  ]
})
export class CreateCounterTypeDialogComponent {
  types: string[] = ['Voley'];
  categories: readonly CounterCategory[] = COUNTER_CATEGORIES;

  selectedType: string | null = null;
  selectedCategory: CounterCategory | null = null;

  constructor(
    private dialogRef: MatDialogRef<CreateCounterTypeDialogComponent>
  ) {}

  cancel(): void {
    this.dialogRef.close(null);
  }

  continue(): void {
    if (this.selectedType && this.selectedCategory) {
      this.dialogRef.close({ type: this.selectedType, category: this.selectedCategory });
    }
  }
}
