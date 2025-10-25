import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { RecoverComponent } from './components/auth/recover/recover.component';
import { HomeComponent } from './components/home/home/home.component';
import { CounterEditComponent } from './components/counter/counter-edit/counter-edit.component';
import { CounterListComponent } from './components/counter/counter-list/counter-list.component';
import { CounterOpenComponent } from './components/counter/counter-open/counter-open.component';
import { ConfigComponent } from './components/config/config/config.component';
import { AuthGuard } from './guards/auth.guard';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'recover', component: RecoverComponent },
  { path: 'app', component: HomeComponent, canActivate: [AuthGuard], children: [
      { path: 'create', component: CounterEditComponent },
      { path: 'list', component: CounterListComponent },
      { path: 'open', component: CounterOpenComponent },
      { path: 'config', component: ConfigComponent },
      { path: '', redirectTo: 'list', pathMatch: 'full' }
    ]},
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [
    BrowserModule,
        CommonModule,
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
