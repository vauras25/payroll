import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import * as Global from 'src/app/globals';
import { WebService } from './web.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import * as saveAs from 'file-saver';
@Injectable({
  providedIn: 'root',
})
export class CommonService {
  constructor(private http: HttpClient,
    private webService: WebService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    ) {}

  postData(url: any, body: any): Observable<any> {
    const webservice_path = Global.BACKEND_URL;
    let form_data = new FormData();

    for (var key in body) {
      form_data.append(key, body[key]);
    }

    return this.http.post(webservice_path + '/' + url, form_data);
  }

  postDataRaw(url: any, body: any): Observable<any> {
    // console.log(body);

    const webservice_path = Global.BACKEND_URL;

    return this.http.post(webservice_path + '/' + url, body);
  }
  async postDataRawAsync(url: any, body: any): Promise<any> {
    const webservice_path = Global.BACKEND_URL;
    return await this.http.post(webservice_path + '/' + url, body).toPromise();
  }
  postFormDataNested(url: string, payload: any) {
    var formData = new FormData();
    const webservice_path = Global.BACKEND_URL;
    for (var key in payload) {
     
      if(key == 'eighty_c_investments') {
        let i=0;
        let rawElemt=payload[key];
        payload[key]=payload[key].filter((x:any) =>x.children.length>0)
        for(let index in  payload[key])
        {
          let p_head=rawElemt.find((x:any) => x.name==payload[key][index].parent_id)
          formData.append(`declaration_p_head[${index}]`,p_head?.label);
          formData.append(`declaration_items[${index}]`,payload[key][index].label);
          formData.append(`declaration_key[${index}]`,payload[key][index].name);
          payload[key][index].children.forEach((element:any,SubIndex:any) => {
          formData.append(`declaration_sub_label[${index}][${SubIndex}]`,element.label);
          formData.append(`declaration_sub_amount[${index}][${SubIndex}]`,element.amount ?? 0);
          if(element.document_file!=null)
          {
            element.document_file?.forEach((subElement:any,subsubIndex:number) =>{
              formData.append(`declaration_sub_document[${index}][${SubIndex}][${subsubIndex}]`,subElement);  
            });
          }  

          if(element.pre_sub_declaration_document!=null)
          {
            element.pre_sub_declaration_document?.forEach((subElement:any,subsubIndex:number) =>{
              formData.append(`pre_sub_declaration_document[${index}][${SubIndex}][${subsubIndex}]`,subElement.file);  
            });
          }  
          
          });
         
        } 
      }
     
      else if(key == 'rantal_house_documents') {

        for (let i in payload[key])
      {
        formData.append(`rantal_house_documents[${i}]`,payload[key][i]);

      }

      }

      else if(key == 'other_income_document') {
      for (let i in payload[key])
      {
        formData.append(`other_income_document[${i}]`,payload[key][i]);

      }

      }


     else{
      formData.append(key, payload[key]);

     }

    }

    return this.http.post(webservice_path + '/' + url, formData);
  }


  async downloadFile(url:string,fileName:string, payload?:Object) {
    try {
      // this.spinner.show()
      await this.webService.simpleGet('employee/' + url, payload).toPromise().then((response:HttpResponse<any>)=>{
      // console.log(response.headers.keys());
        
        if(response.status !== 200 || response.body.type == 'application/json'){
          throw {message:'Internal server error occured. Please try again later'};
        }
        saveAs(response.body, fileName);
        this.spinner.hide()
      },(err) =>{
        throw err
      });
    } catch (err:any) {
      // this.spinner.hide()
      this.toastr.error(err.message)
      throw err 
    }

  }
}
