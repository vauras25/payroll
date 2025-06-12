import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http'
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { SelectDropDownModule } from 'ngx-select-dropdown'
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner'
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GuestGuard } from './guard/guest.guard';
import { TokenInterceptorService } from './services/token-interceptor.service';
import { NotfoundPageComponent } from './pages/notfound-page/notfound-page.component';
import { AdminLoginPageComponent } from './pages/auth/admin-login-page/admin-login-page.component';
import { AdminGuard } from './guard/admin.guard';
import { APP_BASE_HREF, DatePipe,DecimalPipe } from '@angular/common';
import { HomePageComponent } from './pages/frontend/home-page/home-page.component';
import { SubadminLoginPageComponent } from './pages/auth/subadmin-login-page/subadmin-login-page.component';
import { SubadminComponent } from './pages/layouts/subadmin/subadmin.component';
import { CompanyuserLoginPageComponent } from './pages/auth/companyuser-login-page/companyuser-login-page.component';
import { CompanyuserComponent } from './pages/layouts/companyuser/companyuser.component';
import { InvitationFormComponent } from './pages/Public/invitation-from/invitation-form.component';
import { environment } from 'src/environments/environment';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { HomeEditComponent } from './pages/companyuser/home-edit/home-edit.component';
import { ForgotComponent } from './pages/employees/forgot-password/forgot.component';

@NgModule({
  declarations: [
    ForgotComponent,
    AppComponent,
    NotfoundPageComponent,
    AdminLoginPageComponent,
    HomePageComponent,
    SubadminLoginPageComponent,
    SubadminComponent,
    CompanyuserLoginPageComponent,
    CompanyuserComponent,
    InvitationFormComponent,
  ],
  imports: [
    DragDropModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
    SelectDropDownModule,
    NgxSpinnerModule,
    // AgmCoreModule.forRoot({
    //   apiKey:"AIzaSyDQPeschmy5KhSCwLF2Ozg4do1otBL8tOk"
    // })
  ],
  exports:[
    
  ],
  providers: [
    AdminGuard,
    GuestGuard,
    DatePipe,
    DecimalPipe,
    NgxSpinnerService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptorService,
      multi: true
    },
    // {provide: APP_BASE_HREF, useValue: "/payroll/payroll_frontend" }

  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
