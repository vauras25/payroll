import { Component, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { disableDebugTools, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import swal from 'sweetalert2';
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'companyuser-app-letter-writing',
  templateUrl: './letter-writing.component.html',
  styleUrls: ['./letter-writing.component.css'],
})
export class CMPLetterWritingComponent implements OnInit {
  Global = Global;
  dtOptions: DataTables.Settings = {};
  letterWritingForm: UntypedFormGroup;
  shortCodeMaster: any[];
  editActionId: String;
  public Editor = ClassicEditor;

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private companyuserService: CompanyuserService,
    private router:Router,
    private spinner: NgxSpinnerService
  ) {

    
    if (
      !Global.checkCompanyModulePermission({
        company_module: 'master',
        company_sub_module:"letter_writer",
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

    this.letterWritingForm = formBuilder.group({
      template_name: [null, Validators.compose([Validators.required])],
      msg_box: [null, Validators.compose([Validators.required])],
    });

    this.shortCodeMaster = [
      { value: '##EMPFIRSTNAME##', description: '##EMPFIRSTNAME##' },
      { value: '##EMPLASTNAME##', description: '##EMPLASTNAME##' },
      { value: '##EMPID##', description: '##EMPID##' },
      { value: '##CORPORATEID##', description: '##CORPORATEID##' },
      { value: '##PANNO##', description: '##PANNO##' },
      { value: '##EMAILID##', description: '##EMAILID##' },
      { value: '##EMPDOB##', description: '##EMPDOB##' },
      { value: '##AADHARNO##', description: '##AADHARNO##' },
      { value: '##CLIENTCODE##', description: '##CLIENTCODE##' },
    ];
    this.editActionId = '';
  }

  ngOnInit() {
    this.titleService.setTitle('Letter Writing - ' + Global.AppName);

    this.fetch();
  }

  fetch() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        this.companyuserService
          .fetchLetterWritingTemplates({
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
                  recordsTotal: res.template_list.totalDocs,
                  recordsFiltered: res.template_list.totalDocs,
                  data: res.template_list.docs,
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
        {
          render: function (data, type, full, meta) {
            var btnstatus = '';
            if (full.status == 'active') {
              btnstatus = 'on';
            } else {
              btnstatus = 'off';
            }
            if(
              Global.checkCompanyModulePermission({
                company_module: 'master',
                company_sub_module:"letter_writer",
                company_sub_operation: ['edit'],
                company_strict: true,
              })
            ){
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
          className: 'text-center',
          orderable: true,
          name: 'status',
        },
        {
          render: function (data, type, full, meta) {
            let html = '';
            if(
              Global.checkCompanyModulePermission({
                company_module: 'master',
                company_sub_module:"letter_writer",
                company_sub_operation: ['view'],
                company_strict: true,
              })
            ){
              html +=
              `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="View" id="viewButton-` +
              meta.row +
              `">
                <div style="width:25px; height:25px;"><i class="fa fa-eye"></i></div>
            </button>`;
            }
            if(
              Global.checkCompanyModulePermission({
                company_module: 'master',
                company_sub_module:"letter_writer",
                company_sub_operation: ['edit'],
                company_strict: true,
              })
            ){

              html +=
              `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Edit" id="editButton-` +
              meta.row +
              `">
                <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
            </button>`;

            }
            if(
              Global.checkCompanyModulePermission({
                company_module: 'master',
                company_sub_module:"letter_writer",
                company_sub_operation: ['delete'],
                company_strict: true,
              })
            ){
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
        $('table').on('click', '#editButton-' + index, function () {
          self.getEdit(data);
        });
        $('table').on('click', '#viewButton-' + index, function () {
          self.viewTemplate(data);
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
    this.editActionId = item._id;
    this.letterWritingForm.patchValue({
      template_name: item?.template_name ?? null,
      msg_box: item?.msg_box ?? null,
    });

    $('html, body').animate({
      scrollTop: $('#letterwriting-submit-section').position().top,
    });
  }

  cancelEdit() {
    this.editActionId = '';
    Global.resetForm(this.letterWritingForm);
  }

  create(event: any) {
    if (this.letterWritingForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService
        .createLetterWritingTemplate({
          template_name: this.letterWritingForm.value.template_name,
          msg_box: this.letterWritingForm.value.msg_box,
          status: 'active',
        })
        .subscribe(
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
            .deleteLetterWritingTemplate({
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
    if (this.letterWritingForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyuserService
        .updateLetterWritingTemplate({
          template_name: this.letterWritingForm.value.template_name,
          msg_box: this.letterWritingForm.value.msg_box,
          status: 'active',
          template_id: this.editActionId,
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

  copyToClpboard(text: any) {
    Global.copyToClpboard(text);
    this.toastr.info('Text copied to clipboard');
  }

  templateData: any = {};
  viewTemplate(props: any) {
    this.templateData = props;
    // console.log(props);

    let btn: any = $('#viewTemplate');
    btn.click();
  }
}
