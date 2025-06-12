import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-bonus-report',
  templateUrl: './bonus-report.component.html',
  styleUrls: ['./bonus-report.component.css']
})
export class BonusReportComponent implements OnInit {
  template_fields: any[] = [];

  bonusExportCustomFields: any[] = [
    {
      section: 'Bonus',
      values: [
        { label: 'Sl No', value: '' },
        { label: 'Emp Id', value: '' },
        { label: 'Name', value: '' },
        { label: 'Department', value: '' },
        { label: 'Designation', value: '' },
        { label: 'Client', value: '' },
        { label: 'Branch', value: '' },
        { label: 'No of Days worked in Bonus Period', value: '' },
        { label: 'Master Bonus Wage', value: '' },
        { label: 'Earned Bonus Wage', value: '' },
        { label: 'Bonus Rate', value: '' },
        { label: 'Amount / %', value: '' },
        { label: 'Bonus Amount', value: '' },
        { label: 'TDS', value: '' },
        { label: 'Bonus Payable', value: '' },
        { label: 'EE PF', value: '' },
        { label: 'EE ESI', value: '' },
        { label: 'ER PF', value: '' },
        { label: 'EE ESI', value: '' },
        { label: 'Opening Advance vs Bonus', value: '' },
        { label: 'Amount Remitted ', value: '' },
        { label: 'Bank Name', value: '' },
        { label: 'Account No', value: '' },
        { label: 'IFSC', value: '' },
        { label: 'Payment Mode', value: '' },
        { label: 'Signature', value: '' },

      ],
    },
  ];

  constructor() { }

  ngOnInit() {
  }

  rowSelecion(e: any, name: string) {
    let checkboxes: any = document.getElementsByName(`fields[${name}]`);
    for (const checkbox of checkboxes) {
      checkbox.checked = e.target.checked;
    }
  }

  adjustTemplateFields(field: any[], e: any) {
    let arr = field.map((d) => {
      return d.value;
    });
    if (e.target.checked) {
      this.template_fields.push(...arr);
    } else {
      arr.forEach((element) => {
        let i = this.template_fields.indexOf(element);
        if (i > -1) {
          this.template_fields.splice(i, 1);
        }
      });
    }
  }

  initTemplateCreate() {
    this.cancelTemplateCreate();
    $('#settingsTemplateModalOpen')?.click();
  }

  cancelTemplateCreate() {
    $('#settingsTemplateModal')?.find('[data-dismiss="modal"]')?.click();
    // Global.resetForm(this.templateForm);
    // this.resetSelectedModules();
  }
}
