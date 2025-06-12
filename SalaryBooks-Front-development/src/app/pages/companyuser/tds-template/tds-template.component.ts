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
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-tds-template',
  styleUrls: ['./tds-template.component.css'],
  templateUrl: './tds-template.component.html',
})
export class TdsTemplateComponent implements OnInit {
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
  salaryHeads:any=[];
  gov_earning_heads:any=[];
  deductionItems:any=[];
  tdsData:any=[];
  yearMaster: any[] = [];
  tdsLibrary:any=[];
  constructor(
    public formBuilder: UntypedFormBuilder,
    private titleService: Title,
    private toastr: ToastrService,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe,
    private router: Router,
    private activatedRoute: ActivatedRoute,  
  ) { 

    if (
      !Global.checkCompanyModulePermission({
        company_module: 'company_rules_2',
        company_sub_module: 'tds_rules',
        company_sub_operation: ['view'],
        company_strict: true
      })
    ) {
      // const _this = this;
      // setTimeout(function () {
      router.navigate(['company/errors/unauthorized-access'], {
        skipLocationChange: true,
      });
      return;
      // }, 500);
      // return;
    }

    this.tdsForm = formBuilder.group({
      template_name:['', Validators.compose([Validators.required])],
      salary_head_to_earning_head:this.formBuilder.array([this.initTemplateRows()]),
      define_deductions_rebate:[null, Validators.compose([])],
      define_deductions_rebate_financial_year:[null, Validators.compose([])],
      define_deductions_rebate_status:["old_regime", Validators.compose([])],
      define_standard_deduction:[null, Validators.compose([])],
      standard_deduction_amount:[null, Validators.compose([Validators.min(0)])],
      define_rebate:[null, Validators.compose([])],
      eligibility_for_rebate_is_taxable_value:[null, Validators.compose([])],
      eligibility_for_rebate_is_taxable_amount:[null, Validators.compose([Validators.min(0)])],
      define_hra_deduction_limits:[null, Validators.compose([])],
      define_p_tax_chapter_vi_deduction_limits:[],
      actual_hra_earned_metro:formBuilder.group({
        percentage:[null,Validators.compose([Validators.max(100),Validators.min(0)]),],
        actual_declared_hra_whichever:[null,Validators.compose([])],

      }),
      actual_hra_earned_non_metro:formBuilder.group({
        percentage:[null,Validators.compose([Validators.max(100),Validators.min(0)])],
        actual_declared_hra_whichever:[null,Validators.compose([])],

      }),
      actual_rent_declared:formBuilder.group({
        percentage:[null,Validators.compose([Validators.max(100),Validators.min(0)])],

      }),
  
      deduction_items:this.formBuilder.array([]),
      define_standard_deduction_new_regime:[null,Validators.compose([])],
      standard_deduction_amount_new_regime:[null,Validators.compose([Validators.min(0)])],
      define_rebate_new_regime:[null,Validators.compose([])],
      eligibility_for_rebate_is_taxable_value_new_regime:[null,Validators.compose([])],
      eligibility_for_rebate_is_taxable_amount_new_regime:[null,Validators.compose([Validators.min(0)])]
   });

   this.editActionId = '';

  }
  async ngOnInit() {
  await this.fetchsalaryHeads();
  await this.govearningHeads();
  this.fetch();
  this.getTDS();
  let id=this.activatedRoute.snapshot.paramMap.get('id') ?? "";

  let currentYear = new Date().getFullYear();
    this.yearMaster = [];
    for (let index = 4; index >= 0; index--) {
      this.yearMaster.push({ value: (currentYear - index), description: (currentYear - index) });
    }
this.fetchtdsLibrary();
  }
 

  initTemplateRows(data: any = {}) {
    return this.formBuilder.group({
     
      salary_head: [this.salaryHeads.find((x:any)=>x.id==data.salary_head) ?? "", Validators.compose([])],
      tax_earning_head: [this.gov_earning_heads.find((x:any)=>x.id==data.tax_earning_head) ?? "", Validators.compose([])],
    
  
    });
  }
  getTemplateRows(type: any) {
    return (this.tdsForm.get(type) as UntypedFormArray).controls;
  }
  
  removeTemplateRow(type: any, i: number) {
    const control = <UntypedFormArray>this.tdsForm.get(type);
    control.removeAt(i);
  }
  
  addTemplateRows(type: any, data: any = {}) {
    const control = <UntypedFormArray>this.tdsForm.get(type);
    control.push(this.initTemplateRows(data));
    Global.loadCustomScripts('customJsScript');
  }
  cancelEntry() {
    Global.resetForm(this.tdsForm);
  }
 
