import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-landing-page',
  template: `
    <main class="main-wrapper">
      <app-header></app-header>
      <router-outlet></router-outlet>
      <app-footer></app-footer>
    </main>
  `,
})
export class LandingPageComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
