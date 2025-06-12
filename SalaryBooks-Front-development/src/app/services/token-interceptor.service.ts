import { HttpInterceptor } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { finalize } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';

@Injectable({
  providedIn: 'root'
})
export class TokenInterceptorService implements HttpInterceptor {

  constructor(private injector: Injector,private spinner:NgxSpinnerService) { }

  intercept(request: any, next: any): Observable<any> {
    let authService = this.injector.get(AuthService);
    let tokenizedReq = request.clone({
      setHeaders: {
        'x-access-token': `${authService.getToken()}`
      }
    })
// 41
    // this.spinner.show()
    return next.handle(tokenizedReq).pipe(finalize(() => {
      // this.spinner.hide()
    }))
  }
}
