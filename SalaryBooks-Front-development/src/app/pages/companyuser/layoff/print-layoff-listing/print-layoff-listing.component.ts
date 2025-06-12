import { Location } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';


@Component({
  selector: 'app-print-layoff-listing',
  templateUrl: './print-layoff-listing.component.html',
  styleUrls: ['./print-layoff-listing.component.css']
})
export class CMPPrintLayoffListingComponent implements OnInit {

  layoffListType:any = '';
  isEditAble:any;
  layoffListing:any;

  constructor(
    private companyuserService: CompanyuserService,
    private location: Location
  ) {

    this.companyuserService.exportedPrintDocs.subscribe((d) => {
      // console.log(d);

      this.layoffListType = d.layoffListType
      this.layoffListing = d.layoffListing.docs
    });
  }

  async ngOnInit() {}

  // printDoc(elements:any) {
  //   window.print();
  //   this.location.back();
  // }

  closeWindow() {
    this.location.back();
  }

  utilizeMonth(m: any) {
    return Global.monthMaster.find((d) => d.index == m)?.sf;
  }

}
