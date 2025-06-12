import { Injectable } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Location } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})

export class EmpuserGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private location: ActivatedRoute,
    private toastr: ToastrService,
  ) { }
  
  canActivate(route: ActivatedRouteSnapshot): boolean {
    let url:any;
    
    if (this.authService.empLoggedIn()) {
      url=route.data.currentUrl;
      let permission=this.authService.getempPermission();

      if(url)
      {
        
        if(permission)
        {
          if(url=='profile')
          {
            if(!permission?.rights?.me)
            {
              this.router.navigate(['employee/login']);
              this.toastr.error("You Don't have permission.");
              return false;
            }
          }
          else if(url=='attendance')
          {
            if(!permission?.rights?.attendance)
            {
              this.router.navigate(['employee/login']);
              this.toastr.error("You Don't have permission.");
              return false;
            }
          }
          else if(url=='apply')
          {
            if(permission?.rights?.apply?.length<=0)
            {
              this.router.navigate(['employee/login']);
              this.toastr.error("You Don't have permission.");
              return false;
            }
          }
          else if(url=='view')
          {
            if(permission?.rights?.view?.length<=0)
            {
              this.router.navigate(['employee/login']);
              this.toastr.error("You Don't have permission.");

              return false;
            }
          }

        }
       
      }
      return true;
    } else {
      this.router.navigate(['employee/login']);
      return false;
    }
  }
  
}
