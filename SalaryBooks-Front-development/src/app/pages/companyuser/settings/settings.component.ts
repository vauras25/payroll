import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { AppComponent } from 'src/app/app.component';
import * as Global from 'src/app/globals';

@Component({
  selector: 'companyuser-app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class CMPSettingsComponent implements OnInit {
  Global = Global;

  constructor(
    private titleService: Title,
    private route: ActivatedRoute,
    public AppComponent: AppComponent
  ) {
  }

  ngOnInit(): void {
    this.titleService.setTitle("Company Settings - " + Global.AppName);

    this.route.queryParams.subscribe(
      params => {
        let activesection = params['active'];
        if (activesection) {
          setTimeout(function () {
            Global.scrollToQuery("#heading-comprules")
            $('#heading-' + activesection).find('a[data-toggle="collapse"]').click();
          }, 1000);          
        }
      }
    )
  }


}
