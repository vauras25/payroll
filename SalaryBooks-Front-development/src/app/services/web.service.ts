import { HttpClient, HttpContext, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as Global from 'src/app/globals';
import { catchError } from 'rxjs/operators'; 

@Injectable({
  providedIn: 'root'
})
export class WebService {
  readonly BASE_URL;
  constructor(
    private http: HttpClient,    
  ) {
    this.BASE_URL = Global.BACKEND_URL;
  }

  get(uri: string) {
    return this.http.get<any>(`${this.BASE_URL}/${uri}`);
  }

  post(uri: string, payload: any) {
    return this.http.post<any>(`${this.BASE_URL}/${uri}`, payload);
  }

  simpleGet(url: string, payload: Object = {}) {
   return this.http.post(`${this.BASE_URL}/${url}`, payload, { responseType: 'blob',observe:'response' });
  }

  postFormData(uri: string, payload: any) {
    var formData = new FormData();
    for (var key in payload) {
      formData.append(key, payload[key]);
    }

    return this.http.post<any>(`${this.BASE_URL}/${uri}`, formData);
  }
  postFormDataNested(uri: string, payload: any) {
    var formData = new FormData();
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

    return this.http.post<any>(`${this.BASE_URL}/${uri}`, formData);
  }
}
