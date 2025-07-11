import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { disableDebugTools, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import swal from 'sweetalert2';

@Component({
  selector: 'companyuser-app-itax-categories',
  templateUrl: './itax-categories.component.html',
  styleUrls: ['./itax-categories.component.css']
})
export class CMPItaxCategoriesComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  dtOptionsLibrary: DataTables.Settings = {};
  categoryForm: UntypedFormGroup;
  editActionId: String;
  genderMaster: any[];
  categoryLibraryTemplates:any[] = []

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private companyUserService: CompanyuserService
  ) {
    this.genderMaster = Global.getGenderMaster();

    this.categoryForm = formBuilder.group({
      category_name: [null, Validators.compose([Validators.required])],
      age_lower_limit: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$")])],
      age_upper_limit: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$")])],
      gender: [null, Validators.compose([Validators.required])],
    });

    this.editActionId = '';
  }

  ngOnInit() {
    this.titleService.setTitle("Income Tax Categories - " + Global.AppName);

    this.fetch();
    this.fetchTemplateLibrary()
  }

  fetch() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        this.companyUserService.fetchITaxCategories().subscribe(res => {
          if (res.status == "success") {
            callback({
              recordsTotal: res.categories.length,
              recordsFiltered: res.categories.length,
              data: res.categories,
            });
          } else {
            this.toastr.error(res.message);
          }
        }, (err) => {
          this.toastr.error("Internal server error occured. Please try again later.");
        });
      },
      columns: [
        {
          render: function (data, type, full, meta: any) {
            return meta.settings._iDisplayStart + (meta.row + 1)
          }
        },
        {
          render: function (data, type, full, meta) {
            return `<button class="btn btn-primary btn-icon mg-5" data-toggle="tooltip" data-placement="top" title="Edit" id="editButton-` + meta.row + `">
                        <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
                    </button>
                    <button class="btn btn-danger btn-icon mg-5" data-toggle="tooltip" data-placement="top" title="Delete" id="deleteButton-`+ meta.row + `">
                        <div style="width:25px; height:25px;"><i class="fa fa-trash"></i></div>
                    </button>`;
          },
          className: 'text-center'
        },
        {
          render: function (data, type, full, meta) {
            return full.category_name;
          }
        },
        {
          render: function (data, type, full, meta) {
            return (full.age_lower_limit) ? full.age_lower_limit : 'N/A';
          }
        },
        {
          render: function (data, type, full, meta) {
            return (full.age_upper_limit) ? full.age_upper_limit : 'N/A';
          }
        },
        {
          render: function (data, type, full, meta) {
            let genderMaster: any = Global.getGenderMaster();
            let result = genderMaster.find((obj: any) => {
              return obj.value === full.gender
            })

            return result?.description ?? "N/A";
          }
        },
      ],
      drawCallback: function (settings) {
        Global.loadCustomScripts('customJsScript');
      },
      rowCallback: (row: Node, data: any[] | Object, index: number) => {
        const self = this;
        $("table").on('click', '#editButton-' + index, function () {
          self.getEdit(data);
        });

        $("table").on('click', '#deleteButton-' + index, function () {
          self.deleteItem(data);
        });

        return row;
      },
      pagingType: 'full_numbers',
      serverSide: true,
      processing: true,
      ordering: false,
      searching: false,
      paging: true,
      pageLength: Global.DataTableLength,
      lengthChange: true, 
      lengthMenu: Global.DataTableLengthChangeMenu,
      responsive: true,
      language: {
        searchPlaceholder: 'Search...',
        search: ""
      }
    };
  }

  getEdit(item: any, isNew?:boolean) {
    if(!isNew) this.editActionId = item._id;
    this.categoryForm.patchValue({
      category_name: item.category_name,
      age_lower_limit: item.age_lower_limit,
      age_upper_limit: item.age_upper_limit,
      gender: this.genderMaster.find(obj => {
        return obj.value === item.gender
      }),
    });

    $('html, body').animate({
      'scrollTop': $("#category-submit-section").position().top
    });
  }

  cancelEdit() {
    this.editActionId = '';
    this.categoryForm.reset();

    for (const key in this.categoryForm.controls) {
      if (Object.prototype.hasOwnProperty.call(this.categoryForm.controls, key)) {
        const element = this.categoryForm.controls[key];

        element.markAsUntouched();
        element.markAsPristine();
      }
    }
  }

  create(event: any) {
    if (this.categoryForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyUserService.createITaxCategory({
        'category_name': this.categoryForm.value.category_name,
        'age_lower_limit': this.categoryForm.value.age_lower_limit,
        'age_upper_limit': this.categoryForm.value.age_upper_limit,
        'gender': this.categoryForm.value.gender.value,
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          // this.categoryForm.reset();
          this.cancelEdit();
          $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
        } else if (res.status == 'val_err') {
          this.toastr.error(Global.showValidationMessage(res.val_msg));
        } else {
          this.toastr.error(res.message);
        }

        event.target.classList.remove('btn-loading');
      }, (err) => {
        event.target.classList.remove('btn-loading');
        this.toastr.error("Internal server error occured. Please try again later.");
      });
    }
  }

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
        this.companyUserService.deleteITaxCategory({
          'tax_category_id': item._id,
        }).subscribe(res => {
          if (res.status == 'success') {
            this.toastr.success(res.message);
            $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
          } else {
            this.toastr.error(res.message);
          }
        }, (err) => {
          this.toastr.error("Internal server error occured. Please try again later.");
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

  update(event: any) {
    if (this.categoryForm.valid) {
      event.target.classList.add('btn-loading');

      this.companyUserService.updateITaxCategory({
        'tax_category_id': this.editActionId,
        'category_name': this.categoryForm.value.category_name,
        'age_lower_limit': this.categoryForm.value.age_lower_limit,
        'age_upper_limit': this.categoryForm.value.age_upper_limit,
        'gender': this.categoryForm.value.gender.value,
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.categoryForm.reset()
          $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
          this.cancelEdit()
        } else {
          this.toastr.error(res.message);
        }

        event.target.classList.remove('btn-loading');
      }, (err) => {
        event.target.classList.remove('btn-loading');
        this.toastr.error("Internal server error occured. Please try again later.");
      });
    }
  }

  openTemplateLibrary() {
    $('#librarymmodalbutton').click();
  }

  async fetchTemplateLibrary() {
    const _this = this;
    try {
       let res = await this.companyUserService.fetchITaxCategoryTemplateLibrary({}).toPromise();
       if(res.status !== 'success') throw res;
       return this.categoryLibraryTemplates = res.categories;
    } catch (err:any) {
      if (err.status == 'val_err') {
        return this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else {
        return this.toastr.error(err?.message || err);
      }
    }

    // this.dtOptionsLibrary = {
    //   ajax: (dataTablesParameters: any, callback) => {
    //     this.companyUserService.fetchITaxCategoryTemplateLibrary({
    //       'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
    //       'searchkey': dataTablesParameters.search.value,
    //       'sortbyfield': Global.getTableSortingOptions('sortbyfield', dataTablesParameters),
    //       'ascdesc': Global.getTableSortingOptions('ascdesc', dataTablesParameters)
    //     }).subscribe(res => {
    //       if (res.status == 'success') {
    //         callback({
    //           recordsTotal: res?.categories?.length,
    //           recordsFiltered: res?.categories?.length,
    //           data: res?.categories,
    //         });
    //       } else {
    //         this.toastr.error(res.message);

    //         callback({
    //           recordsTotal: 0,
    //           recordsFiltered: 0,
    //           data: [],
    //         });
    //       }
    //     }, (err:any) => {
    //       this.toastr.error(Global.showServerErrorMessage(err));

    //       callback({
    //         recordsTotal: 0,
    //         recordsFiltered: 0,
    //         data: [],
    //       });
    //     });
    //   },
    //   columns: [
    //     {
    //       render: function (data, type, full, meta: any) {
    //         return meta.settings._iDisplayStart + (meta.row + 1)
    //       },
    //       orderable: false
    //     },
    //     {
    //       render: function (data, type, full, meta) {
    //         let html = "";

    //         // if (_this.preferenceGroup.includes('customizable')) {
    //           html += `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Clone" id="cloneButton-` + meta.row + `">
    //                         <div style="width:25px; height:25px;"><i class="fa fa-copy"></i></div>
    //                     </button>`;
    //         // }

    //         return html ? html : "N/A";
    //       },
    //       className: 'text-center',
    //       orderable: false
    //     },
    //     {
    //       render: function (data, type, full, meta) {
    //         return full.category_name || ''
    //       },
    //       orderable: true,
    //       name: 'category_name'
    //     },
    //     {
    //       render: function (data, type, full, meta) {
    //         return full.age_lower_limit || ''
    //       },
    //       orderable: true,
    //       name: 'age_lower_limit'
    //     },
    //     {
    //       render: function (data, type, full, meta) {
    //         return full.age_lower_limit || ''
    //       },
    //       orderable: true,
    //       name: 'age_upper_limit'
    //     },
    //     {
    //       render: function (data, type, full, meta) {
    //         return full.gender || ''
    //       },
    //       orderable: true,
    //       name: 'gender'
    //     },

    //   ],
    //   drawCallback: function (settings) {
    //     Global.loadCustomScripts('customJsScript');
    //   },
    //   rowCallback: (row: Node, data: any[] | Object, index: number) => {
    //     const self = this;
    //     $("table").on('click', '#cloneButton-' + index, function () {
    //       self.cloneItem(data);
    //     });

    //     return row;
    //   },
    //   pagingType: 'full_numbers',
    //   serverSide: true,
    //   processing: true,
    //   ordering: true,
    //   order: [],
    //   searching: true,
    //   pageLength: Global.DataTableLength,
    //   lengthChange: true, lengthMenu: Global.DataTableLengthChangeMenu,
    //   responsive: true,
    //   language: {
    //     searchPlaceholder: 'Search...',
    //     search: ""
    //   }
    // };
  }

  cloneItem(item: any) {
    $('[data-dismiss="modal"]')?.click()
    this.cancelEdit();
    this.getEdit(item, true)
  }
}
