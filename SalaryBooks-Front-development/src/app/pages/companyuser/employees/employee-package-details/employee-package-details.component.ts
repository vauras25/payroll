import { Component, OnInit, Input } from '@angular/core';
import * as Global from 'src/app/globals';

@Component({
    selector: 'companyuser-employee-package-details',
    templateUrl: './employee-package-details.component.html',
    styleUrls: ['./employee-package-details.component.css']
})

export class CMPEmployeePackageDetailsComponent implements OnInit {
    @Input() packageDetails: any = null;
     months:any = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
      ];
    async ngOnInit() {
    }

    printPackageDetails() {
        console.log(document.getElementById('print-section-policy'));
        
        Global.documentPrintByElement('print-section-policy','', true);
    }

    getMonth(mnth:any){
        const monthIndex = parseInt(mnth);
        if (monthIndex >= 0 && monthIndex < this.months.length) {
            return this.months[monthIndex];  
        }
        
    }
    formatPayslipHeads(data:any){
      return data.split("_").join(" ");
      // return data
     }
}
