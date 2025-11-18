import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { RecoverComponent } from './components/auth/recover/recover.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { ConfigComponent } from './components/config/config/config.component';
import { CounterEditComponent } from './components/counter/counter-edit/counter-edit.component';
import { CounterListComponent } from './components/counter/counter-list/counter-list.component';
import { CounterOpenComponent } from './components/counter/counter-open/counter-open.component';
import { HomeComponent } from './components/home/home/home.component';
import { AuthGuard } from './guards/auth.guard';
import { CounterPermissionsComponent } from './components/counter/counter-permissions/counter-permissions.component';

export const routes: Routes = [
  { path: '', component: CounterOpenComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'open', component: CounterOpenComponent },
  { path: 'recover', component: RecoverComponent },
  { path: 'app', component: HomeComponent, children: [
      { path: 'create', component: CounterEditComponent },
      { path: 'list', component: CounterListComponent, canActivate: [AuthGuard] },
      { path: 'permissions', component: CounterPermissionsComponent, canActivate: [AuthGuard] },
      { path: 'config', component: ConfigComponent, canActivate: [AuthGuard] },
      { path: '', redirectTo: 'list', pathMatch: 'full' }
    ]},
  { path: '**', redirectTo: '' }
];;
