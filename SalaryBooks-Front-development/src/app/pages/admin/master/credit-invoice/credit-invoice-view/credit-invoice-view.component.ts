import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'credit-invoice-view',
  templateUrl: './credit-invoice-view.component.html',
  styleUrls: ['./credit-invoice-view.component.css']
})
export class CreditInvoiceViewComponent implements OnInit {
  @Input() templateData:any
  constructor() { }

  ngOnInit() {
  }

}
