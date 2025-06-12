import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { CommonService } from 'src/app/services/common.service';
import * as Global from 'src/app/globals';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'employee-app-view',
    templateUrl: './view.component.html',
    styleUrls: ['../employee-user-layout.component.css'],
    encapsulation: ViewEncapsulation.None

})
export class EMPViewComponent implements OnInit {
    permission:any;
    constructor( private authService: AuthService,private commonService: CommonService,private toastr: ToastrService,) {

    }

    ngOnInit(): void {
    this.permission=this.authService.getempPermission();
  
    }
}
