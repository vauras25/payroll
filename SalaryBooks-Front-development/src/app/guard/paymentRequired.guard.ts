import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { WebService } from '../services/web.service';
import { catchError, switchMap } from 'rxjs/operators';
import { map } from 'jquery';

@Injectable({
  providedIn: 'root',
})
export class PaymentRequiredGuard implements CanActivate {
  constructor(private router: Router,private webService:WebService) {}

  canActivate(next:ActivatedRouteSnapshot, state:RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean  {
    let b = this.webService.get('company/is-payment-required').pipe(
      switchMap((apiResponse: any) => {
        if ('paymentRequired' in apiResponse) {
          const isPaymentRequired: boolean = apiResponse.paymentRequired;
          return of(isPaymentRequired); // Returning an array with the boolean value
        } else {
          console.error('Key "isPaymentRequired" not found in API response');
          // Handle the case where the key is not found, possibly return a default value or throw an error
          return of(false); // Default value or appropriate handling
        }
      }),
      catchError((error) => {
        console.error('Error in API request', error);
        // Handle the error as needed, possibly return a default value or throw an error
        return [false]; // Default value or appropriate handling
      }),
      // map((isPaymentRequired: boolean) => isPaymentRequired)
    );
    // console.log(b);
    
    return b
  }
}
