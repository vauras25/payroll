import { Component, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators,FormArray, FormGroup } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import swal from 'sweetalert2';
import PaginationOptions from 'src/app/models/PaginationOptions';
import { DatePipe } from '@angular/common';
import { json } from 'stream/consumers';
import { ActivatedRoute,Router } from '@angular/router';
import { fileSizeValidator } from 'src/app/globals';
import { filesSizeValidator } from 'src/app/globals';
@Component({
  selector: 'app-view-pending-tds',
  templateUrl: './view-pending-tds.component.html',
  styleUrls: ['./view-pending-tds.component.css']
})
export class ViewPendingTdsComponent implements OnInit {
  tdsForm: UntypedFormGroup;
  editActionId: String;
  employee_id:any;
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
  declaration_id:any='';
  valid_fields=["rental_amount","address","landlord_name","urbanizaion_type","landlord_pan"];
  max_upload_limit: number=0;
  net_uploaded_size: number=0;
  
  yearMaster: any[] = [];

  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe,
    private activatedRoute: ActivatedRoute,
    private router: Router,

  ) { 

    
    this.editActionId = '';
    let currentYear = new Date().getFullYear();
    this.yearMaster = [];
    for (let index = 4; index >= 0; index--) {
      this.yearMaster.push({ value: (currentYear - index), description: (currentYear - index) });
    }
  }

  ngOnInit(): void {
    this.tdsForm = this.formBuilder.group({
      declaration_id:[null],
      rental_house:[null, Validators.compose([])],
      applicable_for:[null, Validators.compose([])],
      rental_financial_year:[this.yearMaster.find((obj: any) => {
        return obj.value == new Date().getFullYear()
      }) ?? null, Validators.compose([])],
      rental_from_date:[null, Validators.compose([])],
      rental_to_date:[null, Validators.compose([])],
      rental_amount :[null, Validators.compose([Validators.pattern("^[0-9]*$")])],
      address:[null, Validators.compose([])],
      landlord_name:[null, Validators.compose([])],
      urbanizaion_type:["", Validators.compose([])],
      landlord_pan:[null,Validators.compose([Validators.pattern("^[A-Z]{5}[0-9]{4}[A-Z]{1}$")])],
      rantal_document:[[], Validators.compose([])],
      rantal_document_file:[null,Validators.compose([])],
      rantal_documents_previews:[null],
      house_property:[null, Validators.compose([])],
      rental_income:[null, Validators.compose([])],
      eighty_c_investment_status:[null, Validators.compose([])],
      eighty_c_investments:this.formBuilder.array([]),
      other_income_amount:[null, Validators.compose([])],
      other_income_document_file:["", Validators.compose([])],
      other_income_document:["", Validators.compose([])]


   });
  this.employee_id=this.activatedRoute.snapshot.paramMap.get('employee_id') || null; 
  this.fetchtdsDetails();
  

  }
