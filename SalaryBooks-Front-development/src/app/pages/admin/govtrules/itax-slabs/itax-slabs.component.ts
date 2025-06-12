import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { disableDebugTools, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { AdminService } from 'src/app/services/admin.service';
import swal from 'sweetalert2';

@Component({
  selector: 'admin-app-itax-slabs',
  templateUrl: './itax-slabs.component.html',
  styleUrls: ['./itax-slabs.component.css']
})
export class ADItaxSlabsComponent implements OnInit {
  dtOptions: DataTables.Settings = {};
  dtOptionsHistory: DataTables.Settings = {};

  iTaxSlabForm: UntypedFormGroup;
  iTaxCategoryForm: UntypedFormGroup;
  editActionId: String;
  categoryMaster: any[];
  viewItTaxTemplate: any = null;
  initialValueBeforeUpdate: any = null;
  viewItTaxTemplateHistory: any = null;

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    private adminService: AdminService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe
  ) {
    this.iTaxCategoryForm = formBuilder.group({
      category_name: [null, Validators.compose([Validators.required])],
    });

    this.iTaxSlabForm = formBuilder.group({
      template_name: [null, Validators.compose([Validators.required])],
      category: [null, Validators.compose([Validators.required])],
      // upper_limit: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$")])],
      // lower_limit: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$")])],
      financial_year_from: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$"), Validators.minLength(4), Validators.maxLength(4)])],
      financial_year_to: [null, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$"), Validators.minLength(4), Validators.maxLength(4)])],
      income_tax_slab: this.formBuilder.array([
        this.initIncomeTaxSlabs(),
      ])
    });

    this.editActionId = '';
    this.categoryMaster = [];
  }

  ngOnInit() {
    this.titleService.setTitle("Income Tax Slab - " + Global.AppName);

    this.fetch();
    this.fetchCategories();

    this.dtOptionsHistory = {
      ajax: (dataTablesParameters: any, callback) => {
        var result = this.getUpdateHistory();

        callback({
          recordsTotal: result.length,
          recordsFiltered: result.length,
          data: result.reverse(),
        });
      },
      columns: [
        {
          render: function (data, type, full, meta: any) {
            return meta.settings._iDisplayStart + (meta.row + 1)
          },
        },
        {
          render: function (data, type, full, meta) {
            return `<button class="btn btn-info btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="View Details" id="viewHistoryDetailsButton-` + meta.row + `">
                        <div style="width:25px; height:25px;"><i class="fa fa-eye"></i></div>
                    </button>`;
          },
          className: 'text-center'
        },
        {
          render: function (data, type, full, meta) {
            var date = full.created_at ? full.created_at : full.updated_at;

            var datePipe = new DatePipe("en-US");
            let value = datePipe.transform(date, 'dd/MM/yyyy hh:mm a');
            return value;
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.user_name ?? 'N/A';
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.template_name;
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.category_name ?? 'N/A';
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.financial_year_from;
          }
        },
        {
          render: function (data, type, full, meta) {
            return full.financial_year_to;
          }
        },
      ],
      drawCallback: function (settings) {
        Global.loadCustomScripts('customJsScript');
      },
      rowCallback: (row: Node, data: any[] | Object, index: number) => {
        const self = this;

        $("table").on('click', '#viewHistoryDetailsButton-' + index, function () {
          self.viewHistoryDetails(data);
        });

        return row;
      },
      searching: true,
      lengthChange: true, lengthMenu: Global.DataTableLengthChangeMenu,
      responsive: true,
      language: {
        searchPlaceholder: 'Search...',
        search: ""
      }
    }
  }

  initIncomeTaxSlabs(income_slab_from: any = null, income_slab_to: any = null, tax_rate: any = null, additional_charge: any = null, additional_cess: any = null) {
    return this.formBuilder.group({
      income_slab_from: [income_slab_from, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$"), Validators.min(1)])],
      income_slab_to: [income_slab_to, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$"), Validators.min(1)])],
      tax_rate: [tax_rate, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$"), Validators.min(1)])],
      additional_charge: [additional_charge, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$"), Validators.min(1)])],
      additional_cess: [additional_cess, Validators.compose([Validators.required, Validators.pattern("^[0-9]*$"), Validators.min(1)])],
    });
  }

  getTaxSlabControls() {
    return (this.iTaxSlabForm.get('income_tax_slab') as UntypedFormArray).controls;
  }

  removeTaxSlab(i: number) {
    const control = <UntypedFormArray>this.iTaxSlabForm.get('income_tax_slab');
    control.removeAt(i);
  }

  addTaxSlab(income_slab_from: any = null, income_slab_to: any = null, tax_rate: any = null, additional_charge: any = null, additional_cess: any = null) {
    const control = <UntypedFormArray>this.iTaxSlabForm.get('income_tax_slab');
    control.push(this.initIncomeTaxSlabs(income_slab_from, income_slab_to, tax_rate, additional_charge, additional_cess));
  }

  fetchCategories() {
    this.spinner.show();

    this.adminService.fetchITaxCategories()
      .subscribe(res => {
        if (res.status == "success") {
          this.categoryMaster = [];
          for (const key in res.categories) {
            if (Object.prototype.hasOwnProperty.call(res.categories, key)) {
              const element = res.categories[key];
              this.categoryMaster.push({ "id": element._id, "description": element.category_name });
            }
          }
        } else {
          this.toastr.error(res.message);
        }

        this.spinner.hide();
      }, (err) => {
        this.toastr.error("Internal server error occured. Please try again later.");
        this.spinner.hide();
      });
  }

  // createCategory(event: any) {
  //   if (this.iTaxCategoryForm.valid) {
  //     event.target.classList.add('btn-loading');

  //     this.adminService.createITaxCategory({
  //       'category_name': this.iTaxCategoryForm.value.category_name,
  //     }).subscribe(res => {
  //       if (res.status == 'success') {
  //         this.toastr.success(res.message);
  //         this.iTaxCategoryForm.reset();
  //         $('#categorymodal').find('[data-dismiss="modal"]').click();
  //         this.fetchCategories();
  //       } else if (res.status == 'val_err') {
  //         this.toastr.error(Global.showValidationMessage(res.val_msg));
  //       } else {
  //         this.toastr.error(res.message);
  //       }

  //       event.target.classList.remove('btn-loading');
  //     }, (err) => {
  //       event.target.classList.remove('btn-loading');
  //       this.toastr.error("Internal server error occured. Please try again later.");
  //     });
  //   }
  // }

  fetch() {
    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        const nextPage = Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length);
        this.adminService.fetchITaxTemplates({
          pageno:nextPage ?? 1,
          perpage: dataTablesParameters.length,
          // 'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
          'searchkey': dataTablesParameters.search.value,
          'sortbyfield': Global.getTableSortingOptions('sortbyfield', dataTablesParameters),
          'ascdesc': Global.getTableSortingOptions('ascdesc', dataTablesParameters),
          'pagination':true
        }).subscribe(res => {
          if (res.status == 'success') {
            callback({
              recordsTotal: res.incometax.totalDocs,
              recordsFiltered: res.incometax.totalDocs,
              data: res.incometax.docs,
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
          },
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            return `<button class="btn btn-info btn-icon mg-5" data-toggle="tooltip" data-placement="top" title="View Details" id="viewButton-` + meta.row + `">
                      <div style="width:25px; height:25px;"><i class="fa fa-eye"></i></div>
                    </button>
                    <button class="btn btn-info btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Update History" id="historyButton-` + meta.row + `">
                        <div style="width:25px; height:25px;"><i class="fa fa-history"></i></div>
                    </button>
                    <button class="btn btn-primary btn-icon mg-5" data-toggle="tooltip" data-placement="top" title="Edit" id="editButton-` + meta.row + `">
                      <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
                    </button>
                    <button class="btn btn-danger btn-icon mg-5" data-toggle="tooltip" data-placement="top" title="Delete" id="deleteButton-`+ meta.row + `">
                      <div style="width:25px; height:25px;"><i class="fa fa-trash"></i></div>
                    </button>`;
          },
          className: 'text-center',
          orderable: false,
        },
        {
          render: function (data, type, full, meta) {
            return full.template_name;
          },
          orderable: true,
          name: 'template_name'
        },
        {
          render: function (data, type, full, meta) {
            if (full.categorydata.length > 0) {
              let html: any = '';

              full.categorydata.forEach((element: any) => {
                html += element.category_name + `<br>`;
              });

              return html;
            } else {
              return 'N/A';
            }
          },
          orderable: false
        },
        // {
        //   render: function (data, type, full, meta) {
        //     return full.upper_limit;
        //   }
        // },
        // {
        //   render: function (data, type, full, meta) {
        //     return full.lower_limit;
        //   }
        // },
        {
          render: function (data, type, full, meta) {
            return full.financial_year_from;
          },
          orderable: true,
          name: 'financial_year_from'
        },
        {
          render: function (data, type, full, meta) {
            return full.financial_year_to;
          },
          orderable: true,
          name: 'financial_year_to'
        },
      ],
      drawCallback: function (settings) {
        Global.loadCustomScripts('customJsScript');
      },
      rowCallback: (row: Node, data: any[] | Object, index: number) => {
        const self = this;

        $("table").on('click', '#viewButton-' + index, function () {
          self.view(data);
        });

        $("table").on('click', '#historyButton-' + index, function () {
          self.showUpdateHistory(data);
        });

        $("table").on('click', '#editButton-' + index, function () {
          self.getEdit(data);
        });

        $("table").on('click', '#deleteButton-' + index, function () {
          self.deleteItem(data);
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
      order: [],
      searching: true,
      pageLength: Global.DataTableLength,
      lengthChange: true, lengthMenu: Global.DataTableLengthChangeMenu,
      responsive: true,
      language: {
        searchPlaceholder: 'Search...',
        search: ""
      }
    };
  }

  getEdit(item: any) {
    this.editActionId = item._id;
    this.iTaxSlabForm.patchValue({
      template_name: item.template_name,
      category: this.categoryMaster.find(obj => {
        return obj.id === item.category
      }),
      // upper_limit: item.upper_limit,
      // lower_limit: item.lower_limit,
      financial_year_from: item.financial_year_from,
      financial_year_to: item.financial_year_to,
    });

    const control = <UntypedFormArray>this.iTaxSlabForm.get('income_tax_slab');
    control.clear();

    item.income_tax_slab.forEach((element: any) => {
      this.addTaxSlab(element.income_slab_from, element.income_slab_to, element.tax_rate, element.additional_charge, element.additional_cess)
    });

    this.initialValueBeforeUpdate = {
      'taxslab_id': this.editActionId,
      'template_name': this.iTaxSlabForm.value.template_name.toString().trim(),
      'category': this.iTaxSlabForm.value.category.id,
      'category_name': this.iTaxSlabForm.value.category.description,
      'financial_year_from': this.iTaxSlabForm.value.financial_year_from.toString().trim(),
      'financial_year_to': this.iTaxSlabForm.value.financial_year_to.toString().trim(),
      'income_tax_slab': JSON.stringify(this.iTaxSlabForm.value.income_tax_slab)
    }

    $('html, body').animate({
      'scrollTop': $("#itaxslab-submit-section").position().top
    });
  }

  cancelEdit() {
    this.editActionId = '';
    this.iTaxSlabForm.reset();

    for (const key in this.iTaxSlabForm.controls) {
      if (Object.prototype.hasOwnProperty.call(this.iTaxSlabForm.controls, key)) {
        const element = this.iTaxSlabForm.controls[key];

        element.markAsUntouched();
        element.markAsPristine();
      }
    }

    const control = <UntypedFormArray>this.iTaxSlabForm.get('income_tax_slab');
    control.clear();

    this.addTaxSlab();

    $('html, body').animate({
      'scrollTop': $("#itaxslab-submit-section").position().top
    });
  }

  async create(event: any) {
    if (this.iTaxSlabForm.valid) {
      event.target.classList.add('btn-loading');

      const validateData = await this.validate_itax_data();
      if (!validateData) {
        event.target.classList.remove('btn-loading');
        return;
      }

      this.adminService.createITaxTemplate({
        'template_name': this.iTaxSlabForm.value.template_name,
        'category': this.iTaxSlabForm.value.category.id,
        // 'upper_limit': this.iTaxSlabForm.value.upper_limit,
        // 'lower_limit': this.iTaxSlabForm.value.lower_limit,
        'financial_year_from': this.iTaxSlabForm.value.financial_year_from,
        'financial_year_to': this.iTaxSlabForm.value.financial_year_to,
        'income_tax_slab': JSON.stringify(this.iTaxSlabForm.value.income_tax_slab),
      }).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          // this.iTaxSlabForm.reset();
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
        this.adminService.deleteITaxTemplate({
          'taxslab_id': item._id,
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

  async update(event: any) {
    if (this.iTaxSlabForm.valid) {
      event.target.classList.add('btn-loading');

      const validateData = await this.validate_itax_data();
      if (!validateData) {
        event.target.classList.remove('btn-loading');
        return;
      }

      const documentUpdate = {
        'taxslab_id': this.editActionId,
        'template_name': this.iTaxSlabForm.value.template_name.toString().trim(),
        'category': this.iTaxSlabForm.value.category.id,
        'category_name': this.iTaxSlabForm.value.category.description,
        'financial_year_from': this.iTaxSlabForm.value.financial_year_from.toString().trim(),
        'financial_year_to': this.iTaxSlabForm.value.financial_year_to.toString().trim(),
        'income_tax_slab': JSON.stringify(this.iTaxSlabForm.value.income_tax_slab)
      };

      if (JSON.stringify(documentUpdate) === JSON.stringify(this.initialValueBeforeUpdate)) {
        event.target.classList.remove('btn-loading');
        this.toastr.warning("No change detected to update");
        return;
      }

      this.adminService.updateITaxTemplate(
        documentUpdate
      ).subscribe(res => {
        if (res.status == 'success') {
          this.toastr.success(res.message);
          this.initialValueBeforeUpdate = documentUpdate;
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

  view(item: any) {
    $('#viewmmodalbutton').click();
    this.viewItTaxTemplate = item;
  }

  viewHistoryDetails(item: any) {
    $('#viewhistorymodalbutton').click();
    this.viewItTaxTemplateHistory = item;
  }

  validate_itax_data() {
    const ele = this;

    return new Promise(function (resolve, reject) {
      if (parseInt(ele.iTaxSlabForm.value.financial_year_to) < parseInt(ele.iTaxSlabForm.value.financial_year_from)) {
        ele.toastr.error("The ending financial year should be greater than the starting year");
        resolve(false);
        return;
      }

      /** Validating Income Tax Slab Range */
      for (const key in ele.iTaxSlabForm.value.income_tax_slab) {
        if (Object.prototype.hasOwnProperty.call(ele.iTaxSlabForm.value.income_tax_slab, key)) {
          const element = ele.iTaxSlabForm.value.income_tax_slab[key];
          if (element.income_slab_to <= element.income_slab_from) {
            ele.toastr.error("For Income Tax Slab " + (parseInt(key) + 1) + ": The amount range entered is not acceptable");
            resolve(false);
            return;
          }

          if (parseInt(key) > 0 && element.income_slab_from <= ele.iTaxSlabForm.value.income_tax_slab[parseInt(key) - 1]?.income_slab_to) {
            ele.toastr.error("For Income Tax Slab " + (parseInt(key) + 1) + ": The amount range starting should be greater than the previous one");
            resolve(false);
            return;
          }
        }
      }
      /** End of Validating Income Tax Slab Range */

      ele.adminService.validateITaxTemplateFinancialYear({
        'tax_slab_id': ele.editActionId ? ele.editActionId : null,
        'fromdate': ele.iTaxSlabForm.value.financial_year_from,
        'todate': ele.iTaxSlabForm.value.financial_year_to,
      }).subscribe(res => {
        if (res.status == 'success') {
          resolve(true);
          return;
        } else if (res.status == 'val_err') {
          ele.toastr.error(Global.showValidationMessage(res.val_msg));
          resolve(false);
          return;
        } else {
          ele.toastr.error(res.message);
          resolve(false);
          return;
        }
      }, (err) => {
        ele.toastr.error("Internal server error occured. Please try again later.");
        resolve(false);
        return;
      });
    })
  }

  showUpdateHistory(item: any) {
    this.viewItTaxTemplate = item;
    // console.log(this.viewItTaxTemplate.history);
    if (this.viewItTaxTemplate.history != null) {
      $('#history-datatable').dataTable().api().ajax.reload();
      $('#historymmodalbutton').click();
    } else {
      this.toastr.warning("No update history found to show")
    }
  }

  getUpdateHistory() {
    if (this.viewItTaxTemplate != null && this.viewItTaxTemplate.history != null && Array.isArray(this.viewItTaxTemplate.history)) {
      return this.viewItTaxTemplate.history;
    } else {
      return [];
    }
  }
}