  add(event:any)
  {
    this.tdsForm.markAllAsTouched();
    Global.scrollToQuery("p.error-element");
  
    if (this.tdsForm.valid) {
      let payload:any =this.tdsForm.value;
      let deduction_items:any=[];
      if(payload?.deduction_items)
      {
      event.target.classList.add('btn-loading');
      
      payload?.deduction_items?.forEach((item:any) =>{
        let children:any=[];
        let head_type:any;
        if(item?.children)
        {
          item?.children?.forEach((child:any,i:any) =>{
            if(child?.type=='')
            {
              if(child?.amount!=null && child?.amount!='')
              {
                head_type="limit";
              }
             
            }
            else{
              head_type=child?.type;
            }  
            if(i>0)
            {

              children.push({head:child?.head,amount:child?.amount ?? '',type:head_type!=''?head_type:"NA"});

            }  
    
            });
        }
        if(item?.children?.length){

          if(item?.children[0]?.head=='Professional Tax (PT)')
          {
            item.children[0].head="professional_tax";
          }
          if(item?.children[0]?.type=='')
          {
            if(item.children[0]?.amount!=null && item?.children[0]?.amount!='')
            {
              head_type="limit";
            }
           
          }  
          else{
            head_type=item?.children[0]?.type;
          }
          deduction_items.push({head:item?.children[0]?.head,type:head_type!=''?head_type:"NA",
            'amount':item?.children[0]?.amount ?? '','sub_heads':children?.length>0?children:[]});
         
        }

      })
    }
    payload?.salary_head_to_earning_head?.forEach((doc:any) => {
      doc.salary_head=  doc?.salary_head?.id;
      doc.tax_earning_head=  doc?.tax_earning_head?.id;

    }); 
    payload.template_name = payload?.template_name
    payload.deduction_items=deduction_items;
    if(this.editActionId!='')
    {
      payload.template_id=this.editActionId;
    }
    payload.define_deductions_rebate_financial_year=payload?.define_deductions_rebate_financial_year?.value;
    this.companyuserService.savetdsTemplate(payload).subscribe(res => {
      if (res.status == 'success') {
        this.tdsForm.reset();
        (this.tdsForm.controls['salary_head_to_earning_head'] as FormArray).clear();

        this.editActionId='';
        this.getTDS();
        this.tdsForm.patchValue({define_deductions_rebate_status:'old_regime'});
        this.addTemplateRows('salary_head_to_earning_head');
        this.fetch();
        this.toastr.success(res.message);

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
  getTDS(deductionItems:any=[])
  {
    this.companyuserService.getTDSAct({}).subscribe(res => {
      if (res.status == 'success') {
       let tds_actions:any=[];
       tds_actions=res?.data?.tds;
       if(deductionItems.length>0)
       {
        let fetchPTAX=deductionItems.find((x:any)=>x.head=='professional_tax');
        tds_actions.unshift({name:'professional_tax',child:[],value:'Professional Tax (PT)',type:fetchPTAX?.type ?? "",amount:fetchPTAX?.amount ?? ""});

        tds_actions.forEach((elem:any,index:any) => {
        // console.log(deductionItems);  
        // console.log(elem);  
        if(index>0)
        {
          let fetchItem=deductionItems.find((x:any)=>x.head==elem?.value);
        let fetchItemIndex=deductionItems.findIndex((x:any)=>x.head==elem?.value);

        if(fetchItem)
        {
          elem.type=fetchItem?.type ?? "";
          elem.amount=fetchItem?.amount ?? "";

        }
        elem.child.forEach((childElemt:any)=>{
        if(fetchItemIndex!=-1)
        {
          let fetchsubItem=deductionItems[fetchItemIndex]?.sub_heads.find((y:any)=>y.head==childElemt?.value);
          childElemt.type=fetchsubItem?.type ?? '';
          childElemt.amount=fetchsubItem?.amount ?? '';

        }  
        }); 
        }
         
        });
       }
       this.initChilds(tds_actions);  
      } else if (res.status == 'val_err') {
          this.toastr.error(Global.showValidationMessage(res.val_msg));
      } else {
          this.toastr.error(res.message);
      }
  
  }, (err) => {
      this.toastr.error(Global.showServerErrorMessage(err));
  });
  }

  async fetchsalaryHeads()
  {
    this.spinner.show();
    this.companyuserService.getsalaryHeads().subscribe(res => {
      this.spinner.hide();
      if (res.status == 'success') {
       let salaryHeads:any=res.temp_head;  

       salaryHeads.forEach((element:any) => {
        this.salaryHeads.push({ "id": element._id, "description": element.full_name });
   
        }); 
      
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
  definerebate(ev:any,target:any)
  {
    if(ev.target.checked)
    {
        this.tdsForm.patchValue({
        [target]:'yes'  
        })
    }
    else{
      this.tdsForm.patchValue({
        [target]:'no'  
        })
    }
  }
  async govearningHeads()
  {
    this.spinner.show();
     this.companyuserService.getsalarygovHeads().subscribe(res => {
      this.spinner.hide();
      if (res.status == 'success') {
       this.gov_earning_heads = [];
       let gov_earning_heads=res.temp_head;
       gov_earning_heads.forEach((element:any) => {
         this.gov_earning_heads.push({ "id": element._id, "description": element.full_name });

       }); 
      

      
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
  duductCheckbox(ev:any,i:any,j:any)
  {
     

    if(ev.target.checked)
    {
      this.deductionSubItems(i).at(j)?.patchValue({type:ev.target.value});

    }
    else{
      this.deductionSubItems(i).at(j)?.patchValue({type:""});

    }
    this.deductionSubItems(i).at(j)?.patchValue({amount:''});
    
  }
  initChilds(items: any = [])
  {
    (this.tdsForm.controls['deduction_items'] as FormArray).clear();

    items?.forEach((element:any,index:any) => {
    this.deduction_items().push(this.newDeduction(element));
    this.deductionSubItems(index).push(this.newSubItem({key:element?.name, value:element?.value,is_parent:true,type:element?.type ?? "",amount:element?.amount ?? ""})); 

    if(element?.child.length>0)
    {
      element?.child.forEach((subElem:any) => {
        this.deductionSubItems(index).push(this.newSubItem(subElem)); 
      }); 
    }
   
  
     
  });
    

  }
  deduction_items(): FormArray {
    return this.tdsForm.get("deduction_items") as FormArray
  }
  deductionRows() {
    return this. deduction_items().controls;
  }
  newDeduction(data:any): FormGroup {
    return this.formBuilder.group({
      label:data?.value,
      children:this.formBuilder.array([]),
      type:[data?.type ?? ""]

    })
  }

  deductionSubItems(Index:number) : FormArray {
    return this.deduction_items().at(Index).get("children") as FormArray
  }

  newSubItem(data:any): FormGroup {
    return this.formBuilder.group({
      head:[data?.value ?? null],
      label:[data?.value ?? null],
      amount: [data?.amount ?? null,Validators.compose([Validators.min(0)])],
      is_parent:[data?.is_parent ?? false],
      type:[data?.type ?? ""]
    })
  }

  fetch(page:any=1) {
  

    return new Promise(async (resolve, reject) => {
      
     this.spinner.show();
      this.companyuserService.geTDSList({page:page, pagination:true}).subscribe((res: any) => {
        if (res.status == 'success') {
          var docs: any[] = res?.data?.docs ?? [];
          this.tdsData=docs;

          this.paginationOptions = {
            hasNextPage: res.data.hasNextPage,
            hasPrevPage: res.data.hasPrevPage,
            limit: res.data.limit,
            nextPage: res.data.nextPage,
            page: res.data.page,
            pagingCounter: res.data.pagingCounter,
            prevPage: res.data.prevPage,
            totalDocs: res.data.totalDocs,
            totalPages: res.data.totalPages,
          };
        } else {
          this.tdsData = [];
          this.paginationOptions = {
            hasNextPage: false,
            hasPrevPage: false,
            limit: Global.DataTableLength,
            nextPage: null,
            page: 1,
            pagingCounter: 1,
            prevPage: null,
            totalDocs: 0,
            totalPages: 1,
          };

          this.toastr.error(res.message);
        }

        this.spinner.hide();
        resolve(true);
      }, 
      (err) => {
        this.tdsData = [];
        this.paginationOptions = {
          hasNextPage: false,
          hasPrevPage: false,
          limit: Global.DataTableLength,
          nextPage: null,
          page: 1,
          pagingCounter: 1,
          prevPage: null,
          totalDocs: 0,
          totalPages: 1,
        };

        this.spinner.hide();
        this.toastr.error(Global.showServerErrorMessage(err));
        resolve(true);
      });
    });  






  }

  getEdit(item:any,action:any='edit')
  {
    $('#librarymodal').find('[data-dismiss="modal"]').click();

    this.spinner.show();
    if(action=='edit')
    {
      this.editActionId=item;

    }
    this.companyuserService.gettdsTemplate({tds_template_id:item}).subscribe(res => {
      this.spinner.hide();
      if (res.status == 'success') {
      let resp=  res.data;
   
      this.tdsForm.patchValue({
        template_name:resp.template_name,
        define_deductions_rebate:resp.define_deductions_rebate,
        define_deductions_rebate_financial_year:this.yearMaster.find((x)=>x.value==resp.define_deductions_rebate_financial_year),
        define_deductions_rebate_status:resp.define_deductions_rebate_status,
        define_standard_deduction:resp.old_regime.define_standard_deduction,
        standard_deduction_amount:resp.old_regime.standard_deduction_amount,
        define_rebate:resp.old_regime.define_rebate,
        define_p_tax_chapter_vi_deduction_limits:resp.old_regime.define_p_tax_chapter_vi_deduction_limits,
        eligibility_for_rebate_is_taxable_value:resp.old_regime.eligibility_for_rebate_is_taxable_value,
        eligibility_for_rebate_is_taxable_amount:resp.old_regime.eligibility_for_rebate_is_taxable_amount,
        define_hra_deduction_limits:resp.old_regime.define_hra_deduction_limits,
        actual_hra_earned_metro:resp.old_regime.actual_hra_earned_metro,
        actual_hra_earned_non_metro:resp.old_regime.actual_hra_earned_non_metro,
        actual_rent_declared:resp.old_regime.actual_rent_declared,
        define_standard_deduction_new_regime:resp.new_regime.define_standard_deduction_new_regime,
        standard_deduction_amount_new_regime:resp.new_regime.standard_deduction_amount_new_regime,
        define_rebate_new_regime:resp.new_regime.define_rebate_new_regime,
        eligibility_for_rebate_is_taxable_value_new_regime:resp.new_regime.eligibility_for_rebate_is_taxable_value_new_regime,
        eligibility_for_rebate_is_taxable_amount_new_regime:resp.new_regime.eligibility_for_rebate_is_taxable_amount_new_regime, 
  
  
     });
     (this.tdsForm.controls['salary_head_to_earning_head'] as FormArray).clear();

     let control = <FormArray>this.tdsForm.get('salary_head_to_earning_head');


     if(resp?.salary_head_to_earning_head)
     {
      resp?.salary_head_to_earning_head.forEach((elem:any) => {
        control.push(this.initTemplateRows(elem));
      
        });  
     }
    
     this.getTDS(resp?.old_regime?.deduction_items);
    
    Global.scrollToQuery("#lwf-rule-form");



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
  fetchtdsLibrary(page:any=1) {

    return new Promise(async (resolve, reject) => {
      
     this.spinner.show();
      this.companyuserService.geTDSLibrary({page:page}).subscribe((res: any) => {
        if (res.status == 'success') {
          var docs: any[] = res?.data?.docs ?? [];
          this.tdsLibrary=docs;

          this.paginationOptions = {
            hasNextPage: res.data.hasNextPage,
            hasPrevPage: res.data.hasPrevPage,
            limit: res.data.limit,
            nextPage: res.data.nextPage,
            page: res.data.page,
            pagingCounter: res.data.pagingCounter,
            prevPage: res.data.prevPage,
            totalDocs: res.data.totalDocs,
            totalPages: res.data.totalPages,
          };
        } else {
          this.tdsLibrary = [];
          this.paginationOptions = {
            hasNextPage: false,
            hasPrevPage: false,
            limit: Global.DataTableLength,
            nextPage: null,
            page: 1,
            pagingCounter: 1,
            prevPage: null,
            totalDocs: 0,
            totalPages: 1,
          };

          this.toastr.error(res.message);
        }

        this.spinner.hide();
        resolve(true);
      }, 
      (err) => {
        this.tdsData = [];
        this.paginationOptions = {
          hasNextPage: false,
          hasPrevPage: false,
          limit: Global.DataTableLength,
          nextPage: null,
          page: 1,
          pagingCounter: 1,
          prevPage: null,
          totalDocs: 0,
          totalPages: 1,
        };

        this.spinner.hide();
        this.toastr.error(Global.showServerErrorMessage(err));
        resolve(true);
      });
    });  






  }
  openTemplateLibrary()
  {
    $("#librarymmodalbutton").click();
  }
}
