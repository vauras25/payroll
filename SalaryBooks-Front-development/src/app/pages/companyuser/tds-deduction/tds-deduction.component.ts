import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tds-deduction',
  templateUrl: './tds-deduction.component.html',
  styleUrls: ['./tds-deduction.component.css']
})
export class TdsDeduction implements OnInit {
  addEmployeeReimbursementForm: UntypedFormGroup;
  uploadform: UntypedFormGroup;
  uploadedFileName: string = '';
  uploadedFile: File | null = null;
  tableUploadedFileName: string = '';
tableUploadedFile: File | null = null;

  constructor(
    private router: Router,
    private fb: UntypedFormBuilder
  ) { }

  ngOnInit(): void {
    // Initialize the form group with needed controls
    this.addEmployeeReimbursementForm = this.fb.group({
      head_id: ['', Validators.required],
      amount: ['', Validators.required]
    });
    this.uploadform= this.fb.group({

    });
  }

  initEmployeeExpenseAdd() {

    this.addEmployeeReimbursementForm.reset();

    // Clear uploaded file data
    this.uploadedFile = null;
    this.uploadedFileName = '';
    // Optionally patch or set values if needed
    this.addEmployeeReimbursementForm.patchValue({
      // 'emp_id': empDetails?.emp_id
    });

    // Trigger the modal
    $('#addEmployeeExpenseModalButton')?.click();
  }
  upload() {

    this.uploadform.reset();

    // Clear uploaded file data
    this.uploadedFile = null;
    this.uploadedFileName = '';
    // Optionally patch or set values if needed
    this.uploadform.patchValue({
      // 'emp_id': empDetails?.emp_id
    });

    // Trigger the modal
    $('#addEmployeeExpenseModalButton1')?.click();
  }
  viewUploadedPDF(){

  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.uploadedFile = file;
      this.uploadedFileName = file.name;
    } else {
      alert('Please select a valid PDF file.');
    }
  }


  
}
