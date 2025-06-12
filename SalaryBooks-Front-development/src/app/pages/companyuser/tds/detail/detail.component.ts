import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators,FormArray } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import swal from 'sweetalert2';
import PaginationOptions from 'src/app/models/PaginationOptions';
import { DatePipe } from '@angular/common';
import { json } from 'stream/consumers';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.css']
})
export class DetailComponent implements OnInit {
  editActionId: String;
  @Input() employee_id: any;
  dtOptions: DataTables.Settings = {};
  dtOptionsLibrary: DataTables.Settings = {};
  Global=Global;
  stateMaster: any[] = [];
  tenureMaster: any[] = [];
  templateRows: any[] = [];
  libraryTemplateRows: any[] = [];
  paginationOptions: PaginationOptions;
  libraryPaginationOptions: PaginationOptions;
  tdsDetails:any;
  @Input() declaration_id: any;
  @Output() tdsstatusChange =new EventEmitter();

  eighty_c_investments:any=[];
  investment_types:any=[
    {key:'eighty_c_investments_investment',value:'80C Investments'},{key:'eighty_ccc_investments_investment',value:'80CCC Investments'},
    {key:'eighty_ccd_one_investments_investment',value:'80CCD(1) Investments'},
    {key:'eighty_ccd_one_b_investments_investment',value:'80CCD(1B) Investments'},{key:'eighty_ccd_two_investments_investment',value:'80CCD(2)'},
    {key:'eighty_d_investments_investment',value:'80D Investments(1)'},{key:'eighty_dd_investments_investment',value:'80D Investments(2)'},
    {key:'eighty_ddb_investments_investment',value:'80D Investments(3)'},{key:'eighty_e_investments_investment',value:'80D Investments(4)'},
    {key:'eighty_ee_investments_investment',value:'80D Investments(5)'}, 
    {key:'eighty_eea_investments_investment',value:'80D Investments(6)'},{key:'eighty_eeb_investments_investment',value:'80D Investments(7)'},
    {key:'eighty_g_investments_investment',value:'80D Investments(8)'},
    {key:'eighty_gg_investments_investment',value:'80D Investments(9)'},
    {key:'eighty_gga_investments_investment',value:'80D Investments(10)'},{key:'eighty_ggb_investments_investment',value:'80D Investments(11)'},
    {key:'eighty_ggc_investments_investment',value:'80D Investments(12)'},{key:'eighty_rrb_investments_investment',value:'80D Investments(13)'},
    {key:'eighty_qqb_investments_investment',value:'80D Investments(14)'},
    {key:'eighty_tta_investments_investment',value:'80D Investments(15)'},
    {key:'eighty_ttb_investments_investment',value:'80D Investments(16)'},
    {key:'eighty_u_investments_investment',value:'80D Investments(17)'},
    {key:'other_investments_investment',value:'Other Inverstments'}
  ];
  investment_types_vew:any=[
    {key:'eighty_c_investments'},{key:'eighty_ccc_investments'},{key:'eighty_ccd_one_investments'},
    {key:'eighty_ccd_one_b_investments'},{key:'eighty_ccd_two_investments'},{key:'eighty_d_investments'},{key:'eighty_dd_investments'},
    {key:'eighty_ddb_investments'},{key:'eighty_e_investments'},{key:'eighty_ee_investments',}, {key:'eighty_eea_investments'},{key:'eighty_eeb_investments'},
    {key:'eighty_g_investments'},{key:'eighty_gg_investments'},{key:'eighty_gga_investments',},{key:'eighty_ggb_investments'},
    {key:'eighty_ggc_investments'},{key:'eighty_rrb_investments'},{key:'eighty_qqb_investments'},{key:'eighty_tta_investments'},{key:'eighty_ttb_investments'},{key:'eighty_u_investments'},{key:'other_investments'}
  ];
  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe,
    private activatedRoute: ActivatedRoute,

  ) { }

  ngOnInit(): void {
  }
  ngOnChanges() {
  this.eighty_c_investments=[];  
  this.fetchtdsDetails();  
  }


  fetchtdsDetails()
{
  this.spinner.show();
  this.companyuserService.gettdsDetails({employee_id:this.employee_id}).subscribe(res => {
    this.spinner.hide();
    if (res.status == 'success') {
      if(!Global.isEmpty(res.data))
      {
        this.tdsDetails=  res.data;
        this.investment_types_vew.forEach((element:any) => {
          if(this.tdsDetails[element.key].length>0){
            this.tdsDetails[element.key].forEach((elem:any) => {
            let investment=  this.investment_types.find((x:any)=>x.key==elem.investment);
            this.eighty_c_investments.push({
              investment:investment?.value,amount:elem.amount,documents:elem.documents  
            });  
    
            });  
    
          }
          });
         
       
       
       

      }
      
    } else if (res.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(res.val_msg));
    } else {
        this.toastr.error(res.message);
    }

}, (err) => {
  this.spinner.hide();

    this.toastr.error(Global.showServerErrorMessage(err));
});

}
approveTDS()
{
  this.spinner.show();
  this.companyuserService.approveTDS({declaration_id:this.declaration_id}).subscribe(res => {
    this.spinner.hide();
    if (res.status == 'success') {
      this.toastr.success(res.message);
      this.tdsstatusChange.emit(true);

    } else if (res.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(res.val_msg));
    } else {
        this.toastr.error(res.message);
    }

}, (err) => {
  this.spinner.hide();

    this.toastr.error(Global.showServerErrorMessage(err));
});

}

}
