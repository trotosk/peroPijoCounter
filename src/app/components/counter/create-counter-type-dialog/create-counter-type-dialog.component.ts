import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MatDialogContent, MatDialogActions, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

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
  // Lista de tipos disponibles (puedes ampliarla o parametrizarla)
  //types: string[] = ['Voley', 'Competitivo', 'Cronómetro', 'Otro'];
  types: string[] = ['Voley'];
  selectedType: string | null = null;

  constructor(
    private dialogRef: MatDialogRef<CreateCounterTypeDialogComponent>
  ) {}

  cancel(): void {
    this.dialogRef.close(null);
  }

  continue(): void {
    if (this.selectedType) {
      this.dialogRef.close(this.selectedType);
    }
  }
}
