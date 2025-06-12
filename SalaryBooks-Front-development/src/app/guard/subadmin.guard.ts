import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class SubadminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) { }

  canActivate(): boolean {
    if (this.authService.subAdminLoggedIn()) {
      return true;
    } else {
      this.router.navigate(['sub-admin/login']);
      return false;
    }
  }
}


