import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as Global from 'src/app/globals';
import { CompanyuserService } from 'src/app/services/companyuser.service';

@Component({
    selector: 'companyuser-appemployee-form-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.css']
})
export class CMPEmployeeFormNavbarComponent implements OnInit {
    employee_id: any;
    employee_details: any = null;
    operation: any;
    Global = Global;

    constructor(
        private activatedRoute: ActivatedRoute,
        public router: Router,
        private companyuserService: CompanyuserService
    ) { }

    async ngOnInit() {
        this.activatedRoute.params.subscribe(params => {
            this.employee_id = params['employee_id'] ?? null;
            
        })

        if (!this.employee_id) {
            this.operation = 'add';
        } else {
            let r = this.router.url.split('/')
           
            if (r[4] == 'view' || r[4] == 'tds') {
                this.operation = 'view';
            } else if (r[4] == 'edit') {
                this.operation = 'edit';
            }

            await this.fetchEmployeeDetails()
        }
    }

    fetchEmployeeDetails() {
        this.companyuserService.getEmployeeDetails({
            employee_id: this.employee_id
        }).subscribe((res) => {
            if (res.status == 'success') {
                this.employee_details = res?.employee_det ?? null
            }
        })
    }
}
