import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { EmployeeUserRoutes } from './employee-user.routing';
import { EMPLeftbarComponent } from './includes/leftbar/leftbar.component';
import { EmployeeUserLayoutComponent } from './employee-user-layout.component';
import { EMPTopbarComponent } from './includes/topbar/topbar.component';
import { EMPDashboardComponent } from './dashboard/dashboard.component';
import { EMPProfileComponent } from './profile/profile.component';
import { EMPApplyComponent } from './apply/apply.component';
import { EMPAttendanceComponent } from './attendance/attendance.component';
import { LoginComponent } from '../employees/login/login.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonService } from 'src/app/services/common.service';
import { SelectDropDownModule } from 'ngx-select-dropdown';
import { AddressComponent } from './profile/address/address.component';
import { BankDetailsComponent } from './profile/bank-details/bank-details.component';
import { ContractDetailsComponent } from './profile/contract-details/contract-details.component';
import { EducationComponent } from './profile/education/education.component';
import { DynamicFilterPipe } from 'src/app/Pipe/dynamic-filter.pipe';
import { HrPolicyComponent } from './profile/hr-policy/hr-policy.component';
import { AccidentComponent } from './profile/accident/accident.component';
import { IncludesModule } from '../includes/includes.module';
import { AdvanceRequestComponent } from './apply/advance-request/advance-request.component';
import { TdsComponent } from './apply/tds/tds.component';
import { TrainingComponent } from './profile/training/training.component';
import { ExtracurricularComponent } from './profile/extracurricular/extracurricular.component';
import { StrtojsonPipe } from 'src/app/Pipe/strtojson.pipe';
import { AdvanceRequestsComponent } from './view/advance-requests/advance-requests.component';
import { EMPViewComponent } from './view/view.component';
import { MonthnamePipe } from 'src/app/Pipe/monthname.pipe';
import { LeaveStatusComponent } from './view/leave-status/leave-status.component';
import { LeaveHeadPipe } from 'src/app/Pipe/leave-head.pipe';
import { DocumentListComponent } from './view/document-list/document-list.component';
import { ViewDocumentComponent } from './view/view-document/view-document.component';
import { EsiComponent } from './profile/esi/esi.component';
import { ReimbursementComponent } from './apply/reimbursement/reimbursement.component';
import { ExtraEarningComponent } from './apply/extra-earning/extra-earning.component';
import { DViewLocationMapComponent } from './dashboard/d-view-location-map/d-view-location-map.component';
import { AgmCoreModule } from '@agm/core';
import { EPayslipComponent } from './view/e-payslip/e-payslip.component';
import { CMPPayslipTemplateModalComponent } from '../companyuser/companyrules/payslip-template/payslip-template-modal/payslip-template-modal.component';

@NgModule({
  declarations: [
    EmployeeUserLayoutComponent,
    EMPLeftbarComponent,
    EMPTopbarComponent,
    EMPDashboardComponent,
    EMPProfileComponent,
    EMPApplyComponent,
    EMPAttendanceComponent,
    LoginComponent,
    AddressComponent,
    BankDetailsComponent,
    ContractDetailsComponent,
    EducationComponent,
    DynamicFilterPipe,
    HrPolicyComponent,
    AccidentComponent,
    AdvanceRequestComponent,
    TdsComponent,
    TrainingComponent,
    ExtracurricularComponent,
    StrtojsonPipe,
    AdvanceRequestsComponent,
    EMPViewComponent,
    MonthnamePipe,
    LeaveStatusComponent,
    LeaveHeadPipe,
    DocumentListComponent,
    ViewDocumentComponent,
    EsiComponent,
    ReimbursementComponent,
    ExtraEarningComponent,
    DViewLocationMapComponent,
    EPayslipComponent
  ],
  providers: [CommonService],
  imports: [
    CommonModule,
    EmployeeUserRoutes,
    NgChartsModule,
    FormsModule,
    ReactiveFormsModule,
    SelectDropDownModule,
    IncludesModule,
    AgmCoreModule.forRoot({
        apiKey:"AIzaSyDq5_JgCjfSCHG6SyfDCdL08rcAUhvdVPc",
        libraries:['places']
      }),
    
  ],
})
export class EmployeeUserModule {}
