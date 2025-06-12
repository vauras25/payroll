import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import { CompanyuserTableFilterComponent } from '../../includes/table-filter/table-filter.component';

@Component({
    selector: 'companyuser-app-daily-details',
    templateUrl: './daily-details.component.html',
    styleUrls: ['./daily-details.component.css']
})
export class CMPAttendanceDailyDetailsComponent implements OnInit {
    @ViewChild(CompanyuserTableFilterComponent) filterTableComponent: CompanyuserTableFilterComponent;

    Global = Global;
    dtOptions: DataTables.Settings = {};
    monthMaster: any[] = [];

    constructor(
        private titleService: Title,
        private toastr: ToastrService,
        protected companyuserService: CompanyuserService,
        private spinner: NgxSpinnerService,
        public formBuilder: UntypedFormBuilder,
    ) {
        this.monthMaster = Global.monthMaster;
    }

    ngOnInit(): void {
        this.titleService.setTitle("Details Daily | Attendance Management - " + Global.AppName);

        this.fetch();
        setTimeout(() => {
            this.filterPayload = {
                'month': this.filterTableComponent.monthMaster?.find((obj: any) => {
                    return obj.index == new Date().getMonth();
                }) ?? null,

                'year': this.filterTableComponent.yearMaster?.find((obj: any) => {
                    return obj.value == new Date().getFullYear();
                }) ?? null,
            }

            this.filterTableComponent.setFormControlValue({
                refresh: true,
                payload: this.filterPayload
            });
        }, 100);
    }

    fetch() {
        this.dtOptions = {
            ajax: (dataTablesParameters: any, callback) => {
                this.companyuserService.fetchAttendanceSummary({
                    'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length), 'perpage': dataTablesParameters.length,
                    'searchkey': dataTablesParameters.search.value,
                    'sortbyfield': Global.getTableSortingOptions('sortbyfield', dataTablesParameters),
                    'ascdesc': Global.getTableSortingOptions('ascdesc', dataTablesParameters),
                    'attendance_month': this.filterPayload?.month?.index ?? "",
                    'attendance_year': this.filterPayload?.year?.value ?? "",
                }).subscribe(res => {
                    if (res.status == 'success') {
                        callback({
                            recordsTotal: res.attendance_summ.totalDocs,
                            recordsFiltered: res.attendance_summ.totalDocs,
                            data: res.attendance_summ.docs,
                        });
                    } else {
                        // this.toastr.error(res.message);

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
                    render: function (data, type, full, meta) {
                        return full.emp_id ?? "-";
                    },
                    orderable: true,
                    name: 'emp_id'
                },
                {
                    render: function (data, type, full, meta) {
                        return full.emp_first_name + " " + full.emp_last_name;
                    },
                    orderable: true,
                    name: 'emp_first_name'
                },
                {
                    render: function (data, type, full, meta) {
                        return `<img src="https://via.placeholder.com/500" alt="" class="img-fluid rounded wd-50">`;
                    },
                    orderable: false
                },

                { render: function (data, type, full, meta) { return full.attendance_summ[0]?.paydays ?? "-"; }, orderable: false },
                { render: function (data, type, full, meta) { return full.attendance_summ[0]?.adjust_day ?? "-"; }, orderable: false },
                { render: function (data, type, full, meta) { return full.attendance_summ[0]?.assumed_pre_day ?? "-"; }, orderable: false },
                { render: function (data, type, full, meta) { return full.attendance_summ[0]?.total_attendance ?? "-"; }, orderable: false },
                { render: function (data, type, full, meta) { return full.attendance_summ[0]?.total_ANL ?? "-"; }, orderable: false },
                { render: function (data, type, full, meta) { return full.attendance_summ[0]?.total_AWP ?? "-"; }, orderable: false },
                { render: function (data, type, full, meta) { return full.attendance_summ[0]?.total_CSL ?? "-"; }, orderable: false },
                { render: function (data, type, full, meta) { return full.attendance_summ[0]?.total_ERL ?? "-"; }, orderable: false },
                { render: function (data, type, full, meta) { return full.attendance_summ[0]?.total_LE1 ?? "-"; }, orderable: false },
                { render: function (data, type, full, meta) { return full.attendance_summ[0]?.total_LE2 ?? "-"; }, orderable: false },
                { render: function (data, type, full, meta) { return full.attendance_summ[0]?.total_LP1 ?? "-"; }, orderable: false },
                { render: function (data, type, full, meta) { return full.attendance_summ[0]?.total_LP2 ?? "-"; }, orderable: false },
                { render: function (data, type, full, meta) { return full.attendance_summ[0]?.total_LP3 ?? "-"; }, orderable: false },
                { render: function (data, type, full, meta) { return full.attendance_summ[0]?.total_MDL ?? "-"; }, orderable: false },
                { render: function (data, type, full, meta) { return full.attendance_summ[0]?.total_MTL ?? "-"; }, orderable: false },
                { render: function (data, type, full, meta) { return full.attendance_summ[0]?.total_PDL ?? "-"; }, orderable: false },
                { render: function (data, type, full, meta) { return full.attendance_summ[0]?.total_PTL ?? "-"; }, orderable: false },
                { render: function (data, type, full, meta) { return full.attendance_summ[0]?.total_PVL ?? "-"; }, orderable: false },
                { render: function (data, type, full, meta) { return full.attendance_summ[0]?.total_SKL ?? "-"; }, orderable: false },
                { render: function (data, type, full, meta) { return full.attendance_summ[0]?.total_UWP ?? "-"; }, orderable: false },
                { render: function (data, type, full, meta) { return full.attendance_summ[0]?.total_late ?? "-"; }, orderable: false },
                { render: function (data, type, full, meta) { return full.attendance_summ[0]?.total_lop ?? "-"; }, orderable: false },
                { render: function (data, type, full, meta) { return full.attendance_summ[0]?.total_overtime ?? "-"; }, orderable: false },
                { render: function (data, type, full, meta) { return full.attendance_summ[0]?.total_wo ?? "-"; }, orderable: false },
                { render: function (data, type, full, meta) { return full.attendance_summ[0]?.total_absent ?? "-"; }, orderable: false },
            ],
            rowCallback: (row: Node, data: any[] | Object, index: number) => {
                const self = this;
                // $("table").on('click', '#editButton-' + index, function () {
                //   self.getEdit(data);
                // });

                // $("table").on('click', '#deleteButton-' + index, function () {
                //   self.deleteItem(data);
                // });

                // $('#changeStatusButton', row).bind('click', () => {
                //   self.changeStatus(data);
                // });
                return row;
            },
            drawCallback: function (settings) {
                Global.loadCustomScripts('customJsScript');
            },
            pagingType: 'full_numbers',
            serverSide: true,
            processing: true,
            ordering: false,
            searching: true,
            pageLength: Global.DataTableLength,
            lengthChange: true, lengthMenu: Global.DataTableLengthChangeMenu,
            responsive: true,
            order: [],
            // searchDelay: 3000,
            language: {
                searchPlaceholder: 'Search...',
                search: ""
            }
        };
    }

    filterPayload: any = {};
    filterDataTable(payload: any) {
        this.filterPayload = payload;

        $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
    }
}
