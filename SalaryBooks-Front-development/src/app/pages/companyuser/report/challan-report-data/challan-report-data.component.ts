import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import swal from 'sweetalert2';

@Component({
    selector: 'app-companyuser-challan-report-data',
    templateUrl: './challan-report-data.component.html',
    styleUrls: ['./challan-report-data.component.css']
})
export class CMPChallanReportDataComponent implements OnInit {
    Global = Global;
    dtOptions: DataTables.Settings = {};
    sheetConfirmationDetails: any = null;
    confirmationForm: UntypedFormGroup;

    challanType: string = "";

    constructor(
        private titleService: Title,
        private toastr: ToastrService,
        private companyuserService: CompanyuserService,
        private spinner: NgxSpinnerService,
        public formBuilder: UntypedFormBuilder,
        private router: Router,
        private activatedRoute: ActivatedRoute
    ) {
        this.confirmationForm = formBuilder.group({
            remarks: [null, Validators.compose([Validators.required])],
        });
    }

    ngOnInit(): void {
        switch (this.activatedRoute.snapshot.url[1].path) {
            case "pf-challan-report":
                this.challanType = "pf";
                break;

            case "esic-challan-report":
                this.challanType = "esic";
                break;
        }

        this.titleService.setTitle(this.challanType.toUpperCase() + " Challan Report Data - " + Global.AppName);

        this.fetch();
    }

    fetch() {
        this.dtOptions = {
            ajax: (dataTablesParameters: any, callback) => {
                this.companyuserService.getChallanReportData({
                    'pageno': Math.floor((dataTablesParameters.start + dataTablesParameters.length) / dataTablesParameters.length),
                    'perpage': dataTablesParameters.length,
                    'searchkey': dataTablesParameters.search.value,
                    'sortbyfield': Global.getTableSortingOptions('sortbyfield', dataTablesParameters),
                    'ascdesc': Global.getTableSortingOptions('ascdesc', dataTablesParameters)
                }, this.challanType).subscribe(res => {
                    if (res.status == 'success') {
                        callback({
                            recordsTotal: res?.challan_data?.totalDocs ?? 0,
                            recordsFiltered: res?.challan_data?.totalDocs ?? 0,
                            data: res?.challan_data?.docs ?? [],
                        });
                    } else {
                        this.toastr.error(res.message);

                        callback({
                            recordsTotal: [],
                            recordsFiltered: [],
                            data: [],
                        });
                    }
                }, (err) => {
                    this.toastr.error(Global.showServerErrorMessage(err));

                    callback({
                        recordsTotal: [],
                        recordsFiltered: [],
                        data: [],
                    });
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
                        return full.file_id;
                    },
                    orderable: true,
                    name: 'file_id'
                },
                {
                    render: (data, type, full, meta) => {
                        let html = "";

                        if (['pf'].includes(this.challanType)) {
                            html += `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Download Text File" id="downloadTxtButton-` + meta.row + `">
                                <div style="width:25px; height:25px;"><i class="fa fa-file-word"></i></div>
                            </button>`
                        }

                        html += `<button class="btn btn-primary btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Download Excel File" id="downloadXlsButton-` + meta.row + `">
                            <div style="width:25px; height:25px;"><i class="fa fa-file-excel"></i></div>
                        </button>`

                        if (['active'].includes(full.status)) {
                            html += `<button class="btn btn-success btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Confirm" id="confirmButton-` + meta.row + `">
                                <div style="width:25px; height:25px;"><i class="fa fa-check"></i></div>
                            </button>`

                            html += `<button class="btn btn-danger btn-icon mx-1" data-toggle="tooltip" data-placement="top" title="Delete" id="deleteButton-` + meta.row + `">
                                <div style="width:25px; height:25px;"><i class="fa fa-trash"></i></div>
                            </button>`
                        }


                        return html;
                    },
                    className: 'text-center',
                    orderable: false,
                },
                {
                    render: function (data, type, full, meta) {
                        const wage_month = full.wage_month

                        return Global.monthMaster.find((obj: any) => {
                            return obj.index = full.wage_month
                        })?.description ?? 'N/A'
                    },
                    orderable: true,
                    name: 'wage_month'
                },
                {
                    render: function (data, type, full, meta) {
                        return full.wage_year;
                    },
                    orderable: true,
                    name: 'wage_year'
                },
                {
                    render: function (data, type, full, meta) {
                        return full.challan_type;
                    },
                    orderable: true,
                    name: 'challan_type'
                },
            ],
            rowCallback: (row: Node, data: any | Object, index: number) => {
                $("table").on('click', '#downloadTxtButton-' + index, () => {
                    window.open(Global.BACKEND_URL + "/" + data?.text_file_name);
                });

                $("table").on('click', '#downloadXlsButton-' + index, () => {
                    window.open(Global.BACKEND_URL + "/" + data?.xlsx_file_name);
                });

                $("table").on('click', '#confirmButton-' + index, () => {
                    switch (this.challanType) {
                        default:
                            this.router.navigate([`/company/reports/${this.challanType}-challan-report/data/${data.file_id}/confirm`]);
                            break;
                    }
                });

                $("table").on('click', '#deleteButton-' + index, () => {
                    this.deleteSheet(data)
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
            lengthChange: true, lengthMenu: Global.DataTableLengthChangeMenu,
            responsive: true,
            order: [],
            language: {
                searchPlaceholder: 'Search...',
                search: ""
            }
        };
    }

    initSheetConfirmation(item: any) {
        this.cancelSheetConfirmation();
        this.sheetConfirmationDetails = item;
        $('#confirmationModalButton')?.click();
    }

    cancelSheetConfirmation() {
        this.sheetConfirmationDetails = null;
        Global.resetForm(this.confirmationForm);
        $('#confirmationModal')?.find('[data-dismiss="modal"]')?.click();
    }

    confirmSheet(event: any) {
        if (this.confirmationForm.valid) {
            event.target.classList.add('btn-loading');
            this.companyuserService.confirmChallanReportData({
                'referance_file_id': this.sheetConfirmationDetails?._id,
                'remarks': this.confirmationForm?.value?.remarks
            }, this.challanType).subscribe(res => {
                event.target.classList.remove('btn-loading');
                if (res.status == 'success') {
                    this.toastr.success(res.message);
                    $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
                    this.cancelSheetConfirmation();
                } else {
                    this.toastr.error(res.message);
                }
            }, (err) => {
                event.target.classList.remove('btn-loading');
                this.toastr.error(Global.showServerErrorMessage(err));
            });
        }
    }

    deleteSheet(item: any) {
        swal.fire({
            title: 'Are you sure want to delete?',
            text: 'You will not be able to reverse your action!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, cancel it'
        }).then((result) => {
            if (result.value) {
                this.spinner.show();
                this.companyuserService.deleteChallanReportData({
                    'referance_file_id': item?._id,
                }, this.challanType).subscribe(res => {
                    this.spinner.hide();
                    if (res.status == 'success') {
                        this.toastr.success(res.message);
                        $('#my-datatable').dataTable().api().ajax.reload(function (json) { }, false);
                    } else {
                        this.toastr.error(res.message);
                    }
                }, (err) => {
                    this.spinner.hide();
                    this.toastr.error(Global.showServerErrorMessage(err));
                });
            }
        })
    }
}
