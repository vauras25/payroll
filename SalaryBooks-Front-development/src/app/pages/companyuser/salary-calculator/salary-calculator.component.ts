import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';

@Component({
  selector: 'companyuser-app-salary-calculator',
  templateUrl: './salary-calculator.component.html',
  styleUrls: ['./salary-calculator.component.css']
})
export class CMPSalaryCalculatorComponent implements OnInit {
  salaryCalculationForm: UntypedFormGroup;
  ctcgrossDatabale: DataTables.Settings = {};

  calculationTypeMaster: any[];
  salaryTemplateMaster: any[];
  stateMaster: any[];

  Global = Global;

  calulatedSalaryData: any = null;
  calulatedSalaryEpfoTemp: any = null;
  calulatedSalaryEsicTemp: any = null;
  calulatedSalaryTemp: any = null;

  calculate_type: any = 'grosstoctc';

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    protected companyuserService: CompanyuserService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
  ) {
    this.salaryCalculationForm = formBuilder.group({
      calculate_type: [null, Validators.compose([])],
      salary_template: [null, Validators.compose([Validators.required])],
      state: [null, Validators.compose([Validators.required])],
      table_view: [null, Validators.compose([])],
      amount: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])],
      from_amount: [null, Validators.compose([])],
      to_amount: [null, Validators.compose([])],
      amount_span: [null, Validators.compose([])],
    });

    this.calculationTypeMaster = [
      // { value: "ctctogross", description: "From CTC to Gross" },
      { value: "grosstoctc", description: "From Gross to CTC" },
    ];

    this.salaryTemplateMaster = [];
    this.stateMaster = [];

    this.fetchSalaryTemplate();
    this.fetchStates();

    this.salaryCalculationForm.get('table_view')?.valueChanges.subscribe(val => {
      this.resetCalculatedData()

      if (val) {
        this.salaryCalculationForm.controls['from_amount'].setValidators([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])
        this.salaryCalculationForm.controls['to_amount'].setValidators([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])
        this.salaryCalculationForm.controls['amount_span'].setValidators([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])

        this.salaryCalculationForm.controls['amount'].clearValidators();
        this.calculate_type = 'ctctogross';
      } else {
        this.salaryCalculationForm.controls['from_amount'].clearValidators();
        this.salaryCalculationForm.controls['to_amount'].clearValidators();
        this.salaryCalculationForm.controls['amount_span'].clearValidators();

        this.salaryCalculationForm.controls['amount'].setValidators([Validators.required, Validators.pattern("^[0-9]+(.[0-9]{0,2})?$")])
        this.calculate_type = 'grosstoctc';
      }

      this.salaryCalculationForm.controls['from_amount'].updateValueAndValidity();
      this.salaryCalculationForm.controls['to_amount'].updateValueAndValidity();
      this.salaryCalculationForm.controls['amount_span'].updateValueAndValidity();
      this.salaryCalculationForm.controls['amount'].updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.titleService.setTitle("Salary Calculator - " + Global.AppName);

    this.ctcgrossDatabale = {
      ajax: (dataTablesParameters: any, callback) => {
        var result = this.getCtcGrossData();

        callback({
          recordsTotal: result.length,
          recordsFiltered: result.length,
          data: result,
        });
      },
      columns: [
        {
          render: function (data, type, full, meta: any) {
            return meta.settings._iDisplayStart + (meta.row + 1)
          },
          className: 'text-center',
        },
        {
          render: function (data, type, full, meta: any) {
            return Global.viewRupeeFormat(full.ctc_amount) + ' (₹)';
          },
          className: 'text-center',
        },
        {
          render: function (data, type, full, meta: any) {
            return Global.viewRupeeFormat(full.gross_earning) + ' (₹)';
          },
          className: 'text-center',
        },
        // {
        //   render: function (data, type, full, meta: any) {
        //     return Global.viewRupeeFormat(full.gross_deduct) + ' (₹)';
        //   },
        //   className: 'text-center',
        // },
        {
          render: function (data, type, full, meta: any) {
            return Global.viewRupeeFormat(full.net_take_home) + ' (₹)';
          },
          className: 'text-center',
        },
      ],
      searching: true,
      lengthChange: true,
      lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]],
      responsive: true,
      language: {
        searchPlaceholder: 'Search...',
        search: ""
      }
    }

    // this.salaryCalculationForm.patchValue({
    //   "calculate_type": null,
    //   "salary_template": {
    //     "id": "61e90672d7aee7eee842aa55",
    //     "description": "dj template 001"
    //   },
    //   "state": {
    //     "id": 4019,
    //     "description": "Lakshadweep"
    //   },
    //   "table_view": true,
    //   "amount": null,
    //   "from_amount": "10000",
    //   "to_amount": "20000",
    //   "amount_span": "100"
    // })

    // this.submit(null)
  }

  submit(event: any) {
    this.salaryCalculationForm.markAllAsTouched();
    Global.scrollToQuery('p.error-element')

    if (this.salaryCalculationForm.valid) {
      if (this.calculate_type == 'ctctogross') {
        if (parseFloat(this.salaryCalculationForm.value.from_amount) > parseFloat(this.salaryCalculationForm.value.to_amount)) {
          this.toastr.error("The ending amount should be greater than starting amount");
          return;
        }
      }

      event?.target.classList.add('btn-loading');
      this.spinner.show();

      let payload: any = {
        'calculate_type': this.calculate_type ?? "",
        'table_view': this.salaryCalculationForm.value.table_view ? "yes" : "no",
        'salary_template': this.salaryCalculationForm.value.salary_template?.id ?? "",
        'amount': this.salaryCalculationForm.value.amount ?? "",
        'state': this.salaryCalculationForm.value.state?.description ?? "",
        'from_amount': this.salaryCalculationForm.value.from_amount ?? "",
        'to_amount': this.salaryCalculationForm.value.to_amount ?? "",
        'amount_span': this.salaryCalculationForm.value.amount_span ?? "",
      }

      this.companyuserService.calculateSalary(payload)
        .subscribe(res => {
          if (res.status == 'success') {
            this.calulatedSalaryData = res?.data ?? null;
            // console.log(this.calulatedSalaryData)
            this.calulatedSalaryEpfoTemp = res?.epfo_temp ?? null;
            this.calulatedSalaryEsicTemp = res?.esic_temp ?? null;
            this.calulatedSalaryTemp = res?.salary_template ?? null;

            if (this.calculate_type == 'ctctogross') {
              $('#ctctogross-datatable').dataTable().api().ajax.reload();
            }
          } else if (res.status == 'val_err') {
            this.toastr.error(Global.showValidationMessage(res.val_msg));
            this.resetCalculatedData();
          } else {
            this.toastr.error(res.message);
            this.resetCalculatedData();
          }

          this.spinner.hide();
          event?.target.classList.remove('btn-loading');
        }, (err) => {
          this.spinner.hide();
          event?.target.classList.remove('btn-loading');
          this.toastr.error(Global.showServerErrorMessage(err));
          this.resetCalculatedData();
        });
    }
  }

  fetchSalaryTemplate() {
    this.spinner.show();

    this.companyuserService.fetchSalaryTemplates({
      pageno: 1
    }).subscribe(res => {
      if (res.status == 'success') {
        if (res.salary_template.docs.length > 0) {
          this.salaryTemplateMaster = [];

          res.salary_template.docs.forEach((element: any) => {
            if (element.status == 'active') {
              this.salaryTemplateMaster.push({ 'id': element._id, 'description': element.template_name });
            }
          });
        }
      } else {
        this.toastr.error(res.message);
      }
      this.spinner.hide();
    }, (err) => {
      this.toastr.error(Global.showServerErrorMessage(err));
      this.spinner.hide();
    });
  }

  fetchStates() {
    this.spinner.show();

    this.companyuserService.fetchStates()
      .subscribe(res => {
        if (res.status == "success") {
          this.stateMaster = [];
          for (const key in res.state_list[0].states) {
            if (Object.prototype.hasOwnProperty.call(res.state_list[0].states, key)) {
              const element = res.state_list[0].states[key];
              this.stateMaster.push({ "id": element.id, "description": element.name });
            }
          }
        } else {
          this.toastr.error(res.message);
        }

        this.spinner.hide();
      }, (err) => {
        this.toastr.error(Global.showServerErrorMessage(err));
        this.spinner.hide();
      });
  }
  salaryTmpSearch(keyword: any) {
    return new Promise((resolve, reject) => {
      // const currentDraw = this.employeeSearchDraw;
      this.companyuserService
        .fetchSalaryTemplates({
          pageno: 1,
          searchkey: keyword,
        })
        ?.subscribe(
          (res) => {
            if (res.status == 'success') {
              // if (currentDraw >= this.employeeSearchDraw) {
                this.salaryTemplateMaster = [];
                // let employees: any[] = res.employees.docs ?? [];
                res.salary_template.docs.forEach((element: any) => {
                  if (element.status == 'active') {
                    this.salaryTemplateMaster.push({ 'id': element._id, 'description': element.template_name });
                  }
                });
              // }
            } else {
              this.salaryTemplateMaster = [];
              this.toastr.error(res.message);
            }

            resolve(true);
          },
          (err) => {
            this.salaryTemplateMaster = [];
            this.toastr.error(Global.showServerErrorMessage(err));
            resolve(true);
          }
        );
    });
  }
  resetCalculatedData(formReset: any = false) {
    this.calulatedSalaryData = null;
    this.calulatedSalaryEpfoTemp = null;
    this.calulatedSalaryEsicTemp = null;
    this.calulatedSalaryTemp = null;

    if (formReset) {
      Global.resetForm(this.salaryCalculationForm)
    }
  }

  getCtcGrossData() {
    if (Array.isArray(this.calulatedSalaryData)) {
      return this.calulatedSalaryData
    } else {
      return [];
    }
  }
}
