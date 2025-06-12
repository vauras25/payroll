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
import { ActivatedRoute } from '@angular/router';
import { fileSizeValidator } from 'src/app/globals';
import { filesSizeValidator } from 'src/app/globals';

@Component({
  selector: 'app-employee-tds',
  templateUrl: './employee-tds.component.html',
  styleUrls: ['./employee-tds.component.css']
})
export class EmployeeTdsComponent implements OnInit {
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
  employee_details: any;
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

  ) { 

    
    this.editActionId = '';
    let currentYear = new Date().getFullYear();
    this.yearMaster = [];
    for (let index = 4; index >= 0; index--) {
      this.yearMaster.push({ value: (currentYear - index), description: (currentYear - index) });
    }
  }

 async ngOnInit() {
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
  await this.fetchCompanyDetails();
  this.fetchtdsDetails();

  }
  toggle(event:any,target: any,template_data:any='')
  {

    if(event.target.checked)
    {
      this.tdsForm.patchValue({[target]:'Y'})
      if(template_data)
      {
        this.addTemplateRows(template_data);
      }
      if(target=='rental_house')
      {
        this.setRequered(this.valid_fields,true);
        if(this.declaration_id=='')
        {
        this.tdsForm.controls["rantal_document"].setValidators([Validators.required]);
        }

      }
    }
    else{
      this.tdsForm.patchValue({[target]:'N'});
     
      if(target=='rental_house')
      {
        alert("Remove Valid");
        this.setRequered(this.valid_fields,false);

      }
    }
   

  }
  onFileChanged(event: any, type: any, i: any, target: any,j:any) {
    if (event.target.files.length > 0) {
      let count;
      let documents:any=[];
      for(count=0;count<event.target.files.length;count++)
      {
        documents.push(event.target.files[count]);  
      }
      this.returnFileSize();
      let max_upload_file_size=this.max_upload_limit-this.net_uploaded_size;
      if(max_upload_file_size<0)
      {
          max_upload_file_size=0;
      }
      this.deductionSubItems(i).at(j).get('document_file')?.setValidators([filesSizeValidator(documents,Global.maxFileSize(max_upload_file_size))]);

      this.deductionSubItems(i).at(j).get('document_file')?.updateValueAndValidity();

      this.deductionSubItems(i).at(j).patchValue({
        [target]: documents
      });
    }
    

}
onMulFileChanged(event: any,target: any,field:any) {
  if (event.target.files.length > 0) {
    let count;
    let documents:any=[];
    for(count=0;count<event.target.files.length;count++)
    {
      documents.push(event.target.files[count]);  
    }
    this.returnFileSize();
    let max_upload_file_size=this.max_upload_limit-this.net_uploaded_size;
    if(max_upload_file_size<0)
    {
        max_upload_file_size=0;
    }
    this.tdsForm.get([field])?.setValidators([filesSizeValidator(documents,Global.maxFileSize(max_upload_file_size))]);

    this.tdsForm.get([field])?.updateValueAndValidity();

    this.tdsForm.patchValue({

      [target]: documents

    });

  }
  

}



returnFileSize()
{
  let eighty_c_investments= this.tdsForm.value.eighty_c_investments.filter((x:any) =>x.children.length>0)

  eighty_c_investments.forEach((element:any) => { 
  
  element.children.forEach((item:any) => {
  if(item?.document_file)
  {
    item.document_file.forEach((subElem:any) => {
      this.net_uploaded_size+= (subElem.size/1024);
      });  
  }  

  this.tdsDetails.value?.other_income_document_file.forEach((x:any) => {
    this.net_uploaded_size+= (x.size/1024);

  })
  this.tdsDetails.value?.rantal_document.forEach((x:any) => {
    this.net_uploaded_size+= (x.size/1024);

  })
    
  });


  });
}




removeTemplateRow(i: number,j:number,parent_id:any) {
  const control = <FormArray>this.eighty_c_investments().at(i).get("children");
  control.removeAt(j);
  this.changeAmount(parent_id);
  
}

