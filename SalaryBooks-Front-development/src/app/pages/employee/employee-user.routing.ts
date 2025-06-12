import { Routes, RouterModule } from '@angular/router';
import { EMPDashboardComponent } from './dashboard/dashboard.component';
import { EMPProfileComponent } from './profile/profile.component';
import { EMPApplyComponent } from './apply/apply.component';
import { EMPAttendanceComponent } from './attendance/attendance.component';
import { EMPViewComponent } from './view/view.component';
import { LoginComponent } from '../employees/login/login.component';
import { ViewDocumentComponent } from './view/view-document/view-document.component';
import { EmpuserGuard } from 'src/app/guard/empuser.guard';

const routes: Routes = [
    { path: "", redirectTo: 'dashboard', pathMatch: 'full' },
    { path: "dashboard", component: EMPDashboardComponent, data: { pageTitle: 'Dashboard' },canActivate:[EmpuserGuard] },
    { path: "profile", component: EMPProfileComponent, data: { pageTitle: 'My Profile',currentUrl:'profile' },canActivate:[EmpuserGuard] },
    { path: "apply", component: EMPApplyComponent, data: { pageTitle: 'Apply',currentUrl:'apply' },canActivate:[EmpuserGuard] },
    { path: "attendance", component: EMPAttendanceComponent, data: { pageTitle: 'Attendance',currentUrl:'attendance' },canActivate:[EmpuserGuard] },
    { path: "view", component: EMPViewComponent, data: { pageTitle: 'View',currentUrl:'view' },canActivate:[EmpuserGuard] },
    // { path: "login", component: LoginComponent, data: { pageTitle: 'Login' } },
    { path: "document/:id", component: ViewDocumentComponent, data: { pageTitle: 'View Document',currentUrl:'document' },canActivate:[EmpuserGuard] },
];

export const EmployeeUserRoutes = RouterModule.forChild(routes);
