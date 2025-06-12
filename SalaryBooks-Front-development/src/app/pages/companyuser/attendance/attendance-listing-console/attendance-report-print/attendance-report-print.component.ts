import { Location } from '@angular/common';
import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import { NgxSpinnerService } from 'ngx-spinner';
import { AnyARecord } from 'dns';


@Component({
  selector: 'app-attendance-report-print',
  templateUrl: './attendance-report-print.component.html',
  styleUrls: ['./attendance-report-print.component.css']
})
export class CMPAttendanceReportPrintComponent implements OnInit {

  newreport_type:any
  attendance_type:any
  attendanceReportListing:any[] = []
  employeeListFilter:any;
  empReportData:any=[];
  tableFilterOptions:any='';
  current_date:any='';
  zeroPad = (num:any, places:any) => String(num).padStart(places, '0')
  days:any=[];
  start_date:any=''
  end_date:any='';

  payload:any
  constructor(
    private companyuserService: CompanyuserService,
    private location: Location,
    private toastr: ToastrService,
    private activatedRoute: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private router: Router
  ) {
    
  }
  ngOnInit() {
    this.companyuserService.exportedPrintDocs.subscribe((data:any)=>{
    let res = data
    
    if(res!='')
    {
      this.current_date=new Date();
      let wage_month_from:any;
      let wage_year_from:any;
      let wage_month_to:any;
      let wage_year_to:any;

      let detail:any=res;

      if(this.newreport_type=='attendance_register' && (this.attendance_type=='halfday' || this.attendance_type=='wholeday' || this.attendance_type=='time'))
      {
        wage_month_from=this.employeeListFilter?.month?.index;
        wage_year_from=this.employeeListFilter?.year?.value;
        wage_month_to=this.employeeListFilter?.month?.index;
        wage_year_to=this.employeeListFilter?.year?.value;
      }
      else{
         wage_month_from=detail?.wage_month_from;
         wage_year_from=detail?.wage_year_from;
         wage_month_to=detail?.wage_month_to;
         wage_year_to=detail?.wage_year_to;
      }
      
      this.newreport_type=detail?.report_type;
      this.attendance_type=detail?.attendance_type;


      this.employeeListFilter=data.empListFilter;
    // console.log(res, this.employeeListFilter);
      
      this.days=[];
      let start_date=new Date(wage_year_from,wage_month_from,1);
      let monthMaster = Global.monthMaster;
      let no_of_days:any=Global.monthMaster.find(x=>x.index==wage_month_to);
      let last_date=no_of_days?.days;
      let end_date=new Date(wage_year_to,wage_month_to,last_date);
      this.start_date=start_date;
      this.end_date=end_date;

      if(this.newreport_type=='late_summary_report' || this.newreport_type=='month_wise_summary' || this.newreport_type=='summary')
      {
        this.days=Global.getDaysArray(start_date,end_date);

      }
      else if((this.newreport_type=='attendance_register' && 
      (this.attendance_type=='halfday' || this.attendance_type=='wholeday' || this.attendance_type=='time')))
      {
        this.days=Global.getDaysArray(start_date,end_date,'daily');

      }
      else{
        if(this.employeeListFilter?.report_type=='form_d'){
          for (let i=1; i<=this.employeeListFilter.month.days;i++) {
            this.days.push(i);
            }
        }else{

          for (let i=1; i<=detail?.month?.days;i++) {
            this.days.push(i);
            }
        }

        
      }
      
      let payload: any =detail;
      payload.pageno=1;
      payload.perpage=20;
      
      this.spinner.show();
      
      this.payload = payload
      this.companyuserService.printattendReport(payload).subscribe(res => {
          if (res.status == 'success') {
              this.empReportData = [];
              let master_data = res?.employees ?? [];
              master_data.forEach((element: any,index:any) => {
              let attendance:any  ;
              let summary_days=0;
              let summary_present=0;
              let summary_paydays=0;
              let summary_wo=0;
              let summary_ho=0;
              let summary_skl=0;
              let summary_pvl=0;
              let summary_erl=0;
              let summary_ot=0;
              let summary_lop=0;
              let total_working_hours=0;
              let total_attendance=0;
              let total_absent=0;
              let total_pl=0;
              let total_wo=0;
              let total_late=0;
              if(this.newreport_type=='late_summary_report' || this.newreport_type=='month_wise_summary' || this.newreport_type=='summary')
              {
                attendance=element.attendance_summ;
              }
              else{
                attendance=element.attendance;

              }
              let row_total_late=0;
              this.days.forEach((x:any)=>{
                if(this.newreport_type=='late_summary_report')
                {
                  let d=x;
                  let item=  attendance.find((newItem:any)=>(newItem.attendance_month==d.getMonth().toString() && newItem.attendance_year==d.getFullYear().toString()));
  
                  let del_index=attendance.findIndex((item:any)=>(item.attendance_month==d.getMonth().toString() && item.attendance_year==d.getFullYear().toString()));
  
                  let month_data=Global.monthMaster.find(x=>x.index==d.getMonth());
                 if(item==undefined)
                  {
                   master_data[index]?.attendance_summ.push({total_late_hour:'N/A',total_instances:'N/A'});
                  }
                  else{
                   master_data[index].attendance_summ?.splice(del_index, 1);
                   item.total_instances='N/A';
                   item.total_late_hour=item.total_late_hour?(item.total_late_hour/60) : 0;
                   row_total_late+=item.total_late_hour;
                   master_data[index].attendance_summ.push(item);
                  } 
                }
                else if(this.newreport_type=='month_wise_summary' || this.newreport_type=='summary')
                {
                   let d=x;
                   let item=  attendance.find((item:any)=>(item.attendance_month==d.getMonth() && item.attendance_year==d.getFullYear()));
                   let del_index=attendance.findIndex((item:any)=>(item.attendance_month==d.getMonth() && item.attendance_year==d.getFullYear()));
                   let month_data=Global.monthMaster.find(x=>x.index===d.getMonth());
                  if(item==undefined)
                   {
                    master_data[index]?.attendance_summ.push(
                    {total_days:month_data?.days,total_present:'N/A',paydays:'N/A',total_wo:'N/A',holiday:'N/A',total_SKL:'N/A',total_PVL:'N/A'
                    ,total_ERL:'N/A', total_overtime:'N/A',total_lop:'N/A'
                    }

                    );
                   }
                   else{
                    master_data[index].attendance_summ?.splice(del_index, 1);
                    item.total_days=month_data?.days;
                    master_data[index].attendance_summ.push(item);

                    summary_days+=parseFloat(item.total_days);

                    summary_present+=item.total_present?parseFloat(item.total_present):0

                    summary_paydays+=item.paydays?parseFloat(item.paydays):0

                    summary_wo+=item.total_wo?parseFloat(item.total_wo):0

                    summary_ho+=item.holiday?parseFloat(item.holiday):0

                    summary_skl+=item.total_SKL?parseFloat(item.total_SKL):0

                    summary_pvl+=item.total_PVL?parseFloat(item.total_PVL):0

                    summary_erl+=item.total_ERL?parseFloat(item.total_ERL):0

                    summary_ot+=item.total_overtime?parseFloat(item.total_overtime):0

                    summary_lop+=item.total_lop?parseFloat(item.total_lop):0


                   }
                }
                else if(this.newreport_type=='attendance_register' && (this.attendance_type=='halfday' || this.attendance_type=='wholeday'))
                {
                  let new_date=x.getFullYear()+'-'+this.zeroPad((x.getMonth()+1),2)+'-'+this.zeroPad(x.getDate(),2);
                  let item=  attendance.find((newItem:any)=>newItem.attendance_date==new_date);
                  let del_index=attendance.findIndex((item:any)=>item.attendance_date==new_date);

                  if(item==undefined)
                   {

                    master_data[index]?.attendance.push({first_half:'N/A',second_half:'N/A'});
                   }
                   else{
                    master_data[index].attendance?.splice(del_index, 1);
                    item.first_half=item.first_half??'N/A';
                    item.second_half=item.second_half??'N/A';

                    master_data[index].attendance.push(item);
                    total_attendance+=item?.monthly_attendance?.total_attendance?parseInt(item?.monthly_attendance?.total_attendance):0;
                    total_absent+=item?.monthly_attendance?.total_absent?parseInt(item?.monthly_attendance?.total_absent):0;
                    total_pl+=item?.monthly_attendance?.total_pl?parseInt(item?.monthly_attendance?.total_pl):0;
                    total_wo+=item?.monthly_attendance?.total_wo?parseInt(item?.monthly_attendance?.total_wo):0;
                    total_late+=item?.monthly_attendance?.total_late?parseInt(item?.monthly_attendance?.total_late):0;

                   }
                }
                else if(this.newreport_type=='attendance_register' &&  this.attendance_type=='time')
                {
                  let new_date=x.getFullYear()+'-'+this.zeroPad((x.getMonth()+1),2)+'-'+this.zeroPad(x.getDate(),2);
                  let item=  attendance.find((newItem:any)=>newItem.attendance_date==new_date);
                  let del_index=attendance.findIndex((item:any)=>item.attendance_date==new_date);
                  if(item==undefined)
                   {

                    master_data[index]?.attendance.push({login_time:'N/A',logout_time:'N/A'});
                   }
                   else{
                    master_data[index].attendance?.splice(del_index, 1);
                    master_data[index].attendance.push(item);
                    total_working_hours+=item?.total_logged_in?parseFloat(item?.total_logged_in):0;

                   }
                }



                else{
                  let new_date=this.employeeListFilter?.year?.value+'-'+this.zeroPad(this.employeeListFilter?.month?.value, 2)+'-'+this.zeroPad(x, 2);
                  let item=  attendance.find((item:any)=>item.attendance_date==new_date);
                  let del_index=attendance.findIndex((item:any)=>item.attendance_date==new_date);
                  if(item==undefined)
                  {
                    master_data[index]?.attendance.push({attendance_stat:'N/A'});
                  }
                  else{
                    master_data[index].attendance?.splice(del_index, 1);
                    master_data[index].attendance.push(item);
      
                  }
                }
                if(this.newreport_type=='late_summary_report')
                { 
                  master_data[index].rowTotal=row_total_late;

                }
              
                
              
              })
              if(this.newreport_type=='month_wise_summary' || this.newreport_type=='summary')
              { 
                master_data[index].summary_days=summary_days;
                master_data[index].summary_present=summary_present;
                master_data[index].summary_paydays=summary_paydays;
                master_data[index].summary_wo=summary_wo;
                master_data[index].summary_ho=summary_ho;
                master_data[index].summary_skl=summary_skl;
                master_data[index].summary_pvl=summary_pvl;
                master_data[index].summary_erl=summary_erl;
                master_data[index].summary_ot=summary_ot;
                master_data[index].summary_lop=summary_lop;

              }
              else if(this.newreport_type=='attendance_register' && this.attendance_type=='halfday')
              {
                  master_data[index].total_attendance=total_attendance;
                  master_data[index].total_absent=total_absent;
                  master_data[index].total_pl=total_pl;
                  master_data[index].total_wo=total_wo;
                  master_data[index].total_late=total_late;

              }
              else if(this.newreport_type=='attendance_register' &&  this.attendance_type=='time')
              {
                master_data[index].attendance_summ[0].total_overtime=element?.attendance_summ[0].total_overtime?(element.attendance_summ[0].total_overtime/60):0;
                master_data[index].attendance_summ[0].total_working_hours=total_working_hours;
              }
                  
              });
  
              this.empReportData=master_data;
             
          } else {
              this.empReportData = [];
          }
  
          this.spinner.hide();
          Global.loadCustomScripts('customJsScript');
          
      }, (err) => {
          this.empReportData = [];
          this.spinner.hide();
          Global.loadCustomScripts('customJsScript');
      });
    }  
    else{
      this.router.navigate([
        `/company/attendance-management/attendance-listing-console`,
      ]);

    }
  
    })
    

  }
  
   async printDoc(elements:any) {
    try {
      // if (this.empReportData !== 'null') {
        //   window.close();
        // } else {
          //   this.location.back();
          // }
          await this.companyuserService.downloadFile('export-attendance-report-data',this.payload.report_type + '-attendance-report', this.payload)
          // this.location.back()

      // window.print();
    } catch (err:any) {
      this.toastr.error(err.mesage)
    }
    // console.log(elements.target);

  }

  closeWindow() {
    if (this.empReportData !== 'null') {
      window.close();
    } else {
      this.location.back();
    }
  }
  

  getMonthDescription(month:any){
   return Global.monthMaster.find(m => m.index == +month)?.description
  }

}
