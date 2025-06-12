import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomPaginationComponent } from './custom-pagination/custom-pagination.component';
import { CustomTableoptionComponent } from './custom-tableoption/custom-tableoption.component';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { AmazingTimePickerModule } from 'amazing-time-picker';
import { DataTablesModule } from 'angular-datatables';
import { NgChartsModule } from 'ng2-charts';
import { DpDatePickerModule } from 'ng2-date-picker';
import { SelectDropDownModule } from 'ngx-select-dropdown';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ToastrModule } from 'ngx-toastr';
import { CMPPayslipTemplateModalComponent } from '../companyuser/companyrules/payslip-template/payslip-template-modal/payslip-template-modal.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  exports: [
    CustomPaginationComponent,
    CustomTableoptionComponent,
    DataTablesModule,
    ReactiveFormsModule,
    FormsModule,
    NgxSpinnerModule,
    CMPPayslipTemplateModalComponent
  ],
  declarations: [CustomPaginationComponent, CustomTableoptionComponent, CMPPayslipTemplateModalComponent],
})
export class IncludesModule {}
