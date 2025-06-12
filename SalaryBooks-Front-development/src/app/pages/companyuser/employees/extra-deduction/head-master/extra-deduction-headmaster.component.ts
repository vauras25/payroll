import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subscription } from 'rxjs';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';

@Component({
    selector: 'companyuser-extra-deduction-headmaster',
    templateUrl: './extra-deduction-headmaster.component.html'
})

export class CMPExtraDeductionHeadMasterComponent implements OnInit {
    Global = Global;
    earningHeadForm: UntypedFormGroup;
    headIncludeMaster: any[] = [];

    private eventsSubscription: Subscription

    @Input() initEarningHeadEntry: Observable<void>;
    @Input() earningStatusMaster: any[] = [];

    @Output() headMasterSubmitted: EventEmitter<any> = new EventEmitter<any>();

    constructor(
        public formBuilder: UntypedFormBuilder,
        private titleService: Title,
        private companyuserService: CompanyuserService,
        private toastr: ToastrService,
        private router: Router,
        private spinner: NgxSpinnerService,
    ) {
        this.earningHeadForm = formBuilder.group({
            "head_name": [null, Validators.compose([Validators.required])],
            "abbreviation": [null, Validators.compose([Validators.required])],
            "earning_status": [null, Validators.compose([Validators.required])],
            // "head_include_in": [null, Validators.compose([Validators.required])],
        });

        this.headIncludeMaster = [
            { value: "PF", description: "PF" },
            { value: "ESI", description: "ESI" },
            { value: "PT", description: "PT" },
            { value: "TDS", description: "TDS" },
        ];
    }

    ngOnInit() {
        this.eventsSubscription = this.initEarningHeadEntry.subscribe(() => {
            this._initEarningHeadEntry();
        });
    }

    ngOnDestroy() {
        this.eventsSubscription.unsubscribe();
    }

    _initEarningHeadEntry() {
        this.cancelEarningHeadEntry
        $('#earningHeadsModalButton')?.click();
    }

    cancelEarningHeadEntry() {
        this.resetSelectHeadIncludes();
        Global.resetForm(this.earningHeadForm)
        $('#earningHeadsModal')?.find('[data-dismiss="modal"]')?.click();
    }

    addEarningHead(event: any) {
        const headincludes: any[] = this.getSelectedHeadIncludes();
        // if (headincludes.length < 1) {
        //     this.toastr.error("Please select atleast one include to continue");
        //     return;
        // }

        if (this.earningHeadForm.valid) {
            event.target.classList.add('btn-loading');

            this.companyuserService.createExtraEarningHead({
                'head_name': this.earningHeadForm.value.head_name ?? "",
                'abbreviation': this.earningHeadForm.value.abbreviation ?? "",
                'earning_status': this.earningHeadForm.value.earning_status?.value ?? "",
                'head_include_in': JSON.stringify(headincludes),
            }).subscribe(res => {
                if (res.status == 'success') {
                    this.toastr.success(res.message);
                    this.cancelEarningHeadEntry();
                    // this.fetchEarningHeads();

                    this.headMasterSubmitted.emit();
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

    getSelectedHeadIncludes() {
        let arr: any[] = [];

        $('input[name="headincludes"]:checked').each(function () {
            arr.push($(this).val());
        });

        return arr;
    }

    resetSelectHeadIncludes() {
        $('input[name="headincludes"]').prop('checked', false)
    }
}
