import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './includes/header/header.component';
import { FooterComponent } from './includes/footer/footer.component';
import { HomeComponent } from './home/home.component';
import { MembershipComponent } from './membership/membership.component';
import { AboutUsComponent } from './about-us/about-us.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { TestimonialsComponent } from './testimonials/testimonials.component';
import { LandingPageRoutes } from './landing-page.routing';
import { LandingPageComponent } from './landing-page.component';

@NgModule({
  imports: [
    CommonModule,
    LandingPageRoutes
  ],
  declarations: [
    LandingPageComponent,
    HeaderComponent,
    FooterComponent,
    HomeComponent,
    MembershipComponent,
    AboutUsComponent,
    ContactUsComponent,
    TestimonialsComponent,
  ],
})

export class LandingPageModule {}
