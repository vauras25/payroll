import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class CompanyuserGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) { }

  canActivate(): boolean {
    if (this.authService.companyUserLoggedIn()) {
      return true;
    } else {
      this.router.navigate(['company/login']);
      return false;
    }
  }
}



