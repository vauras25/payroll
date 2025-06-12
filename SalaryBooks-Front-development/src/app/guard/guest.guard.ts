import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) { }

  canActivate(): boolean {
    if (this.authService.adminLoggedIn()) {
      this.router.navigate(['/admin']);
      return false;
    } else if (this.authService.subAdminLoggedIn()) {
      this.router.navigate(['/sub-admin']);
      return false;
    } else if (this.authService.companyUserLoggedIn()) {
      this.router.navigate(['/company']);
      return false;
    }else if(this.authService.empLoggedIn()) {
      this.router.navigate(['/employee'])
      return false
    } else {
      return true;
    }
  }
}
