import { Component, Input, OnInit } from '@angular/core';
import * as Global from 'src/app/globals';

@Component({
    selector: 'payslip-template-modal',
    templateUrl: './payslip-template-modal.component.html',
    styleUrls: ['./payslip-template-modal.component.css']
})
export class CMPPayslipTemplateModalComponent implements OnInit {
    Global = Global
    @Input() empData: any = null
    @Input() tempDetails: any = null
    @Input() wageMonth: any = null
    @Input() wageYear: any = null

    constructor() { }

    ngOnInit() {
      // console.log(this.tempDetails);

    }
}
