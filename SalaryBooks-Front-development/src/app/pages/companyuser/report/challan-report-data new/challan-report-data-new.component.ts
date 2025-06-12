import { Component, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import swal from 'sweetalert2';

@Component({
  selector: 'app-companyuser-challan-report-data',
  templateUrl: './challan-report-data-new.component.html',
  styleUrls: ['./challan-report-data-new.component.css'],
})
export class CMPChallanReportDataNewComponent implements OnInit {
  Global = Global;
  dtOptions: DataTables.Settings = {};
  sheetConfirmationDetails: any = null;
  confirmationForm: UntypedFormGroup;
  challanDataListing: any[] = [];
  challanType = 'pf';
  challanFor = 'ECR';
  searchByKeyword = '';
  reportPaginationOptions: PaginationOptions = Global.resetPaginationOption();
  reportTableFilterOptions: TableFilterOptions =
    Global.resetTableFilterOptions();

  // challanType: string = "";

  constructor(
    private titleService: Title,
    private toastr: ToastrService,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    public formBuilder: UntypedFormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    if (
      !Global.checkCompanyModulePermission({
        company_module: 'compliance',
        company_sub_module: 'challan_data',
        company_sub_operation: ['view'],
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
    this.confirmationForm = formBuilder.group({
      remarks: [null, Validators.compose([Validators.required])],
    });
  }

  ngOnInit(): void {
    switch (this.activatedRoute.snapshot.url[1].path) {
      case 'pf-challan-report':
        this.challanType = 'pf';
        break;

      case 'esic-challan-report':
        this.challanType = 'esic';
        break;
    }
    const filter = this.activatedRoute.snapshot.queryParams['filter'];
    if (filter) {
      this.challanType = filter;
    }

    this.titleService.setTitle(
      this.challanType.toUpperCase() +
        ' Challan Report Data - ' +
        Global.AppName
    );

    this.fetchChallanData();
  }

  async fetchChallanData() {
    try {
      this.challanDataListing = [];
      let res = await this.companyuserService
        .getChallanData({
          pageno: this.reportPaginationOptions.page,
          perpage: this.reportPaginationOptions.limit,
          challan_for: this.challanType,
          challan_type: this.challanFor,
          searchkeyword: this.searchByKeyword,
        })
        .toPromise();
      if (res) {
        if (res.status == 'success') {
          this.challanDataListing = res.challan_data.docs;
          // this.challanDataListing.forEach((doc: any) => {
          //   doc.checked = this.isRowChecked(doc._id);
          // });
          return res;
        } else if (res.status == 'val_err') {
          return this.toastr.error(Global.showValidationMessage(res.val_msg));
        } else {
          throw res.message;
        }
      }
    } catch (err: any) {
      return this.toastr.error(err?.message || err);
    }
  }

  async downloadSheet(_id: string, fileType: string, fileNo: string) {
    try {
      this.spinner.show();
      await this.companyuserService.downloadFile(
        'download-challan-data',
        `${this.challanType} challan of file no ${fileNo}`,
        {
          challan_id: _id,
          type: 'download',
          file_type: fileType,
        }
      );
    } catch (err: any) {
      this.toastr.error(err.message || err);
    } finally {
      this.spinner.hide();
    }
    //   let fileName;
    //   if(fileType  == 'text') fileName =  data?.text_file_name
    //   if(fileType  == 'xlsx') fileName =  data?.xlsx_file_name

    //   window.open(Global.BACKEND_URL + "/" + fileName);
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
      this.companyuserService
        .confirmChallanReportData(
          {
            referance_file_id: this.sheetConfirmationDetails?._id,
            remarks: this.confirmationForm?.value?.remarks,
          },
          this.challanType
        )
        .subscribe(
          (res) => {
            event.target.classList.remove('btn-loading');
            if (res.status == 'success') {
              this.toastr.success(res.message);
              $('#my-datatable')
                .dataTable()
                .api()
                .ajax.reload(function (json) {}, false);
              this.cancelSheetConfirmation();
            } else {
              this.toastr.error(res.message);
            }
          },
          (err) => {
            event.target.classList.remove('btn-loading');
            this.toastr.error(Global.showServerErrorMessage(err));
          }
        );
    }
  }

  deleteSheet(item: any) {
    swal
      .fire({
        title: 'Are you sure want to delete?',
        text: 'You will not be able to reverse your action!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, cancel it',
      })
      .then((result) => {
        if (result.value) {
          this.spinner.show();
          this.companyuserService
            .deleteChallanReportData(
              {
                referance_file_id: item?._id,
              },
              this.challanType
            )
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
        }
      });
  }

  formatmonth(month: any) {
    if (month) {
      return Global.monthMaster.find((m) => m.index == month)?.description;
    } else {
      return 'N/A';
    }
  }
}
