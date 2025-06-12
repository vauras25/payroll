import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { AmazingTimePickerModule } from 'amazing-time-picker';
import { DataTablesModule } from 'angular-datatables';
import { NgChartsModule } from 'ng2-charts';
import { DpDatePickerModule } from 'ng2-date-picker';
import { SelectDropDownModule } from 'ngx-select-dropdown';
import { NgxSpinnerModule } from 'ngx-spinner';
import { IncludesModule } from '../includes/includes.module';
import { SubAdminRoutes } from './sub-admin.routing';
import { SADClientpackagesComponent } from './clientpackages/clientpackages.component';
import { SADHomeComponent } from './home/home.component';
import { SubadminDashboardFooterComponent } from './includes/dashboard-footer/dashboard-footer.component';
import { SubadminDashboardHeaderComponent } from './includes/dashboard-header/dashboard-header.component';
import { SubadminDashboardSidebarComponent } from './includes/dashboard-sidebar/dashboard-sidebar.component';
import { SubadminDashboardTopbarComponent } from './includes/dashboard-topbar/dashboard-topbar.component';
import { SADProfileComponent } from './profile/profile.component';
import { SADRolesComponent } from './roles/roles.component';
import { SADSubadminsComponent } from './subadmins/subadmins.component';
import { SADSubscriptionPlansComponent } from './subscription/subscription-plans/subscription-plans.component';
import { SADSubscriptionUsersComponent } from './subscription/subscription-users/subscription-users.component';

@NgModule({
  imports: [
    CommonModule,
    SubAdminRoutes,
    SelectDropDownModule,
    NgxSpinnerModule,
    DpDatePickerModule,
    IncludesModule
  ],
  declarations: [
    SADHomeComponent,
    SubadminDashboardSidebarComponent,
    SubadminDashboardHeaderComponent,
    SubadminDashboardFooterComponent,
    SubadminDashboardTopbarComponent,
    SADProfileComponent,
    SADRolesComponent,
    SADSubadminsComponent,
    SADClientpackagesComponent,
    SADSubscriptionPlansComponent,
    SADSubscriptionUsersComponent,
  ],
})

export class SubAdminModule {}
