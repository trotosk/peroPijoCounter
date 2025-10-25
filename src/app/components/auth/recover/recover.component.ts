import { Component } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-recover',
  templateUrl: './recover.component.html',
  imports: [CommonModule,
    FormsModule
  ]
})
export class RecoverComponent {
  email = '';
  message = '';

  constructor(private auth: AuthService) {}

  recover() {
    const res = this.auth.sendRecovery(this.email);
    this.message = res.message;
  }
}