addTemplateRows(i:any,parent_id:any='') {
 this.deductionSubItems(i).push(this.newSubItem({parent_id:parent_id})); 
  
}
cancelEntry() {
  Global.resetForm(this.tdsForm);
}
add(event:any)
{
  this.tdsForm.markAllAsTouched();
  Global.scrollToQuery("p.error-element");
  
  if (this.tdsForm.valid) {
  event.target.classList.add('btn-loading');
  let declaration_items:any=[];
  let declaration_key:any=[];
  let declaration_sub_label:any=[];
  let declaration_sub_amount:any=[];
  let declaration_sub_document:any=[];  
  let declaration_p_head:any=[];
  let key=0;
  //let eighty_c_investments= this.tdsForm.value.eighty_c_investments.filter((x:any) =>x.children.length>0)
 
  let eighty_c_investments=this.tdsForm.value.eighty_c_investments;

  let submitData={
    rental_house:this.tdsForm.value.rental_house ?? 'N',
    rental_from_date:this.tdsForm.value.rental_from_date,
    rental_to_date:this.tdsForm.value.rental_to_date,
    rental_amount :this.tdsForm.value.rental_amount,
    address:this.tdsForm.value.address,
    landlord_name:this.tdsForm.value.landlord_name,
    urbanizaion_type:this.tdsForm.value.urbanizaion_type,
    landlord_pan:this.tdsForm.value.landlord_pan,
    rantal_house_documents:this.tdsForm.value.rantal_document_file,
    house_property:this.tdsForm.value.house_property,
    rental_income:this.tdsForm.value.rental_income,
    employee_id:  this.employee_id,
    declaration_id: this.tdsForm.value.declaration_id,
    rental_financial_year:this.tdsForm.value?.rental_financial_year?.value,
    applicable_for:this.tdsForm.value?.applicable_for,
    eighty_c_investments:eighty_c_investments,
    other_income_amount:this.tdsForm.value.other_income_amount,
    other_income_label:"",
    other_income_document:this.tdsForm.value.other_income_document

  }

  this.companyuserService.savetdsDetails(submitData).subscribe(res => {
    if (res.status == 'success') {
        this.toastr.success(res.message);
        this.fetchtdsDetails();
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

fetchtdsDetails()
{
  this.spinner.show();
  this.companyuserService.gettdsDetails({employee_id:this.employee_id}).subscribe(res => {
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

         this.setRequered(this.valid_fields,true) 
        }     
        else{
          this.setRequered(this.valid_fields,false) 

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
// let eighty_c_investments = <UntypedFormArray>this.tdsForm.get('eighty_c_investments');
// eighty_c_investments.clear();
// eighty_c_investments.push(this.initTemplateRows());
}

setRequered(items:any,isRequired:any=true)
{
  items.forEach((element:any) => {
  if(isRequired)
  {
    this.tdsForm.controls[element].setValidators([Validators.required]);
    this.tdsForm.controls[element].updateValueAndValidity();


  } 
  else{
    
    this.tdsForm.controls[element].clearValidators();
    this.tdsForm.controls[element].updateValueAndValidity();


  } 

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
  fetchEmployeeDetails() {
    this.spinner.show();
    this.companyuserService.getEmployeeDetails({ employee_id: this.employee_id })
        .subscribe((res: any) => {
            if (res.status == 'success') {
                this.employee_details = res.employee_det
            } else {
                this.toastr.error(res.message);
            }
            this.net_uploaded_size = +res?.employee_det?.total_file_size;
            if(isNaN(this.net_uploaded_size))
              {
                  this.net_uploaded_size=0;
              }
              if(this.net_uploaded_size>=this.max_upload_limit)
              {
                  this.tdsForm.controls['rantal_document'].disable();
                  this.tdsForm.controls['other_income_document_file'].disable();
              }
            this.spinner.hide();
        }, (err) => {
            this.spinner.hide();
            this.toastr.error(Global.showServerErrorMessage(err));
        });
  }
  fetchCompanyDetails() {
    return new Promise((resolve, reject) => {
        this.spinner.show();
        this.companyuserService.getCompanyDetails()
            .subscribe((res: any) => {
                if (res.status == 'success') {
                this.max_upload_limit=+res?.company_det?.package[0]?.employee_vault;    
                // this.net_uploaded_size=+res?.company_det?.total_file_size;
                if(isNaN(this.max_upload_limit))
                {
                    this.max_upload_limit=0;
                }
                // if(isNaN(this.net_uploaded_size))
                // {
                //     this.net_uploaded_size=0;
                // }
                // if(this.net_uploaded_size>=this.max_upload_limit)
                // {
                //     this.tdsForm.controls['rantal_document'].disable();
                //     this.tdsForm.controls['other_income_document_file'].disable();


                // }

                resolve(true);
                } else {
                    this.toastr.error(res.message);
                    resolve(false);
                }

                this.spinner.hide();
            }, (err) => {
                this.spinner.hide();
                this.toastr.error(Global.showServerErrorMessage(err));
                resolve(false);
            });
    })
  }

removeeightC()
{
  if(this.tdsForm.value.applicable_for=='new_regime')
  {
    (this.tdsForm.controls['eighty_c_investments'] as FormArray).clear();

  }
  else{
    this.getTDS();
  }
}
}
