import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { AppComponent } from 'src/app/app.component';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import { DatePipe } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'companyuser-app-salary-template',
  templateUrl: './salary-template.component.html',
  styleUrls: ['./salary-template.component.css'],
})
export class CMPSalaryTemplateComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  dtOptionsLibrary: DataTables.Settings = {};

  salaryTemplatesLibraryList: any[] = [];

  salaryTemplateForm: UntypedFormGroup;
  salaryEarningForm: UntypedFormGroup;
  salaryHeadForm: UntypedFormGroup;

  //earnings variables
  earnings: any[];
  earningSalaryHeads:any[] = [];
  dependentSalaryHeads:any[] = [];
  dependentSalaryHeadsId:any[] = [];

  salaryHeads: any[];
  salaryHeadsLibrary: any[];
  priorityMaster: any[];
  attendanceRelationMaster: any[];
  headsIncludeMaster: any[];
  earningTypeMaster: any[];
  earningTypeOptions: any[];

  earningEditActionIndex: any;
  tempEditActionId: any;
  salaryTempateDetails: any;

  Global = Global;

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    protected companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    public AppComponent: AppComponent,
    public router: Router
  ) {
    this.salaryTemplateForm = formBuilder.group({
      template_name: [null, Validators.compose([Validators.required])],
      // restricted_pf: [null, Validators.compose([Validators.required])],
      voluntary_pf: [
        null,
        Validators.compose([Validators.max(88) , Validators.pattern('^[0-9]+(.[0-9]{0,1})?$')]),
      ],
      // no_pension: [null, Validators.compose([Validators.required])],
      advance: [null],
      minimum_wage_amount: [
        null,
        Validators.compose([Validators.pattern('^[0-9]+(.[0-9]{0,2})?$')]),
      ],
      minimum_wage_percentage: [
        null,
        Validators.compose([Validators.pattern('^[0-9]+(.[0-9]{0,2})?$')]),
      ],
      wage_applicable: [null],
    });

    this.salaryEarningForm = formBuilder.group({
      head_id: [null, Validators.compose([Validators.required])],
      priority: [null, Validators.compose([Validators.required])],
      is_percentage: [false, Validators.compose([])],
      percentage_amount: [
        null,
        Validators.compose([Validators.pattern('^[0-9]+(.[0-9]{0,2})?$')]),
      ],
      dependent_head: [null, Validators.compose([])],
      attendance_relation: [null, Validators.compose([Validators.required])],
      head_include_in: [null],
      earning_type: [null, Validators.compose([])],
      earning_value: [
        null,
        Validators.compose([Validators.pattern('^[0-9]+(.[0-9]{0,2})?$')]),
      ],
    });

    this.salaryHeadForm = formBuilder.group({
      full_name: [null, Validators.compose([Validators.required])],
      head_type: [null, Validators.compose([Validators.required])],
      abbreviation: [null, Validators.compose([])],
    });

    this.salaryTemplateForm.get('advance')?.valueChanges.subscribe((val) => {
      if (val == true) {
        $('.advance-action').show(500);
        $('#salaryEarningForm').find('.advance-fields').show();

        this.salaryTemplateForm.controls['minimum_wage_amount'].setValidators([
          Validators.required,
          Validators.pattern('^[0-9]+(.[0-9]{0,2})?$'),
        ]);
        this.salaryTemplateForm.controls[
          'minimum_wage_percentage'
        ].setValidators([
          Validators.required,
          Validators.pattern('^[0-9]+(.[0-9]{0,2})?$'),
        ]);
        this.salaryTemplateForm.controls['wage_applicable'].setValidators([
          Validators.required,
        ]);

        // this.earningTypeOptions = [
        //   // { value: 'auto', description: 'Auto' },
        //   { value: 'percent', description: 'Percent' },
        //   { value: 'amount', description: 'Amount' },
        // ];
        
      } else {
        $('.advance-action').hide(500);
        $('#salaryEarningForm').find('.advance-fields').hide();

        this.salaryTemplateForm.controls[
          'minimum_wage_amount'
        ].clearValidators();
        this.salaryTemplateForm.controls[
          'minimum_wage_percentage'
        ].clearValidators();
        this.salaryTemplateForm.controls['wage_applicable'].clearValidators();

        this.salaryTemplateForm.patchValue({
          minimum_wage_amount: null,
          minimum_wage_percentage: null,
          wage_applicable: null,
        });

        // this.earningTypeOptions = [
        //   { value: 'percent', description: 'Percent' },
        //   { value: 'amount', description: 'Amount' },
        // ];
      }

      this.salaryTemplateForm.controls[
        'minimum_wage_amount'
      ].updateValueAndValidity();
      this.salaryTemplateForm.controls[
        'minimum_wage_percentage'
      ].updateValueAndValidity();
      this.salaryTemplateForm.controls[
        'wage_applicable'
      ].updateValueAndValidity();
    });

    this.salaryEarningForm
      .get('is_percentage')
      ?.valueChanges.subscribe((val) => {
        if (val == true) {
          this.salaryEarningForm.controls['percentage_amount'].setValidators([
            Validators.required,
          ]);
          this.salaryEarningForm.controls['dependent_head'].setValidators([
            Validators.required,
          ]);
          // $('[formControlName="percentage_amount"]').removeAttr('readonly');
          // $('[formControlName="dependent_head"]').removeAttr('readonly');
          // $('[formControlName="percentage_amount"]').removeAttr('disabled');
          // $('[formControlName="dependent_head"]').removeAttr('disabled');
          this.salaryEarningForm.get('earning_type')?.setValue({ value: 'auto', description: 'Auto' })
          // $('[formControlName="earning_type"]').attr('readonly', 'true');
          // $('[formControlName="earning_type"]').attr('disabled', 'true');
          // this.earningTypeOptions = [
          //   { value: 'auto', description: 'Auto' },
          //   { value: 'percent', description: 'Percent' },
          //   { value: 'amount', description: 'Amount' },
          // ];
        } else {
          this.salaryEarningForm.controls[
            'percentage_amount'
          ].clearValidators();
          this.salaryEarningForm.controls[
            'dependent_head'
          ].clearValidators();
          
          this.salaryEarningForm.patchValue({
            percentage_amount: null,
            dependent_head:null,
            earning_type:null
          });
          if(this.isAdvancePreDefiend){
            this.salaryEarningForm.get('earning_type')?.setValue({ value: 'auto', description: 'Auto' })

            // this.earningTypeOptions = [
            //   // { value: 'auto', description: 'Auto' },
            //   { value: 'percent', description: 'Percent' },
            //   { value: 'amount', description: 'Amount' },
            // ];
          }
          // this.salaryEarningForm.get('percentage_amount')?.disable()
          // this.salaryEarningForm.get('dependent_head')?.disable()
          // this.salaryEarningForm.get('earning_type')?.disable()
          // $('[formControlName="dependent_head"]').attr('readonly', 'true');
          // $('[formControlName="percentage_amount"]').attr('readonly', 'true');
          // $('[formControlName="dependent_head"]').attr('disabled', 'true');
          // $('[formControlName="percentage_amount"]').attr('disabled', 'true');
        }
        this.salaryEarningForm.controls[
          'percentage_amount'
        ].updateValueAndValidity();
      });

    this.salaryEarningForm
      .get('earning_type')
      ?.valueChanges.subscribe((val) => {
        if (val?.value == 'percent') {
          this.salaryEarningForm.controls['earning_value'].setValidators([
            Validators.required,
          ]);
          $('[formControlName="earning_value"]').attr(
            'placeholder',
            'Enter Earning Percentage'
          );
        } else if (val?.value == 'amount') {
          this.salaryEarningForm.controls['earning_value'].setValidators([
            Validators.required,
          ]);
          $('[formControlName="earning_value"]').attr(
            'placeholder',
            'Enter Earning Amount'
          );
        } else {
          this.salaryEarningForm.controls['earning_value'].clearValidators();
          $('[formControlName="earning_value"]').attr(
            'placeholder',
            'Enter Earning Value'
          );
        }

        this.salaryEarningForm.controls[
          'earning_value'
        ].updateValueAndValidity();
      });

    this.priorityMaster = [
      { value: 1, description: '1' },
      { value: 2, description: '2' },
      { value: 3, description: '3' },
      { value: 4, description: '4' },
      { value: 5, description: '5' },
    ];

    this.attendanceRelationMaster = [
      { value: 'dependent', description: 'Dependent' },
      { value: 'non_dependent', description: 'Non-Dependent' },
    ];

    this.headsIncludeMaster = [
      { value: 'PF', description: 'PF' },
      { value: 'ESI', description: 'ESI' },
      { value: 'PT', description: 'PT' },
      { value: 'TDS', description: 'TDS' },
      { value: 'OT', description: 'OT' },
      { value: 'Bonus', description: 'Bonus' },
      { value: 'Gratuity', description: 'Gratuity' },
    ];

    this.earningTypeMaster = this.earningTypeOptions = [
      // { value: 'auto', description: 'Auto' },
      { value: 'percent', description: 'Percent' },
      { value: 'amount', description: 'Amount' },
    ];

    // this.earnings = [{ "head_id": { "id": "6196536c730cfc6c51e280c4", "description": "Basic (BA)", "full_name": "Basic (BA)", "abbreviation": "df sfsfs", "head_type": "earning" }, "priority": { "value": 1, "description": "1" }, "is_percentage": null, "percentage_amount": null, "dependent_head": [], "attendance_relation": { "value": "non_dependent", "description": "Non-Dependent" }, "head_include_in": [], "earning_type": { "value": "percent", "description": "Percent" }, "earning_value": "30" }, { "head_id": { "id": "61e7ad3c312f79f752a5b1d4", "description": "House Rent", "full_name": "House Rent", "abbreviation": "HRA", "head_type": "earning" }, "priority": { "value": 2, "description": "2" }, "is_percentage": null, "percentage_amount": null, "dependent_head": [], "attendance_relation": { "value": "non_dependent", "description": "Non-Dependent" }, "head_include_in": [], "earning_type": { "value": "percent", "description": "Percent" }, "earning_value": "70" }];

    this.salaryHeads = [];
    this.earnings = [];

    this.earningEditActionIndex = '';
    this.tempEditActionId = '';
    this.salaryTempateDetails = null;
  }

  ngOnInit(): void {
    this.titleService.setTitle('Salary Template - ' + Global.AppName);

    if (
      Global.checkCompanyModulePermission({
        company_module:"company_rules_1",
        company_sub_module: 'salary_template',
        company_sub_operation: ['add'],
        company_strict: true,
      })
    ) {
      this.fetchSalaryHeads();
    }

    if (
      Global.checkCompanyModulePermission({
        company_module:"company_rules_1",
        company_sub_module: 'salary_template',
        company_sub_operation: ['view'],
        company_strict: true,
      })
    ) {
      this.fetchSalaryTemplate();
    }

    if (
      !Global.checkCompanyModulePermission({
        company_module:"company_rules_1",
        company_sub_module: 'salary_template',
        company_sub_operation: ['add', 'edit', 'delete', 'view'],
        company_strict: true,
      })
    ) {
      const _this = this;
      setTimeout(function () {
        _this.router.navigate(['company/errors/unauthorized-access'], {
          skipLocationChange: true,
        });
      }, 500);
      return;
    }
  }

  addSalaryTemplate(event: any) {
    let earnings = this.fetchEarningsForSubmit();

    this.salaryTemplateForm.markAllAsTouched();
    Global.scrollToQuery('p.error-element');

    if (this.salaryTemplateForm.valid && earnings != false) {
      event.target.classList.add('btn-loading');

      this.companyuserService
        .addSalaryTemplate({
          template_name: this.salaryTemplateForm.value.template_name ?? '',
          restricted_pf:
            $('#restricted-pf').hasClass('on') == true ? 'yes' : 'no',
          voluntary_pf: this.salaryTemplateForm.value.voluntary_pf ?? '0',
          // 'no_pension': $('#no-pension').hasClass('on') == true ? 'yes' : 'no',
          advance: this.salaryTemplateForm.value.advance == true ? 'yes' : 'no',
          minimum_wage_amount:
            this.salaryTemplateForm.value.minimum_wage_amount ?? '',
          minimum_wage_percentage:
            this.salaryTemplateForm.value.minimum_wage_percentage ?? '',
          wage_applicable:
            this.salaryTemplateForm.value.wage_applicable ?? 'higher',
          earning: JSON.stringify(earnings),
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              this.cancelSalaryTemplateEntry();
              $('#my-datatable')
                .dataTable()
                .api()
                .ajax.reload(function (json) {}, false);
            } else if (res.status == 'val_err') {
              this.toastr.error(Global.showValidationMessage(res.val_msg));
            } else {
              this.toastr.error(res.message);
            }

            event.target.classList.remove('btn-loading');
          },
          (err) => {
            event.target.classList.remove('btn-loading');
            this.toastr.error(Global.showServerErrorMessage(err));
          }
        );
    }
  }

  updateSalaryTemplate(event: any) {
    let earnings = this.fetchEarningsForSubmit();

    this.salaryTemplateForm.markAllAsTouched();
    Global.scrollToQuery('p.error-element');

    if (this.salaryTemplateForm.valid && earnings != false) {
      event.target.classList.add('btn-loading');

      this.companyuserService
        .updateSalaryTemplate({
          template_id: this.tempEditActionId,
          template_name: this.salaryTemplateForm.value.template_name ?? '',
          restricted_pf:
            $('#restricted-pf').hasClass('on') == true ? 'yes' : 'no',
          voluntary_pf: this.salaryTemplateForm.value.voluntary_pf ?? '0',
          // 'no_pension': $('#no-pension').hasClass('on') == true ? 'yes' : 'no',
          advance: this.salaryTemplateForm.value.advance == true ? 'yes' : 'no',
          minimum_wage_amount:
            this.salaryTemplateForm.value.minimum_wage_amount ?? '',
          minimum_wage_percentage:
            this.salaryTemplateForm.value.minimum_wage_percentage ?? '',
          wage_applicable:
            this.salaryTemplateForm.value.wage_applicable ?? 'higher',
          earning: JSON.stringify(earnings),
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              $('#my-datatable')
                .dataTable()
                .api()
                .ajax.reload(function (json) {}, false);
            } else if (res.status == 'val_err') {
              this.toastr.error(Global.showValidationMessage(res.val_msg));
            } else {
              this.toastr.error(res.message);
            }

            event.target.classList.remove('btn-loading');
          },
          (err) => {
            event.target.classList.remove('btn-loading');
            this.toastr.error(Global.showServerErrorMessage(err));
          }
        );
    }
  }

  fetchEarningsForSubmit() {
    if (this.earnings.length < 1) {
      this.toastr.error(
        'Please add atleast one earning to create salary template'
      );
      return false;
    }

    let isEarningTypePercentPres = 'false';
    let totalEarningTypePercent = 0;
    let isEarningTypeAutoFound = 'false';

    let totalPercAmount: any = 0;

    let earnings: any[] = [];
    this.earnings.forEach((element) => {
      let obj: any = {
        head_id: element.head_id?.id ?? element.head_id?._id ?? '',
        head_full_name: element.head_id?.full_name ?? '',
        head_abbreviation: element.head_id?.abbreviation ?? '',
        type: element.head_id?.head_type ?? '',
        pre_def_head: element.head_id?.pre_def_head ?? '',

        priority: element.priority?.value ?? '',
        is_percentage: element.is_percentage == true ? 'yes' : 'no',
        percentage_amount: element.percentage_amount ?? '',
        attendance_relation: element.attendance_relation?.value ?? '',
        head_include_in: element.head_include_in ?? [],
        earning_type: element.earning_type?.value ?? '',
        earning_value: element.earning_value ?? '',
      };

      if (this.salaryTemplateForm.value.advance != true) {
        obj.is_percentage = 'no';
        obj.percentage_amount = '';

        element.dependent_head = '';
      }

      if (element.dependent_head?.id) {
        obj.dependent_head = element.dependent_head?.id ?? '';
        obj.dependent_head_full_name = element.dependent_head?.full_name ?? '';
        obj.dependent_head_abbreviation =
          element.dependent_head?.abbreviation ?? '';
        obj.dependent_head_type = element.dependent_head?.head_type ?? '';
      } else {
        obj.dependent_head = '';
        obj.dependent_head_full_name = '';
        obj.dependent_head_abbreviation = '';
        obj.dependent_head_type = '';
      }

      if (obj.earning_type == 'percent') {
        isEarningTypePercentPres = 'true';
        totalEarningTypePercent += parseFloat(obj.earning_value);
      }

      if (obj.earning_type == 'auto') {
        isEarningTypeAutoFound = 'true';
      }

      if (obj.percentage_amount) {
        totalPercAmount += parseFloat(obj.percentage_amount);
      }

      earnings.push(obj);
    });

    if (totalEarningTypePercent != 100) {
      this.toastr.error('The total earning percentage must be 100');
      return false;
    }

    // if (totalPercAmount && parseFloat(totalPercAmount) != 100) {
    //   this.toastr.error(
    //     'The total percentage applicable for the template must be 100'
    //   );
    //   return false;
    // }

    if (
      isEarningTypeAutoFound == 'true' &&
      this.salaryTemplateForm.value.advance != true
    ) {
      this.toastr.error(
        'Auto Earning Type option is only available for Advance Templates'
      );
      return false;
    }

    return earnings;
  }

  cancelSalaryTemplateEntry() {
    this.tempEditActionId = '';
    this.earnings = [];
    this.earningSalaryHeads = [];
    this.dependentSalaryHeads = [];
    this.dependentSalaryHeadsId = [];
    this.salaryTemplateForm.reset();
    for (const key in this.salaryTemplateForm.controls) {
      if (
        Object.prototype.hasOwnProperty.call(
          this.salaryTemplateForm.controls,
          key
        )
      ) {
        const element = this.salaryTemplateForm.controls[key];

        element.markAsUntouched();
        element.markAsPristine();
      }
    }

    $('#no-pension').removeClass('on');
    $('#restricted-pf').removeClass('on');

    Global.scrollToQuery('#salarytemplate-submit-section');
  }

  addEarning() {
    // this.earningsSalaryHeads = this.salaryHeads;
    // this.dependentSalaryHeads = this.salaryHeads;
    this.mapDataForEarning()
    this.cancelEarningEntry();
    $('.earning-desc').show();
  }

  mapDataForEarning(){
    this.earningSalaryHeads = this.salaryHeads.filter(head => !this.dependentSalaryHeadsId.includes(head.id));
    this.dependentSalaryHeads = this.salaryHeads.filter(head => this.dependentSalaryHeadsId.includes(head.id));
    const value = this.earnings?.find(earning => earning?.priority?.value === 1)?.priority.value
    if(value){
      const i = this.priorityMaster.findIndex((el:any) => el.value === value);
      if(i >= 0){
        this.priorityMaster.splice(i, 1)
      }
    }else if(this.priorityMaster.findIndex((el:any) => el.value === 1) < 0){
      this.priorityMaster.unshift({ value: 1, description: '1' })
    }
    this.isAdvancePreDefiend = false
    this.salaryEarningForm.get('is_percentage')?.enable()
    // this.salaryEarningForm.get('head_id')?.enable();
    // this.salaryEarningForm.get('priority')?.enable();
    // this.salaryEarningForm.get('is_percentage')?.enable();
    // this.salaryEarningForm.get('percentage_amount')?.enable();
    // this.salaryEarningForm.get('dependent_head')?.enable();
    // this.salaryEarningForm.get('attendance_relation')?.enable();
    // this.salaryEarningForm.get('earning_type')?.enable();
    // this.salaryEarningForm.get('earning_value')?.enable();
  }

  isAdvancePreDefiend:Boolean = false;
  editEarning(item: any, index: any) {
    this.earningEditActionIndex = index;
    
    this.salaryEarningForm.patchValue({
      head_id: item.head_id,
      priority: item.priority,
      is_percentage: item.is_percentage,
      percentage_amount: item.percentage_amount,
      dependent_head: item.dependent_head,
      attendance_relation: item.attendance_relation,
      earning_type: item.earning_type,
      earning_value: item.earning_value,
    });
    if(item?.head_id?.pre_def_head === 'yes' && index == 0 && item?.priority?.value == 1){
      // this.salaryEarningForm.get
      this.salaryEarningForm.get('earning_type')?.setValue({ value: 'auto', description: 'Auto' })

    }
    if(item?.head_id?.pre_def_head === 'yes' && this.salaryTemplateForm.get("advance")?.value){
      this.isAdvancePreDefiend = true
      this.salaryEarningForm.get('is_percentage')?.disable()
    //   this.salaryEarningForm.get('head_id')?.disable()
    //   this.salaryEarningForm.get('priority')?.disable()
    //   this.salaryEarningForm.get('is_percentage')?.disable()
    //   this.salaryEarningForm.get('percentage_amount')?.disable()
    //   this.salaryEarningForm.get('dependent_head')?.disable()
    //   this.salaryEarningForm.get('attendance_relation')?.disable()
    //   this.salaryEarningForm.get('earning_type')?.disable()
    //   this.salaryEarningForm.get('earning_value')?.disable()
    // }else{
    //   this.salaryEarningForm.get('head_id')?.enable()
    //   this.salaryEarningForm.get('priority')?.enable()
    //   this.salaryEarningForm.get('is_percentage')?.enable()
    //   this.salaryEarningForm.get('percentage_amount')?.enable()
    //   this.salaryEarningForm.get('dependent_head')?.enable()
    //   this.salaryEarningForm.get('attendance_relation')?.enable()
    //   this.salaryEarningForm.get('earning_type')?.enable()
    //   this.salaryEarningForm.get('earning_value')?.enable()
    }else{
      this.mapDataForEarning()
      this.isAdvancePreDefiend = false;
      this.salaryEarningForm.get('is_percentage')?.enable()
    }
    // this.mapDataForEarning()
    this.selectedEarningHeadForEdit(item.head_include_in);

    $('.earning-desc').show();
  }

  removeEarning(index: any) {
    const id = this.earnings.splice(index, 1)[0]?.head_id?.id;
    const i = this.dependentSalaryHeadsId.indexOf(id);
    if(i >= 0){
      this.dependentSalaryHeadsId.splice(i, 1)
    }
  }

  cancelEarningEntry() {
    $('.earning-desc').hide();
    this.earningEditActionIndex = '';
    this.resetSelectedEarningHead();

    this.salaryEarningForm.reset();
    for (const key in this.salaryEarningForm.controls) {
      if (
        Object.prototype.hasOwnProperty.call(
          this.salaryEarningForm.controls,
          key
        )
      ) {
        const element = this.salaryEarningForm.controls[key];

        element.markAsUntouched();
        element.markAsPristine();
      }
    }
  }

  submitEarning(event: any) {
    this.salaryEarningForm.markAllAsTouched();
    setTimeout(function () {
      let $_errFormControl = document.querySelectorAll('p.error-element');
      if ($_errFormControl.length > 0) {
        const firstErr: Element = $_errFormControl[0];
        firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    if (this.salaryEarningForm.valid) {
      let head_includes = this.getSelectedEarningHeadIncludes();
 

      this.salaryEarningForm.get("head_include_in")?.setValue(head_includes);

      if(this.earnings[this.earningEditActionIndex] && this.earnings[this.earningEditActionIndex]?.head_id?.pre_def_head === 'yes' && this.salaryTemplateForm.get("advance")?.value){
        this.earnings[this.earningEditActionIndex].head_include_in = this.salaryEarningForm.get("head_include_in")?.value;;
      }else if (this.earningEditActionIndex === '' ) {
        this.earnings.push(this.salaryEarningForm.value);
      } else {
        this.earnings[this.earningEditActionIndex] =
          this.salaryEarningForm.value;
      }

      // const headId = ;
      if(!this.dependentSalaryHeadsId.includes(this.salaryEarningForm.get("head_id")?.value?.id)){
        this.dependentSalaryHeadsId.push(this.salaryEarningForm.get("head_id")?.value?.id)
      }
      // if(this.salaryEarningForm.get("priority")?.value?.value  === 1){
      //   this.priorityMaster = this.priorityMaster.filter((el:any) => el?.value !== 1);
      // }
      // const i = this.salaryHeads.findIndex((el:any) => el.id === headId);
      // if(i >= 0){
      //   this.salaryHeads.splice(i, 1)
      // }

      this.cancelEarningEntry();
    }
  }

  fetchSalaryHeads() {
    this.spinner.show();

    this.companyuserService.fetchSalaryHeads().subscribe(
      (res) => {
        if (res.status == 'success') {
          this.salaryHeads = [];
          res.temp_head.forEach((element: any) => {
            this.salaryHeads.push({
              id: element._id,
              pre_def_head:element.pre_def_head,
              description: element.full_name,
              full_name: element.full_name,
              abbreviation: element.abbreviation,
              head_type: element.head_type,
            });
          });
        } else if (res.status == 'val_err') {
          this.toastr.error(Global.showValidationMessage(res.val_msg));
        } else {
          this.toastr.error(res.message);
        }

        this.spinner.hide();
      },
      (err) => {
        this.spinner.hide();
        this.toastr.error(Global.showServerErrorMessage(err));
      }
    );
  }

  async fetchSalaryHeadsLibrary(e:any) {
    try {
      e.target.classList.add('btn-loading');
      let res = await this.companyuserService
        .getSalaryTemplateHeadsLibrary({ pageno: 1 })
        .toPromise();
      if (res.status !== 'success') throw res;
      this.salaryHeadsLibrary = res?.salarytemphead_rule?.docs;
      e.target.classList.remove('btn-loading');
      return res?.salarytemphead_rule?.docs;
    } catch (err: any) {
      e.target.classList.remove('btn-loading');
      if (err.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else {
        this.toastr.error(Global.showServerErrorMessage(err));
        this.toastr.error(err.message);
      }
    }
  }

  addSalaryHead(event: any) {
    this.salaryHeadForm.markAllAsTouched();
    setTimeout(function () {
      let $_errFormControl = document.querySelectorAll('p.error-element');
      if ($_errFormControl.length > 0) {
        const firstErr: Element = $_errFormControl[0];
        firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    if (this.salaryHeadForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService
        .addSalaryHead({
          full_name: this.salaryHeadForm.value.full_name,
          head_type: this.salaryHeadForm.value.head_type,
          abbreviation: this.salaryHeadForm.value.abbreviation,
        })
        .subscribe(
          (res) => {
            if (res.status == 'success') {
              this.toastr.success(res.message);
              this.cancelSalaryHeadEntry();
              this.fetchSalaryHeads();
            } else if (res.status == 'val_err') {
              this.toastr.error(Global.showValidationMessage(res.val_msg));
            } else {
              this.toastr.error(res.message);
            }

            event.target.classList.remove('btn-loading');
          },
          (err) => {
            event.target.classList.remove('btn-loading');
            this.toastr.error(Global.showServerErrorMessage(err));
          }
        );
    }
  }

  cancelSalaryHeadEntry() {
    let modal: any = $('#salary-head-modal');
    modal.modal('hide');

    this.salaryHeadForm.reset();
  }

  getSelectedEarningHeadIncludes() {
    let modules: any[] = [];

    $('input[name="head_include_in[]"]:checked').each(function () {
      modules.push($(this).val());
    });

    return modules;
  }

  selectedEarningHeadForEdit(modules: any) {
    this.resetSelectedEarningHead();

    for (const key in modules) {
      if (Object.prototype.hasOwnProperty.call(modules, key)) {
        const element = modules[key];
        $('input[name="head_include_in[]"][value="' + element + '"]').prop(
          'checked',
          true
        );
      }
    }
  }

  resetSelectedEarningHead() {
    $('input[name="head_include_in[]"]:checked').each(function () {
      $(this).prop('checked', false);
    });
  }

  async openTemplateLibrary(e: any) {
    let res = await this.fetchTemplateLibrary(e);
    if (res) {
      $('#librarymmodalbutton').click();
    }
  }

  async fetchTemplateLibrary(e: any) {
    try {
      e.target.classList.add('btn-loading');
      let res = await this.companyuserService
        .fetchSalaryTemplatesLibrary({
          pageno: 1,
        })
        .toPromise();
      if (res.status !== 'success') throw res;
      this.salaryTemplatesLibraryList = res?.salarytemp_rule?.docs;
      e.target.classList.remove('btn-loading');
      return res;
    } catch (err: any) {
      e.target.classList.remove('btn-loading');
      if (err.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else {
        this.toastr.error(Global.showServerErrorMessage(err));
        this.toastr.error(err.message);
      }
    }
  }

  cloneTemp(temp: any) {
    this.getEditSalaryTemplate(temp, true);
    $('[data-dismiss="modal"]')?.click();
  }

  async openHeadsLibrary(e:any) {
    let res = await this.fetchSalaryHeadsLibrary(e);
    if (res) {
      $('#salaryHeadslibrarymmodalbutton').click();
    }
  }

  async cloneSalaryHead(head: any, closeBtn:any) {
    this.salaryHeadForm.patchValue({
      full_name: head.full_name,
      head_type: head.head_type,
      abbreviation: head.abbreviation,
    });
    closeBtn.click();
  }


  fetchSalaryTemplate() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        this.companyuserService
          .fetchSalaryTemplates({
            pageno: dataTablesParameters.start / Global.DataTableLength + 1,
            perpage: dataTablesParameters.length,
            searchkey: dataTablesParameters.search.value,
            sortbyfield: Global.getTableSortingOptions(
              'sortbyfield',
              dataTablesParameters
            ),
            ascdesc: Global.getTableSortingOptions(
              'ascdesc',
              dataTablesParameters
            ),
          })
          .subscribe(
            (res) => {
              if (res.status == 'success') {
                callback({
                  recordsTotal: res.salary_template.totalDocs,
                  recordsFiltered: res.salary_template.totalDocs,
                  data: res.salary_template.docs,
                });
              } else {
                this.toastr.error(res.message);

                callback({
                  recordsTotal: 0,
                  recordsFiltered: 0,
                  data: [],
                });
              }
            },
            (err) => {
              this.toastr.error(Global.showServerErrorMessage(err));

              callback({
                recordsTotal: 0,
                recordsFiltered: 0,
                data: [],
              });
            }
          );
      },
      columns: [
        {
          render: function (data, type, full, meta: any) {
            return meta.settings._iDisplayStart + (meta.row + 1);
          },
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            var btnstatus = '';
            if (full.status == 'active') {
              btnstatus = 'on';
            } else {
              btnstatus = 'off';
            }

            if(Global.checkCompanyModulePermission({
                  company_module:'company_rules_1',
                  company_sub_module: 'salary_template',
                  company_sub_operation: ['edit'],
                  company_strict: true
                })){
                  return (
                    `<div class="br-toggle br-toggle-rounded br-toggle-primary ` +
                    btnstatus +
                    `" id="changeStatusButton">\
                            <div class="br-toggle-switch"></div>\
                          </div>`
                  );
                }else{
                  return full?.status
                }

          },
          className: 'text-center text-capitalize',
          orderable: true,
          name: 'status',
        },
        {
          render: function (data, type, full, meta) {
            let html = ``;
            let flag: boolean = true;

            html +=
              `<button class="btn btn-info btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="View" id="viewButton-` +
              meta.row +
              `">
                        <div style="width:25px; height:25px;"><i class="fa fa-eye"></i></div>
                    </button>`;

            if (full.edit_status == 'active' && Global.checkCompanyModulePermission({
              company_module:'company_rules_1',
              company_sub_module: 'salary_template',
              company_sub_operation: ['edit'],
              company_strict: true
            })) {
              html +=
                `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Edit" id="editButton-` +
                meta.row +
                `">
                          <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
                      </button>`;
            }

            if (flag) return html;
            else return '-';
          },
          className: 'text-center',
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            return full.template_name ?? 'N/A';
          },
          orderable: true,
          name: 'template_name',
        },
        {
          render: function (data, type, full, meta) {
            return (
              `<span class="text-uppercase">` + (full.restricted_pf  ?? "N/A") + `</span>`
            );
          },
          orderable: true,
          name: 'restricted_pf',
        },
        {
          render: function (data, type, full, meta) {
            return full.voluntary_pf || 0;
          },
          orderable: true,
          name: 'voluntary_pf',
        },
        // {
        //   render: function (data, type, full, meta) {
        //     return `<span class="text-uppercase">` + full.no_pension + `</span>`;
        //   },
        //   orderable: true,
        //   name: 'no_pension'
        // },
        {
          render: function (data, type, full, meta) {
            return full.minimum_wage_amount || 0;
          },
          orderable: true,
          name: 'minimum_wage_amount',
        },
        {
          render: function (data, type, full, meta) {
            return full.minimum_wage_percentage || 0;
          },
          orderable: true,
          name: 'minimum_wage_percentage',
        },
        {
          render: function (data, type, full, meta) {
            return (
              `<span class="text-uppercase">` + (full.wage_applicable ?? "N/A") + `</span>`
            );
          },
          orderable: true,
          name: 'wage_applicable',
        },
      ],
      drawCallback: function (settings) {
        Global.loadCustomScripts('customJsScript');
      },
      rowCallback: (row: Node, data: any[] | Object, index: number) => {
        const self = this;

        $('table').on('click', '#viewButton-' + index, function () {
          self.viewSalaryTemplate(data);
        });

        $('table').on('click', '#editButton-' + index, function () {
          self.getEditSalaryTemplate(data);
        });

        // $('#changeStatusButton', row).bind('click', () => {
        //   self.changeStatus(data);
        // });

        return row;
      },
      pagingType: 'full_numbers',
      serverSide: true,
      processing: true,
      ordering: true,
      searching: true,
      pageLength: Global.DataTableLength,
      lengthChange: true,
      lengthMenu: Global.DataTableLengthChangeMenu,
      responsive: true,
      order: [],
      language: {
        searchPlaceholder: 'Search...',
        search: '',
      },
    };
  }

  viewSalaryTemplate(item: any) {
    (item?.earnings ?? []).forEach((element: any) => {
      element.attendance_relation = element.attendance_relation.replace(
        /_/gi,
        ' '
      );
    });
    this.salaryTempateDetails = item;
    $('#viewSalaryTemplateModalButton').click();
  }

  getEditSalaryTemplate(item: any, isAddFromLibrary: boolean = false) {
    this.cancelSalaryTemplateEntry();

    if (!isAddFromLibrary) {
      this.tempEditActionId = item._id;
    }

    this.salaryTemplateForm.patchValue({
      template_name: item.template_name ?? null,
      restricted_pf: item.restricted_pf ?? null,
      voluntary_pf: item.voluntary_pf ?? null,
      no_pension: item.no_pension ?? null,
      advance: item.advance == 'yes' ? true : false,
      minimum_wage_amount: item.minimum_wage_amount ?? null,
      minimum_wage_percentage: item.minimum_wage_percentage ?? null,
      wage_applicable: item.wage_applicable ?? null,
    });

    this.earnings = [];

    item.earnings.forEach((element: any) => {
      let earning:any = {
        head_id:  this.salaryHeads.find((obj: any) => {
          // if(){
            
            return obj.id == element.head_id;
          // }
        }) ?? null,

        priority:
          this.priorityMaster.find((obj: any) => {
            return obj.value == element.priority;
          }) ?? null,
          
        dependent_head:
          this.salaryHeads.find((obj: any) => {
            return obj.id == element.dependent_head;
          }) ?? null,

        attendance_relation:
          this.attendanceRelationMaster.find((obj: any) => {
            return obj.value == element.attendance_relation;
          }) ?? null,

        

        is_percentage: element.is_percentage == 'yes' ? true : false,
        percentage_amount: element.percentage_amount ?? null,
        head_include_in: element.head_include_in ?? [],
        earning_value: element.earning_value ?? null,
      }
      if(element.priority === 1 && earning.priority){
        earning.earning_type = { value: 1, description: "1" }
      }
      if(element?.earning_type == 'auto'){
        earning.earning_type = { value: 'auto', description: 'Auto' }
      }else{
        earning.earning_type = this.earningTypeMaster.find((obj: any) => {return obj.value == element.earning_type})
      }
      this.earnings.push(earning);
      this.dependentSalaryHeadsId.push(element?.head_id)
    });

    if (item.no_pension == 'yes') {
      $('#no-pension').addClass('on');
    }

    if (item.restricted_pf == 'yes') {
      $('#restricted-pf').addClass('on');
    }

    Global.scrollToQuery('#salarytemplate-submit-section');
  }

  markAdvance(e: any) {
    if (this.earnings.length) {
      Swal.fire({
        title: 'Warning!',
        text: 'All current earnings will be removed with this action!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Okay',
        cancelButtonText: 'Cancel',
      }).then((result) => {
        if (result.value) {
          // if(e?.target?.checked){
            this.salaryTemplateForm.get("advance")?.setValue(e?.target?.checked)
          // }else{
            this.earnings = [];
            this.earningSalaryHeads = [];
            this.dependentSalaryHeads = [];
            this.dependentSalaryHeadsId = [];
            if(e.target.checked){
              let earning = this.salaryEarningForm.value;
              earning.head_id = this.salaryHeads.find(head => head.pre_def_head == 'yes');
              earning.priority = {value:1, description:"1"};
              earning.earning_type = { value: 'auto', description: 'Auto' };
              earning.attendance_relation = { value: 'dependent', description: 'Dependent' };
              earning.dependent_head = [];
              earning.head_include_in = [];
              this.earnings.push(earning);
              this.dependentSalaryHeadsId.push(earning?.head_id?.id)
              this.salaryTemplateForm.get("advance")?.setValue(true)
            // console.log('yes');
              
            }
          // }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          e.target.checked = !e.target.checked
        }
      });
    }else{
        let earning = this.salaryEarningForm.value;
        earning.head_id = this.salaryHeads.find(head => head.pre_def_head == 'yes');
        earning.priority = {value:1, description:"1"};
        earning.earning_type = { value: 'auto', description: 'Auto' };
        earning.attendance_relation = { value: 'dependent', description: 'Dependent' },
        earning.dependent_head = [];
        earning.head_include_in = [];
        this.earnings.push(earning);
        this.dependentSalaryHeadsId.push(earning?.head_id?.id)
        this.salaryTemplateForm.get("advance")?.setValue(true)
    }
    // if(e?.target?.checked){
    //   if(this.earnings.length){
    //     Swal.fire({
    //       title: 'Warning!',
    //       text: 'All current earnings will be removed with this action!',
    //       icon: 'warning',
    //       showCancelButton: true,
    //       confirmButtonText: 'Okay',
    //       cancelButtonText: 'Cancel'
    //     }).then((result) => {
    //       if (result.value) {
           
    //       } else if (result.dismiss === Swal.DismissReason.cancel) {
           
    //       }
    //     })
    //   }else{
    //     let earning = this.salaryEarningForm.value;
    //     earning.head_id = this.salaryHeads.find(head => head.pre_def_head == 'yes');
    //     earning.priority = {value:1, description:"1"};
    //     earning.earning_type = { value: 'auto', description: 'Auto' };
    //     earning.dependent_head = [];
    //     earning.head_include_in = [];
    //     this.earnings.push(earning);
    //     this.dependentSalaryHeadsId.push(earning?.head_id?.id)
        
    //   }
    // }else{
    //   if(this.earnings.length){
    //     Swal.fire({
    //       title: 'Warning!',
    //       text: 'All current earnings will be removed with this action!',
    //       icon: 'warning',
    //       showCancelButton: true,
    //       confirmButtonText: 'Okay',
    //       cancelButtonText: 'Cancel'
    //     }).then((result) => {
    //       if (result.value) {
    //         if(this.earnings.length){
    //           this.earnings = this.earnings.filter(earning => earning?.head_id?.pre_def_head !== 'yes');
    //         }
    //       } else if (result.dismiss === Swal.DismissReason.cancel) {
    //         if(this.earnings.length){
    //               this.earnings = this.earnings.filter(earning => earning?.head_id?.pre_def_head !== 'yes');

    //             }
    //       }
    //     })
    //   }else{
        
    //   }
    // }  
  }

}
