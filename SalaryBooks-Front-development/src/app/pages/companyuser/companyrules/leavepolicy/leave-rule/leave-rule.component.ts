import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import swal from 'sweetalert2';
import PaginationOptions from 'src/app/models/PaginationOptions';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'companyuser-app-leave-rule',
  templateUrl: './leave-rule.component.html',
  styleUrls: ['./leave-rule.component.css'],
  encapsulation: ViewEncapsulation.None,

})
export class CMPLeaveRuleComponent implements OnInit {
  leaveRuleForm: UntypedFormGroup;
  leaveHeadForm: UntypedFormGroup;
  editActionId: String;
  dtOptions: DataTables.Settings = {};
  leaveTemplatesLibraryList:any[] = []
  private valueChangesSubscription: Subscription | undefined;
  res_on_avail: any;
  leaveHeadTypeMaster: any[] = [];
  leaveHeadMaster: any[] = [];
  tenureMaster: any[] = [];
  templateRows: any[] = [];

  Global = Global;
  paginationOptions: PaginationOptions;

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe,
    private router: Router,

  ) {


    if (
      !Global.checkCompanyModulePermission({
        company_module:"company_rules_1",
        company_sub_module: 'leave_policy',
        company_sub_operation: ['view'],
        company_strict: true,
      })
    ) {
      // const _this = this;
      // setTimeout(function () {
        router.navigate(['company/errors/unauthorized-access'], {
          skipLocationChange: true,
        });
        return
      // }, 500);
      // return;
    }


    this.leaveRuleForm = formBuilder.group({
      'template_name': [null, Validators.compose([Validators.required])],
      'template_data': this.formBuilder.array([
        this.initTemplateRows('template_data'),
      ]),
    }); 

    this.leaveHeadForm = formBuilder.group({
      head_type: [null, Validators.compose([Validators.required])],
      full_name: [null, Validators.compose([Validators.required])],
      abbreviation: [null, Validators.compose([Validators.required])],
    });

    this.editActionId = '';

    this.tenureMaster = [
      { value: "Annualy", description: "Annually" },
      { value: "Quaterly", description: "Quaterly" },
      { value: "Monthly", description: "Monthly" },
    ];

    this.leaveHeadTypeMaster = [
      { value: "earned", description: "Earned Leave" },
      { value: "com_defined", description: "Company Defined Leave" },
    ];

    this.paginationOptions = {
      hasNextPage: false,
      hasPrevPage: false,
      limit: Global.DataTableLength,
      nextPage: null,
      page: 1,
      pagingCounter: 1,
      prevPage: null,
      totalDocs: 0,
      totalPages: 1,
    };
  }

  async ngOnInit() {
    this.titleService.setTitle("Define Leave Rule - " + Global.AppName);

    await this.fetchLeaveHeads();
    this.fetch();
  }

  initTemplateRows(type: any, data: any = {}) {
    switch (type) {
      case 'template_data':
        // data = {
        //   leave_type: null,
        //   restriction_on_availment: "no",
        //   no_of_day: "15",
        //   restriction_tenure: null,
        //   leave_tenure: null,
        //   restriction_days: "18",
        //   carry_forward: "yes",
        //   cashable: "no",
        //   carry_forward_years: "2020",
        //   effective_form: "2021",
        // }

        return this.formBuilder.group({
          leave_type: [data.leave_type ?? null, Validators.compose([Validators.required])],
          restriction_on_availment: [data.restriction_on_availment ?? null, Validators.compose([Validators.required])],
          no_of_day: [data.no_of_day ?? null, Validators.compose([Validators.required])],
          no_of_working_day: [data.no_of_working_day ?? null, Validators.compose([])],
          restriction_tenure: [data.restriction_tenure ?? null, Validators.compose([Validators.required])],
          leave_tenure: [data.leave_tenure ?? null, Validators.compose([Validators.required])],
          restriction_days: [data.restriction_days ?? null, Validators.compose([Validators.required])],
          carry_forward: [data.carry_forward ?? null, Validators.compose([Validators.required])],
          cashable: [data.cashable ?? null, Validators.compose([Validators.required])],
          carry_forward_years: [data.carry_forward_years ?? null, Validators.compose([])],
          effective_form: [data.effective_form ?? null, Validators.compose([Validators.required])],
        });
        break;

      default:
        return this.formBuilder.group({});
        break;
    }
  }

  getTemplateRows(type: any) {
    return (this.leaveRuleForm.get(type) as UntypedFormArray).controls;
  }
  validationChange(i: any, res_on_avail: any = ''): void {
    // const control = this.leaveForm.get(`template_data.${i}.restriction_days`);
    if (res_on_avail !== '') {
      // const controls = ['restriction_tenure', 'restriction_days'];
        const controlResTen = this.leaveRuleForm.get(`template_data.${i}.restriction_tenure`);
        const controlResDays = this.leaveRuleForm.get(`template_data.${i}.restriction_days`);

        if (res_on_avail === 'no') {
          controlResDays?.clearValidators();
          controlResTen?.clearValidators();
          // if (controlName === 'restriction_days') {
          //   control?.setValidators([Validators.pattern('^[0-9]*(\\.[0-9]+)?$')]);
          // }
        } else {
          controlResDays?.setValidators([Validators.required]);
          controlResTen?.setValidators([Validators.required]);
        }

        controlResTen?.updateValueAndValidity();
        controlResDays?.updateValueAndValidity();
    }
    // Unsubscribe existing subscription if any
    if (this.valueChangesSubscription) {
      this.valueChangesSubscription.unsubscribe();
    }
    this.valueChangesSubscription = this.leaveRuleForm.get(`template_data.${i}.restriction_on_availment`)?.valueChanges?.subscribe((val: any) => {
      this.res_on_avail = val;
      // const controls = ['restriction_tenure', 'restriction_days'];
        const controlResTen = this.leaveRuleForm.get(`template_data.${i}.restriction_tenure`);
        const controlResDays = this.leaveRuleForm.get(`template_data.${i}.restriction_days`);

        if (val === 'no') {
          controlResTen?.clearValidators();
          controlResDays?.clearValidators();
          controlResTen?.reset();
          controlResDays?.reset();
         
        } else {          
          controlResTen?.setValidators([Validators.required]);
          controlResDays?.setValidators([Validators.required]);
        }

        controlResDays?.updateValueAndValidity();
        controlResTen?.updateValueAndValidity();
    });
  }
  removeTemplateRow(type: any, i: number) {
    const control = <UntypedFormArray>this.leaveRuleForm.get(type);
    control.removeAt(i);
  }

  addTemplateRows(type: any, data: any = {}) {
    const control = <UntypedFormArray>this.leaveRuleForm.get(type);
    control.push(this.initTemplateRows(type, data));

    Global.loadCustomScripts('customJsScript');
  }
  isRequired(index: number, controlName: string): boolean {
    const control = this.getTemplateRows('template_data')?.at(index)?.get(controlName);
    if (control && control.validator) {
      const validator = control.validator({} as AbstractControl);
      return validator && validator['required'];
    }
    return false;
  }
  resetAllTemplateRows(isEditing: any = false) {
    let arr = ['template_data'];
    arr.forEach(element => {
      const control = <UntypedFormArray>this.leaveRuleForm.get(element);
      control.clear();
    });

    if (isEditing == false) {
      arr.forEach(element => {
        this.addTemplateRows(element);
      });
    }
  }

  fetchLeaveHeads() {
    const _this = this;
    return new Promise((resolve, reject) => {
      _this.spinner.show();
      _this.companyuserService.fetchLeaveTemplateHeads({})
        .subscribe(res => {
          if (res.status == "success") {
            _this.leaveHeadMaster = [];
            for (const key in res.temp_head) {
              if (Object.prototype.hasOwnProperty.call(res.temp_head, key)) {
                const element = res.temp_head[key];
                _this.leaveHeadMaster.push({
                  "id": element._id,
                  "description": element.full_name + " (" + element.abbreviation + ")",
                  "full_name": element.full_name,
                  "head_type": element.head_type,
                  "abbreviation": element.abbreviation,
                });
              }
            }
          } else {
            _this.toastr.error(res.message);
          }

          _this.spinner.hide();
          resolve(true);
        }, (err) => {
          _this.toastr.error(Global.showServerErrorMessage(err));
          _this.spinner.hide();
          resolve(true);
        });
    });
  }

  cancelEntry(isEditing: any = false) {
    this.editActionId = '';
    this.resetAllTemplateRows(isEditing)
    Global.resetForm(this.leaveRuleForm);
    Global.scrollToQuery("#leave-rule-form")
    this.leaveHeadMaster.forEach(x=>{
      x.disabled=false;  
      })
  }

  getEdit(item: any, isNew?:boolean) {
    this.cancelEntry(true);
    if(!isNew) this.editActionId = item._id;
    var datePipe = new DatePipe("en-US");
    this.leaveRuleForm.patchValue({
      template_name:item?.template_name
    })
    let index:any
    item.template_data.forEach((element: any, i:any) => {
      let data: any = {
        'leave_type': this.leaveHeadMaster.find((obj: any) => {
          return obj.id == element.leave_type
        }) ?? null,
        'restriction_on_availment': element.restriction_on_availment ?? null,
        'no_of_day': element.no_of_day ?? null,
        'no_of_working_day': element.no_of_working_day ?? null,
        'restriction_tenure': this.tenureMaster.find((obj: any) => {
          return obj.value == element.restriction_tenure
        }) ?? null,
        'leave_tenure': this.tenureMaster.find((obj: any) => {
          return obj.value == element.leave_tenure
        }) ?? null,
        'restriction_days': element.restriction_days ?? null,
        'carry_forward': element.carry_forward ?? null,
        'cashable': element.cashable ?? null,
        'carry_forward_years': element.carry_forward_years ?? null,
        'effective_form': element.effective_form ? datePipe.transform(element.effective_form, 'yyyy-MM-dd') : null,
      }

      this.addTemplateRows('template_data', data);
      this.validationChange(i, element?.restriction_on_availment)
      index=this.leaveHeadMaster.findIndex(elem=>elem.id === element.leave_type);
      if(index!=-1)
      {
        this.leaveHeadMaster[index].disabled=true;
  
      }  
    });

    Global.scrollToQuery("#leave-rule-form")
  }

  add(event: any) {
    this.leaveRuleForm.markAllAsTouched();
    Global.scrollToQuery("p.text-danger")

    let template_data: any = this.getTemplateDataForSubmit();

    if (this.leaveRuleForm.valid && template_data) {
      event.target.classList.add('btn-loading');

      this.companyuserService.createLeaveTemplateRule({
        template_name: this.leaveRuleForm.value.template_name,
        template_data: JSON.stringify(template_data),
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.cancelEntry();

          this.fetch();
        } else if (res.status == 'val_err') {
          this.toastr.error(Global.showValidationMessage(res.val_msg));
        } else {
          this.toastr.error(res.message);
        }

        event.target.classList.remove('btn-loading');
      }, (err) => {
        event.target.classList.remove('btn-loading');
        this.toastr.error(Global.showServerErrorMessage(err));
      });
    }
  }

  edit(event: any) {
    this.leaveRuleForm.markAllAsTouched();
    Global.scrollToQuery("p.text-danger")

    let template_data: any = this.getTemplateDataForSubmit();

    if (this.leaveRuleForm.valid && template_data) {
      event.target.classList.add('btn-loading');

      this.companyuserService.updateLeaveTemplateRule({
        template_id: this.editActionId,
        template_name: this.leaveRuleForm.value.template_name,
        template_data: JSON.stringify(template_data),
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.fetch();
        } else if (res.status == 'val_err') {
          this.toastr.error(Global.showValidationMessage(res.val_msg));
        } else {
          this.toastr.error(res.message);
        }

        event.target.classList.remove('btn-loading');
      }, (err) => {
        event.target.classList.remove('btn-loading');
        this.toastr.error(Global.showServerErrorMessage(err));
      });
    }
  }

  fetch(page: any = null) {
    if (page != null) {
      this.paginationOptions.page = page;
    }

    this.spinner.show();
    this.companyuserService.fetchLeaveTemplateRules({
      'pageno': this.paginationOptions.page,
      'perpage': this.paginationOptions.limit,
    }).subscribe(res => {
      if (res.status == 'success') {
        this.templateRows = res.leave_rule.docs;

        this.paginationOptions = {
          hasNextPage: res.leave_rule.hasNextPage,
          hasPrevPage: res.leave_rule.hasPrevPage,
          limit: res.leave_rule.limit,
          nextPage: res.leave_rule.nextPage,
          page: res.leave_rule.page,
          pagingCounter: res.leave_rule.pagingCounter,
          prevPage: res.leave_rule.prevPage,
          totalDocs: res.leave_rule.totalDocs,
          totalPages: res.leave_rule.totalPages,
        };
      } else {
        this.toastr.error(res.message);

        this.templateRows = [];
        this.paginationOptions = {
          hasNextPage: false,
          hasPrevPage: false,
          limit: Global.DataTableLength,
          nextPage: null,
          page: 1,
          pagingCounter: 1,
          prevPage: null,
          totalDocs: 0,
          totalPages: 1,
        };
      }

      this.spinner.hide();
      Global.loadCustomScripts('customJsScript');
    }, (err) => {
      this.templateRows = [];
      this.paginationOptions = {
        hasNextPage: false,
        hasPrevPage: false,
        limit: Global.DataTableLength,
        nextPage: null,
        page: 1,
        pagingCounter: 1,
        prevPage: null,
        totalDocs: 0,
        totalPages: 1,
      };

      this.spinner.hide();
      this.toastr.error(Global.showServerErrorMessage(err));
      Global.loadCustomScripts('customJsScript');
    });
  }

  // fetch() {
  //   this.dtOptions = {
  //     ajax: (dataTablesParameters: any, callback) => {
  //       this.companyuserService.fetchLeaveTemplateRules({
  //         'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
  //         'searchkey': dataTablesParameters.search.value,
  //         'sortbyfield': Global.getTableSortingOptions('sortbyfield', dataTablesParameters),
  //         'ascdesc': Global.getTableSortingOptions('ascdesc', dataTablesParameters)
  //       }).subscribe(res => {
  //         if (res.status == 'success') {
  //           callback({
  //             recordsTotal: res.leave_rule.totalDocs,
  //             recordsFiltered: res.leave_rule.totalDocs,
  //             data: res.leave_rule.docs,
  //           });
  //         } else {
  //           this.toastr.error(res.message);

  //           callback({
  //             recordsTotal: 0,
  //             recordsFiltered: 0,
  //             data: [],
  //           });
  //         }
  //       }, (err) => {
  //         this.toastr.error(Global.showServerErrorMessage(err));

  //         callback({
  //           recordsTotal: 0,
  //           recordsFiltered: 0,
  //           data: [],
  //         });
  //       });
  //     },
  //     columns: [
  //       {
  //         render: function (data, type, full, meta) {
  //           return full.effective_form ?? "N/A";
  //         },
  //         orderable: true,
  //         name: 'effective_form'
  //       },
  //       {
  //         render: function (data, type, full, meta) {
  //           return `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Edit" id="editButton-` + meta.row + `">
  //                       <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
  //                   </button>
  //                   <button class="btn btn-danger btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Delete" id="deleteButton-`+ meta.row + `">
  //                       <div style="width:25px; height:25px;"><i class="fa fa-trash"></i></div>
  //                   </button>`;
  //         },
  //         className: 'text-center',
  //         orderable: false
  //       },
  //       {
  //         render: function (data, type, full, meta) {
  //           return full.leave_type ?? "N/A";
  //         },
  //         orderable: true,
  //         name: 'leave_type'
  //       },
  //       {
  //         render: function (data, type, full, meta) {
  //           return full.leave_type ?? "N/A";
  //         },
  //         orderable: true,
  //         name: 'leave_type'
  //       },
  //       {
  //         render: function (data, type, full, meta) {
  //           return full.leave_tenure ?? "N/A";
  //         },
  //         orderable: true,
  //         name: 'leave_tenure'
  //       },
  //       {
  //         render: function (data, type, full, meta) {
  //           return full.no_of_day ?? "N/A";
  //         },
  //         orderable: true,
  //         name: 'no_of_day'
  //       },
  //       {
  //         render: function (data, type, full, meta) {
  //           return full.carry_forward ?? "N/A";
  //         },
  //         orderable: true,
  //         name: 'carry_forward'
  //       },
  //       {
  //         render: function (data, type, full, meta) {
  //           return full.carry_forward_years ?? "N/A";
  //         },
  //         orderable: true,
  //         name: 'carry_forward_years'
  //       },
  //       {
  //         render: function (data, type, full, meta) {
  //           return full.restriction_on_availment ?? "N/A";
  //         },
  //         orderable: true,
  //         name: 'restriction_on_availment'
  //       },
  //       {
  //         render: function (data, type, full, meta) {
  //           return full.restriction_tenure ?? "N/A";
  //         },
  //         orderable: true,
  //         name: 'restriction_tenure'
  //       },
  //       {
  //         render: function (data, type, full, meta) {
  //           return full.restriction_days ?? "N/A";
  //         },
  //         orderable: true,
  //         name: 'restriction_days'
  //       },
  //       {
  //         render: function (data, type, full, meta) {
  //           return full.cashable ?? "N/A";
  //         },
  //         orderable: true,
  //         name: 'cashable'
  //       },
  //     ],
  //     drawCallback: function (settings) {
  //       Global.loadCustomScripts('customJsScript');
  //     },
  //     rowCallback: (row: Node, data: any[] | Object, index: number) => {
  //       const self = this;

  //       $("table").on('click', '#editButton-' + index, function () {
  //         self.getEdit(data);
  //       });

  //       $("table").on('click', '#deleteButton-' + index, function () {
  //         self.deleteItem(data);
  //       });

  //       return row;
  //     },
  //     pagingType: 'full_numbers',
  //     serverSide: true,
  //     processing: true,
  //     ordering: true,
  //     order: [],
  //     searching: true,
  //     pageLength: Global.DataTableLength,
  //     lengthChange: true, lengthMenu: Global.DataTableLengthChangeMenu,
  //     responsive: true,
  //     language: {
  //       searchPlaceholder: 'Search...',
  //       search: ""
  //     }
  //   };
  // }

  deleteItem(item: any) {
    swal.fire({
      title: 'Are you sure want to remove?',
      text: 'You will not be able to recover this data!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it'
    }).then((result) => {
      if (result.value) {
        this.companyuserService.deleteLeaveTemplateRule({
          'template_id': item._id,
        }).subscribe(res => {
          if (res.status == 'success') {
            this.toastr.success(res.message);
            this.fetch();
          } else {
            this.toastr.error(res.message);
          }
        }, (err) => {
          this.toastr.error(Global.showServerErrorMessage(err));
        });
      } else if (result.dismiss === swal.DismissReason.cancel) {
        swal.fire(
          'Cancelled',
          'Your data is safe :)',
          'error'
        )
      }
    })
  }

  getLeaveTypeDetails(id: any, key: any = null) {
    let leave_type = this.leaveHeadMaster.find((obj: any) => {
      return obj.id == id
    })

    if (leave_type) {
      if (key) {
        return leave_type[key];
      } else {
        return leave_type;
      }
    } else {
      return null;
    }
  }

  getTemplateDataForSubmit() {
    let template_data: any = [];
    let flag = true;
    let row = 1;

    this.leaveRuleForm.value.template_data.forEach((element: any) => {
      if (element.carry_forward == 'yes' && !element.carry_forward_years) {
        flag = false;
        this.toastr.error("For Row " + row + ": When the Carry Forward is selected as YES, you must enter the Carry Forward Years");
      }

      if (element.leave_type?.head_type == 'earned' && !element.no_of_working_day) {
        flag = false;
        this.toastr.error("For Row " + row + ": When the Leave Type is earned, you must enter the number of working days");
      }

      template_data.push({
        "leave_type": element.leave_type?.id ?? "",
        "restriction_on_availment": element.restriction_on_availment,
        "no_of_working_day": element.no_of_working_day ?? "",
        "no_of_day": element.no_of_day ?? "",
        "restriction_tenure": element.restriction_tenure?.value ?? "",
        "leave_tenure": element.leave_tenure?.value ?? "",
        "restriction_days": element.restriction_days,
        "carry_forward": element.carry_forward,
        "cashable": element.cashable,
        "carry_forward_years": element.carry_forward_years,
        "effective_form": element.effective_form,
      })

      row++;
    });

    if (!flag) {
      return false;
    }

    if (template_data.length > 0) {
      return template_data;
    } else {
      this.toastr.error("You must add atleast one template to submit the details");
      return false;
    }
  }

  addLeaveHead() {
    Global.resetForm(this.leaveHeadForm);
    $('#leavehead-form-modal').show();
  }

  submitLeaveHead(event: any) {
    this.leaveHeadForm.markAllAsTouched();
    Global.scrollToQuery("p.text-danger")

    if (this.leaveHeadForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService.createLeaveTemplateHead({
        full_name: this.leaveHeadForm.value.full_name ?? "",
        abbreviation: this.leaveHeadForm.value.abbreviation ?? "",
        head_type: this.leaveHeadForm.value.head_type?.value ?? "",
        head_id: this.editActionId ?? "",
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.cancelEntry();
          this.fetchLeaveHeads();
        } else if (res.status == 'val_err') {
          this.toastr.error(Global.showValidationMessage(res.val_msg));
        } else {
          this.toastr.error(res.message);
        }

        event.target.classList.remove('btn-loading');
      }, (err) => {
        event.target.classList.remove('btn-loading');
        this.toastr.error(Global.showServerErrorMessage(err));
      });
    }
  }

  cancelLeaveHeadEntry() {
    Global.resetForm(this.leaveHeadForm);
    $('#leavehead-form-modal').hide();
  }

  templateLeaveTypeChanged(index: any) {
    let data = this.leaveRuleForm.value.template_data[index];

    if(data?.leave_type?.head_type == "earned"){
      $('#workingdays-field-' + index).show();
    } else{
      $('#workingdays-field-' + index).hide();
    }
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
        .fetchLeaveTemplatesLibrary({
          pageno: 1,
        })
        .toPromise();
      if (res.status !== 'success') throw res;
      this.leaveTemplatesLibraryList = res?.sleavetemp_rule?.docs;
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
    this.getEdit(temp, true);
    $('[data-dismiss="modal"]')?.click();
  }
  changeLeave(ev:any,i:any)
  {
    this.leaveHeadMaster.forEach(x=>{
      x.disabled=false;  
      })
      if(this.leaveRuleForm.value?.template_data)
      {
        this.leaveRuleForm.value?.template_data.forEach((x:any)=>{

        if(x.leave_type?.id!=undefined)
        {

          let index:any=this.leaveHeadMaster.findIndex(elem=>elem.id == x.leave_type?.id);
          if(index!=-1)
          {
            this.leaveHeadMaster[index].disabled=true;
      
          }  
        }  
        

        })
      }
   
   
  }

}
