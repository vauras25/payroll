import { NgModule } from '@angular/core';
import { ExtraOptions, RouterModule, Routes } from '@angular/router';
import { AdminGuard } from './guard/admin.guard';
import { GuestGuard } from './guard/guest.guard';
import { AdminLoginPageComponent } from './pages/auth/admin-login-page/admin-login-page.component';
import { NotfoundPageComponent } from './pages/notfound-page/notfound-page.component';
import { HomePageComponent } from './pages/frontend/home-page/home-page.component';
import { SubadminLoginPageComponent } from './pages/auth/subadmin-login-page/subadmin-login-page.component';
import { CompanyuserLoginPageComponent } from './pages/auth/companyuser-login-page/companyuser-login-page.component';
import { SubadminGuard } from './guard/subadmin.guard';
import { CompanyuserGuard } from './guard/companyuser.guard';
import { EmployeeUserLayoutComponent } from './pages/employee/employee-user-layout.component';
import { LoginComponent } from './pages/employees/login/login.component';
import { ForgotComponent } from './pages/employees/forgot-password/forgot.component';
import { EmpuserGuard } from './guard/empuser.guard';
import { InvitationFormComponent } from './pages/Public/invitation-from/invitation-form.component';
import { HomeEditComponent } from './pages/companyuser/home-edit/home-edit.component';

const routes: Routes = [
  {path:'', pathMatch:"full", redirectTo:'public'},
  {
    path: 'public',
    // pathMatch:"full",  
    loadChildren: () =>
      import('../app/pages/Landing-page/landing-page.module').then(
        (m) => m.LandingPageModule
      ), canActivate: [GuestGuard],
  },
  // { path: 'home-login', component: HomePageComponent },

 

  {
    path: 'admin/login',
    component: AdminLoginPageComponent,
    canActivate: [GuestGuard],
  },

  {
    path: 'admin',
    loadChildren: () =>
      import('../app/pages/admin/admin.module').then((m) => m.AdminModule),
    canActivate: [AdminGuard],
  },

  {
    path: 'sub-admin/login',
    component: SubadminLoginPageComponent,
    canActivate: [GuestGuard],
  },

  {
    path: 'sub-admin',
    loadChildren: () =>
      import('../app/pages/subadmin/sub-admin.module').then(
        (m) => m.SubAdminModule
      ),
    canActivate: [SubadminGuard],
  },

  {
    path: 'company/login',
    component: CompanyuserLoginPageComponent,
    canActivate: [GuestGuard],
  },

  {
    path: 'company',
    loadChildren: () =>
      import('../app/pages/companyuser/company-user.module').then(
        (m) => m.CompanyUserModule
      ),
    canActivate: [CompanyuserGuard],
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [GuestGuard],
  },
  {
    path: 'forgot-password',
    component: ForgotComponent,
    // canActivate: [GuestGuard],
  },
  {
    path: 'employee',
    component: EmployeeUserLayoutComponent,
    loadChildren: () => import('./pages/employee/employee-user.module').then(
      (m) => m.EmployeeUserModule
    ),
  },
  {
    path: 'employee/login',
    component: LoginComponent,
    canActivate:[GuestGuard]
  },
  {
    path: 'invitation-form',
    component: InvitationFormComponent,
  },

  { path: '**', component: NotfoundPageComponent },
];

const routerOptions: ExtraOptions = {
  onSameUrlNavigation: 'reload' // Choose the desired option here
};

@NgModule({
  imports: [RouterModule.forRoot(routes, routerOptions)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