fetchtdsDetails()
{
  this.spinner.show();
  this.companyuserService.gettdsDetails({employee_id:this.employee_id,type:'temp'}).subscribe(res => {
    this.spinner.hide();
    if (res.status == 'success') {
      if(!Global.isEmpty(res.data))
      {
        this.tdsDetails=  res.data;
        let rantal_documents_previews:any=[];
        this.tdsDetails.rantal_house_documents.forEach((element:any) => {
          rantal_documents_previews.push(element.file); 
        });
       
        this.tdsForm.patchValue({declaration_id:this.tdsDetails._id, 
          rental_house:this.tdsDetails.rental_house,
          rental_financial_year:this.yearMaster.find((obj: any) => {
            return obj.value == this.tdsDetails.rental_financial_year
            return obj.value == new Date().getFullYear()
          }) ?? null,
          house_property:this.tdsDetails.house_property,
          rental_income:this.tdsDetails.rental_income,
          applicable_for:this.tdsDetails.applicable_for,
          other_income_amount:this.tdsDetails?.other_income_u_s_two_b?.amount ?? 0 ,

        });
        if(this.tdsDetails.rental_house=='Y')
        {
         
         this.tdsForm.patchValue({ rental_amount :this.tdsDetails.rental_amount,
         address:this.tdsDetails.address,
         landlord_name:this.tdsDetails.landlord_name,
         urbanizaion_type:this.tdsDetails.urbanizaion_type,
         landlord_pan:this.tdsDetails.landlord_pan,
         rantal_document_file:this.tdsDetails.rental_house,
         rantal_documents_previews:rantal_documents_previews,
         });

        }     
        else{

        }   
      }
      this.getTDS(this.tdsDetails?.deduction_items ?? []);
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



getTDS(deductionItems:any=[])
{
  this.companyuserService.getTDSAct({}).subscribe(res => {
    if (res.status == 'success') {
     let tds_actions:any=[];
     tds_actions=res?.data?.tds;
  
     this.initChilds(tds_actions,deductionItems);  
    } else if (res.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(res.val_msg));
    } else {
        this.toastr.error(res.message);
    }
}, (err) => {
    this.toastr.error(Global.showServerErrorMessage(err));
});
}

initChilds(items: any = [],deductionItems:any=[])
  {
    (this.tdsForm.controls['eighty_c_investments'] as FormArray).clear();
    let counter:any=0;
    items?.forEach((element:any,index:any) => {
    this.eighty_c_investments().push(this.newDeduction({name:element?.name, value:element?.value,is_parent:true}));
    let net_amnt=0;
    if(element?.child.length>0)
    {
      element?.child.forEach((subElem:any) => {
        subElem.parent_id=element?.name;
        subElem.name=subElem?.key;
        this.eighty_c_investments().push(this.newDeduction(subElem));
        subElem.label="";
        let eighty_c=deductionItems.find((x:any)=>x.key==subElem.key)
        if(eighty_c)
        {
          if(eighty_c.child.length>0)
            {
              eighty_c.child.forEach((child:any) => {
                child.parent_id=element.name;
                child.pre_sub_declaration_document=child.documents ?? [];
                let amnt=parseInt(child.amount);
                if(isNaN(amnt))
                {
                  amnt=0;
                }
                net_amnt+=amnt; 
                this.deductionSubItems(this.eighty_c_investments().length-1).push(this.newSubItem(child)); 
 
              });
            }
            else{
              let amnt=parseInt(subElem.amount);
              if(isNaN(amnt))
              {
                amnt=0;
              }
              net_amnt+=amnt; 
              this.deductionSubItems(this.eighty_c_investments().length-1).push(this.newSubItem(subElem)); 

            }
           
        }
        else{
          this.deductionSubItems(this.eighty_c_investments().length-1).push(this.newSubItem(subElem)); 

        }

        counter++;
      }); 
    }

    let firstElem_index:any
    firstElem_index=this.tdsForm.value.eighty_c_investments.findIndex((x:any)=>x.name==element.name);
    this.eighty_c_investments().at(firstElem_index).patchValue({amount:net_amnt});

     
  });
  $("input").attr("disabled",'true');
  $("textarea").attr("disabled",'true');


  }


 eighty_c_investments(): FormArray {
    return this.tdsForm.get("eighty_c_investments") as FormArray
  }
  deductionRows() {
    return this. eighty_c_investments().controls;
  }
  newDeduction(data:any): FormGroup {
    return this.formBuilder.group({
      parent_id:[data?.parent_id ?? null],
      label:[data?.value ?? null],
      is_parent:[data?.is_parent ?? false],
      amount:[0],
      type:[data?.type ?? ""],
      name:[data?.name ?? null],
      children:this.formBuilder.array([]),


    })
  }

  deductionSubItems(Index:number) : FormArray {
    return this.eighty_c_investments().at(Index).get("children") as FormArray
  }

  newSubItem(data:any): FormGroup {
    return this.formBuilder.group({
      parent_id:[data?.parent_id ?? null],
      label:[data?.label ?? ""],
      amount: [data?.amount ?? null],
      is_parent:[data?.is_parent ?? false],
      type:[data?.type ?? ""],
      document_file:[],
      pre_sub_declaration_document:[data.pre_sub_declaration_document ?? []],
      name:[data?.name ?? null],


    })
  }
  changeAmount(parent_id:any)
  {
    let net_amnt=0;
    let eighty_c_investments=this.tdsForm.value.eighty_c_investments.filter((x:any)=>x.parent_id==parent_id);
    eighty_c_investments.forEach((element:any) => {
    element.children.forEach((x:any) => {
      x.amount=parseFloat(x.amount)  ;
    if(isNaN(x.amount))
    {
      x.amount=0;
      
    }
    net_amnt+=x.amount  
    })
      
    });
    let top_parent_index=this.tdsForm.value.eighty_c_investments.findIndex((x:any)=>x.name==parent_id);
    this.eighty_c_investments().at(top_parent_index).patchValue({amount:net_amnt});


  }
  approveTDS(event:any)
  {
  Global.scrollToQuery("p.error-element");
  
  event.target.classList.add('btn-loading');
  
  let key=0;
 

  let submitData={
    declaration_id:this.tdsDetails._id,
    

  }

  this.companyuserService.approveTDS(submitData).subscribe(res => {
    if (res.status == 'success') {
        this.toastr.success(res.message);
        this.cancelEntry();
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
  cancelEntry()
  {
    this.router.navigateByUrl('company/approval/tds-declaretion');
  }
}
