import { Component, OnInit, Input, AfterContentInit, AfterViewInit, OnChanges } from '@angular/core';
import * as Global from 'src/app/globals';

@Component({
    selector: 'companyuser-employee-salarytemp-details',
    templateUrl: './employee-salarytemp-details.component.html',
    styleUrls: ['./employee-salarytemp-details.component.css']
})

export class CMPEmployeeSalarytempDetailsComponent implements OnInit, OnChanges {
    Global = Global;
    @Input() employeeDetails: any = null;
    @Input() salaryTemplateDetails: any = null;
    data: any = null;

    async ngOnInit() {
        console.log(this.salaryTemplateDetails);
    }

    ngOnChanges(): void {
        if(this.salaryTemplateDetails){
            this.data = JSON.parse(JSON.stringify(this.salaryTemplateDetails))   
            delete this.salaryTemplateDetails.heads
        }
        console.log(this.employeeDetails);
        
    }

    async printPackageDetails() {
        
      const modal = await Global.documentPrintByElement('print-section', '@page { size: landscape; }');
    }
}