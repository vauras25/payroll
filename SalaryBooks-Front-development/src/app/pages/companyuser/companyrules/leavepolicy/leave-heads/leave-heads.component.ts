import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';

@Component({
  selector: 'companyuser-app-leave-heads',
  templateUrl: './leave-heads.component.html',
  styleUrls: ['./leave-heads.component.css']
})
export class CMPLeaveHeadsComponent implements OnInit {
  leaveHeadForm: UntypedFormGroup;
  editActionId: String;
  dtOptions: DataTables.Settings = {};

  headTypeMaster: any[] = [];

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
  ) {
    this.leaveHeadForm = formBuilder.group({
      head_type: [null, Validators.compose([Validators.required])],
      full_name: [null, Validators.compose([Validators.required])],
      abbreviation: [null, Validators.compose([Validators.required])],
    });

    this.editActionId = '';

    this.headTypeMaster = [
      { value: "earned", description: "Earned Leave" },
      { value: "com_defined", description: "Company Defined Leave" },
    ];
  }

  ngOnInit(): void {
    this.titleService.setTitle("Leave Heads Manager - " + Global.AppName);

    this.fetch();
  }

  add() {
    Global.resetForm(this.leaveHeadForm);
    $('#leavehead-form-modal').show();
  }

  cancelEntry() {
    Global.resetForm(this.leaveHeadForm);
    $('#leavehead-form-modal').hide();
  }

  submit(event: any) {
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

          $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
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

  fetch() {
    const _this = this;

    this.dtOptions = {
      ajax: (dataTablesParameters: any, callback) => {
        this.companyuserService.fetchLeaveTemplateHeads({
          'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
          'searchkey': dataTablesParameters.search.value,
          'sortbyfield': Global.getTableSortingOptions('sortbyfield', dataTablesParameters),
          'ascdesc': Global.getTableSortingOptions('ascdesc', dataTablesParameters)
        }).subscribe(res => {
          if (res.status == 'success') {
            callback({
              recordsTotal: res.temp_head.length,
              recordsFiltered: res.temp_head.length,
              data: res.temp_head,
            });
          } else {
            this.toastr.error(res.message);

            callback({
              recordsTotal: 0,
              recordsFiltered: 0,
              data: [],
            });
          }
        }, (err) => {
          this.toastr.error(Global.showServerErrorMessage(err));

          callback({
            recordsTotal: 0,
            recordsFiltered: 0,
            data: [],
          });
        });
      },
      columns: [
        {
          render: function (data, type, full, meta: any) {
            return meta.settings._iDisplayStart + (meta.row + 1)
          },
          orderable: false
        },
        // {
        //   render: function (data, type, full, meta) {
        //     return `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Edit" id="editButton-` + meta.row + `">
        //                 <div style="width:25px; height:25px;"><i class="fa fa-pen"></i></div>
        //             </button>
        //             <button class="btn btn-danger btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Delete" id="deleteButton-`+ meta.row + `">
        //                 <div style="width:25px; height:25px;"><i class="fa fa-trash"></i></div>
        //             </button>`;
        //   },
        //   className: 'text-center',
        //   orderable: false
        // },
        {
          render: function (data, type, full, meta) {
            return _this.headTypeMaster.find((obj: any) => {
              return obj.value == full.head_type
            })?.description ?? "N/A";
          },
          orderable: true,
          name: 'head_type'
        },
        {
          render: function (data, type, full, meta) {
            return full.full_name;
          },
          orderable: true,
          name: 'full_name'
        },
        {
          render: function (data, type, full, meta) {
            return full.abbreviation;
          },
          orderable: true,
          name: 'abbreviation'
        },
      ],
      drawCallback: function (settings) {
        Global.loadCustomScripts('customJsScript');
      },
      rowCallback: (row: Node, data: any[] | Object, index: number) => {
        const self = this;

        $("table").on('click', '#editButton-' + index, function () {
          // self.getEdit(data);
        });

        $("table").on('click', '#deleteButton-' + index, function () {
          // self.deleteItem(data);
        });

        return row;
      },
      pagingType: 'full_numbers',
      serverSide: true,
      processing: true,
      ordering: true,
      order: [],
      searching: false,
      pageLength: Global.DataTableLength,
      lengthChange: true, lengthMenu: Global.DataTableLengthChangeMenu,
      responsive: true,
      language: {
        searchPlaceholder: 'Search...',
        search: ""
      }
    };
  }
}
