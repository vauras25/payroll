import { Component, OnInit } from '@angular/core';
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { disableDebugTools, Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import swal from 'sweetalert2';
import { NgxSpinnerService } from 'ngx-spinner';

import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { Router } from '@angular/router';

@Component({
  selector: 'companyuser-app-bank-payment',
  templateUrl: './bank-payment.component.html',
  styleUrls: ['./bank-payment.component.css'],
})
export class CMPBankPaymentComponent implements OnInit {
  Global = Global;
  dtOptions: DataTables.Settings = {};

  bankPaymentForm: UntypedFormGroup;
  dropdownValueForm: UntypedFormGroup;

  editActionId: String = '';
  editActionItem: any = null;

  initFieldsMaster: any[];
  dbFieldsMaster: any[] = [];
  columnDropdownMaster: any[] = [];

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private companyuserService: CompanyuserService,
    private router:Router ,
    private spinner: NgxSpinnerService
  ) {

    
    if (
        !Global.checkCompanyModulePermission({
          company_module: 'master',
          company_sub_module:"bank_payment",
          company_sub_operation: ['add', 'edit', 'delete', 'view'],
          company_strict: true,
        })
      ) {
        // const _this = this;
        // setTimeout(function () {
          router.navigate(['company/errors/unauthorized-access'], {
            skipLocationChange: true,
          });
        // }, 500);
        return;
      }
    this.bankPaymentForm = formBuilder.group({
      template_name: [null, Validators.compose([Validators.required])],
      dropdown_value: this.formBuilder.array([
        this.initTemplateRows('dropdown_value'),
      ]),
      staticdropdown_value: this.formBuilder.array([
        this.initTemplateRows('staticdropdown_value'),
      ]),
      column_list: this.formBuilder.array([
        this.initTemplateRows('column_list'),
      ]),
    });

    this.dropdownValueForm = formBuilder.group({
      column_value: [null, Validators.compose([Validators.required])],
      column_lable: [null, Validators.compose([Validators.required])],
    });

    this.initFieldsMaster = [
      { column_value: '', column_lable: 'Co. Account Number' },
      { column_value: '', column_lable: 'Co. IFSC Code' },
      { column_value: '', column_lable: 'Co. Bank Name' },
      // { column_value: '', column_lable: 'Co. Amount' },
    ];

    this.dbFieldsMaster = [
      { column_value: 'emp_id', column_lable: 'Employee ID' },
      { column_value: 'emp_name', column_lable: 'Employee Name' },
      { column_value: 'emp_mob', column_lable: 'Employee Mobile' },
      { column_value: 'email_id', column_lable: 'Employee Email' },
      { column_value: 'account_no', column_lable: 'Employee Account Number' },
      { column_value: 'ifsc_code', column_lable: 'Employee IFSC Code' },
      { column_value: 'bank_name', column_lable: 'Employee Bank Name' },
      { column_value: 'net_take_home', column_lable: 'Employee Net Pay' },
    ];
  }

  ngOnInit() {
    this.titleService.setTitle('Bank Payment - ' + Global.AppName);

    this.fetch();
    this.initForm();
  }

  initForm(type: any = 'all') {
    if (['all'].includes(type)) {
      this.resetAllTemplateRows(true);
    } else if (['onlycolumn', 'refreshlabelvalues'].includes(type)) {
      this.resetAllTemplateRows(true, ['column_list']);
    }

    if (['all'].includes(type)) {
      this.columnDropdownMaster = [];

      // this.addTemplateRows('dropdown_value', { column_value: null, column_lable: "Blank", });
      this.columnDropdownMaster.push({
        type: 'static',
        value: '',
        label: 'Blank',
      });

      this.dbFieldsMaster.forEach((field: any) => {
        // this.addTemplateRows('dropdown_value', { column_value: field.column_value ?? null, column_lable: field.column_lable ?? null, });
        this.columnDropdownMaster.push({
          type: 'dynamic',
          value: field.column_value ?? '',
          label: field.column_lable ?? '',
        });
      });

      this.initFieldsMaster.forEach((field) => {
        this.addTemplateRows('staticdropdown_value', {
          column_value: field.column_value ?? null,
          column_lable: field.column_lable ?? null,
        });
        this.columnDropdownMaster.push({
          type: 'static',
          value: field.column_value ?? '',
          label: field.column_lable ?? '',
        });
      });
    } else if (['refreshlabelvalues'].includes(type)) {
      this.columnDropdownMaster = [];
      this.columnDropdownMaster.push({
        type: 'static',
        value: '',
        label: 'Blank',
      });

      this.getTemplateRows('staticdropdown_value')
        .concat(this.getTemplateRows('dropdown_value'))
        .forEach((field: any) => {
          this.columnDropdownMaster.push({
            type: 'static',
            value: field?.value?.column_value ?? '',
            label: field?.value?.column_lable ?? '',
          });
        });

      this.dbFieldsMaster.forEach((field: any) => {
        this.columnDropdownMaster.push({
          type: 'dynamic',
          value: field.column_value ?? '',
          label: field.column_lable ?? '',
        });
      });
    }

    if (['all', 'onlycolumn', 'refreshlabelvalues'].includes(type)) {
      for (let index = 0; index < 3; index++) {
        this.addTemplateRows('column_list');
      }
    }
  }

  fetch() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        this.companyuserService
          .fetchBankSheets({
            pageno: Math.floor(
              (dataTablesParameters.start + dataTablesParameters.length) /
                dataTablesParameters.length
            ),
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
                  recordsTotal: res.templates.totalDocs,
                  recordsFiltered: res.templates.totalDocs,
                  data: res.templates.docs,
                });
              } else {
                this.toastr.error(res.message);

                callback({
                  recordsTotal: [],
                  recordsFiltered: [],
                  data: [],
                });
              }
            },
            (err) => {
              this.toastr.error(Global.showServerErrorMessage(err));

              callback({
                recordsTotal: [],
                recordsFiltered: [],
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
        // {
        //   render: function (data, type, full, meta) {
        //     var btnstatus = "";
        //     if (full.status == "active") {
        //       btnstatus = 'on';
        //     } else {
        //       btnstatus = 'off';
        //     }

        //     return `<div class="br-toggle br-toggle-rounded br-toggle-primary ` + btnstatus + `" id="changeStatusButton">\
        //               <div class="br-toggle-switch"></div>\
        //             </div>`;
        //   },
        //   className: 'text-center',
        //   orderable: true,
        //   name: 'status'
        // },
        {
          render: function (data, type, full, meta) {
            let html = '';

           if( Global.checkCompanyModulePermission({
                company_module: 'master',
                company_sub_module:"bank_payment",
                company_sub_operation: ['view'],
                company_strict: true,
            })){
                html +=
                `<button class="btn btn-dark btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Export" id="exportButton-` +
                meta.row +
                `">
                              <div style="width:25px; height:25px;"><i class="fa fa-download"></i></div>
                          </button>`;
            }
            
                       

           if( Global.checkCompanyModulePermission({
                company_module: 'master',
                company_sub_module:"bank_payment",
                company_sub_operation: ['edit'],
                company_strict: true,
              })){
                html +=
                `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Edit" id="editButton-` +
                meta.row +
                `">
                              <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
                          </button>`;
              }

           if( Global.checkCompanyModulePermission({
                company_module: 'master',
                company_sub_module:"bank_payment",
                company_sub_operation: ['delete'],
                company_strict: true,
              })){
                html +=
                `<button class="btn btn-danger btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Delete" id="deleteButton-` +
                meta.row +
                `">
                              <div style="width:25px; height:25px;"><i class="fa fa-trash"></i></div>
                          </button>`;
              }

          

         

           

            return html;
          },
          className: 'text-center',
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            return full.template_name;
          },
          orderable: true,
          name: 'template_name',
        },
      ],
      rowCallback: (row: Node, data: any[] | Object, index: number) => {
        const self = this;
        $('table').on('click', '#exportButton-' + index, function () {
          self.exportTemplate(data);
        });

        $('table').on('click', '#editButton-' + index, function () {
          self.getEdit(data);
        });

        $('table').on('click', '#deleteButton-' + index, function () {
          self.deleteItem(data);
        });

        $('#changeStatusButton', row).bind('click', () => {
          self.changeStatus(data);
        });
        return row;
      },
      drawCallback: function (settings) {
        Global.loadCustomScripts('customJsScript');
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

  getEdit(item: any) {
    this.cancelEdit();
    this.resetAllTemplateRows(true);
    this.editActionId = item._id;
    this.editActionItem = item;
    this.bankPaymentForm.patchValue({
      template_name: item?.template_name ?? null,
    });

    this.columnDropdownMaster = [];
    (item?.dropdown_value ?? []).forEach((element: any) => {
      this.columnDropdownMaster.push({
        type: element.type,
        value: element.column_value,
        label: element.column_lable,
      });
    });

    (item?.column_list ?? []).forEach((element: any) => {
      let label = element?.column_lable;
      if (!label) label = 'Blank';

      this.addTemplateRows('column_list', {
        option:
          this.columnDropdownMaster.find((obj: any) => {
            return obj.label == label;
          }) ?? null,
      });
    });
  }

  cancelEdit() {
    $('html, body').animate({
      scrollTop: $('#letterwriting-submit-section').position().top,
    });

    this.editActionId = '';
    this.editActionItem = null;
    Global.resetForm(this.bankPaymentForm);
    this.initForm();
  }

  create(event: any) {
    if (this.bankPaymentForm.valid) {
      let document = this.fetchDocumentForEntry();

      event.target.classList.add('btn-loading');
      this.companyuserService.createBankSheet(document).subscribe(
        (res) => {
          if (res.status == 'success') {
            this.toastr.success(res.message);
            this.cancelEdit();
            $('#my-datatable')
              .dataTable()
              .api()
              .ajax.reload(function (json) {}, false);
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

  deleteItem(item: any) {
    swal
      .fire({
        title: 'Are you sure want to remove?',
        text: 'You will not be able to recover this data!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, keep it',
      })
      .then((result) => {
        if (result.value) {
          this.spinner.show();
          this.companyuserService
            .deleteBankSheet({
              template_id: item._id,
            })
            .subscribe(
              (res) => {
                this.spinner.hide();
                if (res.status == 'success') {
                  this.toastr.success(res.message);
                  $('#my-datatable')
                    .dataTable()
                    .api()
                    .ajax.reload(function (json) {}, false);
                } else {
                  this.toastr.error(res.message);
                }
              },
              (err) => {
                this.spinner.hide();
                this.toastr.error(Global.showServerErrorMessage(err));
              }
            );
        } else if (result.dismiss === swal.DismissReason.cancel) {
          swal.fire('Cancelled', 'Your data is safe :)', 'error');
        }
      });
  }

  update(event: any) {
    if (this.bankPaymentForm.valid) {
      let document = this.fetchDocumentForEntry();
      document.template_id = this.editActionId;

      event.target.classList.add('btn-loading');
      this.companyuserService.updateBankSheet(document).subscribe(
        (res) => {
          if (res.status == 'success') {
            this.toastr.success(res.message);
            $('#my-datatable')
              .dataTable()
              .api()
              .ajax.reload(function (json) {}, false);
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

  changeStatus(item: any) {
    this.spinner.show();
    this.companyuserService
      .changeLetterWritingTemplateStatus({
        template_id: item._id,
        status: item.status == 'active' ? 'inactive' : 'active',
      })
      .subscribe(
        (res) => {
          if (res.status == 'success') {
            this.toastr.success(res.message);
            $('#my-datatable')
              .dataTable()
              .api()
              .ajax.reload(function (json) {}, false);
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

  fetchDocumentForEntry() {
    let document: any = {
      template_name: this.bankPaymentForm?.value?.template_name ?? '',
      column_list: [],
      dropdown_value: [],
    };

    let i = 0;
    (this.bankPaymentForm.value.column_list ?? []).forEach((element: any) => {
      let column_value = element?.option?.value ?? '';
      let column_lable = element?.option?.label ?? '';

      if (column_lable == 'Blank') {
        column_value = '';
        column_lable = '';
      }

      document.column_list.push({
        column_id: i++,
        column_value: column_value ?? '',
        column_lable: column_lable ?? '',
        type: element?.option?.type ?? '',
      });
    });

    if (!this.editActionItem) {
      (this.columnDropdownMaster ?? []).forEach((element: any) => {
        document.dropdown_value.push({
          column_value: element.value ?? '',
          column_lable: element.label ?? '',
          type: element.type ?? '',
        });
      });
    } else {
      document.dropdown_value = this.editActionItem.dropdown_value;
    }

    document.column_list = JSON.stringify(document.column_list);
    document.dropdown_value = JSON.stringify(document.dropdown_value);

    return document;
  }

  /**
   * ---------------------------
   * DROPDOWN VALUE CREATE FNCTN
   * ---------------------------
   * ---------------------------
   */

  initDropdownFieldCreate() {
    $('#open-example-modal')?.click();
  }

  addDropdownValue(event: any) {
    if (this.dropdownValueForm.valid) {
      this.addTemplateRows('dropdown_value', {
        column_value: this.dropdownValueForm.value.column_value ?? null,
        column_lable: this.dropdownValueForm.value.column_lable ?? null,
      });

      this.columnDropdownMaster.push({
        type: 'static',
        value: this.dropdownValueForm.value.column_value ?? '',
        label: this.dropdownValueForm.value.column_lable ?? '',
      });

      $('#example-modal')?.find('[data-dismiss="modal"]')?.click();
      Global.resetForm(this.dropdownValueForm);

      this.initForm('refreshlabelvalues');
    }
  }

  /**
   * ---------------------------
   * MULTIPLE FORM ROWS FUNCTION
   * ---------------------------
   * ---------------------------
   */

  initTemplateRows(type: any, data: any = {}) {
    switch (type) {
      case 'dropdown_value':
      case 'staticdropdown_value':
        return this.formBuilder.group({
          column_value: [data.column_value ?? null, Validators.compose([])],
          column_lable: [
            data.column_lable ?? null,
            Validators.compose([Validators.required]),
          ],
        });
        break;

      case 'column_list':
        return this.formBuilder.group({
          option: [
            data.option ?? null,
            Validators.compose([Validators.required]),
          ],
        });
        break;

      default:
        return this.formBuilder.group({});
        break;
    }
  }

  getTemplateRows(type: any) {
    return (this.bankPaymentForm.get(type) as UntypedFormArray).controls;
  }

  removeTemplateRow(type: any, i: number) {
    const control = <UntypedFormArray>this.bankPaymentForm.get(type);
    control.removeAt(i);
  }

  addTemplateRows(type: any, data: any = {}) {
    const control = <UntypedFormArray>this.bankPaymentForm.get(type);
    control.push(this.initTemplateRows(type, data));
  }

  resetAllTemplateRows(isEditing: any = false, customArr: any = []) {
    let arr = ['dropdown_value', 'staticdropdown_value', 'column_list'];
    if (customArr.length > 0) {
      arr = customArr;
    }

    arr.forEach((element) => {
      const control = <UntypedFormArray>this.bankPaymentForm.get(element);
      control.clear();
    });

    if (isEditing == false) {
      arr.forEach((element) => {
        this.addTemplateRows(element);
      });
    }
  }

  /**
   * ----------------
   * EXPORT FUNCTIONS
   * ----------------
   * ----------------
   */

  exportTemplate(item: any) {
    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet(item?.template_name);

    let excelHeader: any[] = [];
    let excelRow: any[] = [];
    item?.column_list.forEach((element: any) => {
      excelHeader.push(element?.column_lable);
      excelRow.push(
        ['static'].includes(element?.type) ? element?.column_value : ''
      );
    });

    worksheet.addRow(excelHeader);
    worksheet.addRow(excelRow);

    workbook.xlsx.writeBuffer().then((data) => {
      let blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      fs.saveAs(blob, 'BankPaymentTemplate.xlsx');
    });

    // console.log('item: ', item?.column_list);
  }
}
