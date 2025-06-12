'use strict';

import {
  AbstractControl,
  FormControl,
  UntypedFormArray,
  UntypedFormControl,
  UntypedFormGroup,
  ValidatorFn,
} from '@angular/forms';

// export const BACKEND_URL ='https://mean.updateapplications.com/payroll/payroll_backend';
// export const BASE_HREF = '/payroll/payroll_frontend/';
// export const AppName = 'Vauras Advisory Services';

export const BACKEND_URL = environment.apiUrl;
export const BASE_HREF = environment.BASEHREF;

export const AppName = environment.APPNAME;
export const ASSET_URL = environment.ASSET_URL;

export const DataTableLength = 20;
export const DataTableLengthChangeMenu = [1, 10, 20, 50, 75, 100];
export const UserAuth = '';
export const monthMaster = [
  {
    index: 0,
    value: 1,
    monthLabel: '01',
    description: 'January',
    days: 31,
    sf: 'Jan',
  },
  {
    index: 1,
    value: 2,
    monthLabel: '02',
    description: 'February',
    days: 28,
    sf: 'Feb',
  },
  {
    index: 2,
    value: 3,
    monthLabel: '03',
    description: 'March',
    days: 31,
    sf: 'Mar',
  },
  {
    index: 3,
    value: 4,
    monthLabel: '04',
    description: 'April',
    days: 30,
    sf: 'Apr',
  },
  {
    index: 4,
    value: 5,
    monthLabel: '05',
    description: 'May',
    days: 31,
    sf: 'May',
  },
  {
    index: 5,
    value: 6,
    monthLabel: '06',
    description: 'June',
    days: 30,
    sf: 'Jun',
  },
  {
    index: 6,
    value: 7,
    monthLabel: '07',
    description: 'July',
    days: 31,
    sf: 'Jul',
  },
  {
    index: 7,
    value: 8,
    monthLabel: '08',
    description: 'August',
    days: 31,
    sf: 'Aug',
  },
  {
    index: 8,
    value: 9,
    monthLabel: '09',
    description: 'September',
    days: 30,
    sf: 'Sep',
  },
  {
    index: 9,
    value: 10,
    monthLabel: '10',
    description: 'October',
    days: 31,
    sf: 'Oct',
  },
  {
    index: 10,
    value: 11,
    monthLabel: '11',
    description: 'November',
    days: 30,
    sf: 'Nov',
  },
  {
    index: 11,
    value: 12,
    monthLabel: '12',
    description: 'December',
    days: 31,
    sf: 'Dec',
  },
];
export function getDaysArray(start: any, end: any, mode: any = 'monthly') {
  if (mode == 'monthly') {
    for (
      var arr = [], dt = new Date(start);
      dt <= new Date(end);
      dt.setMonth(dt.getMonth() + 1)
    ) {
      arr.push(new Date(dt));
    }
  } else if (mode == 'daily') {
    for (
      var arr = [], dt = new Date(start);
      dt <= new Date(end);
      dt.setDate(dt.getDate() + 1)
    ) {
      arr.push(new Date(dt));
    }
  }

  return arr;
}
export const weekMaster = [
  { value: 0, name: 'Sunday', prefix: 'Sun', first_letter: 'S' },
  { value: 1, name: 'Monday', prefix: 'Mon', first_letter: 'M' },
  { value: 2, name: 'Tuesday', prefix: 'Tue', first_letter: 'T' },
  { value: 3, name: 'Wednesday', prefix: 'Wed', first_letter: 'W' },
  { value: 4, name: 'Thursday', prefix: 'Thu', first_letter: 'T' },
  { value: 5, name: 'Friday', prefix: 'Fri', first_letter: 'F' },
  { value: 6, name: 'Saturday', prefix: 'Sat', first_letter: 'S' },
];
export const attendance_head = [
  { value: 'PDL', name: 'Paid' },
  { value: 'A', name: 'Absent' },
  { value: 'P', name: 'Present' },
  { value: 'L', name: 'Late' },
  { value: 'H', name: 'Holiday' },
  { value: 'OT', name: 'Over Time' },
  { value: 'CSL', name: 'Casul Leave' },
  { value: 'PVL', name: 'PL' },
  { value: 'ERL', name: 'Earned Leave' },
  { value: 'SKL', name: 'Sick Leave' },
  { value: 'MDL', name: 'Medical Leave' },
  { value: 'MTL', name: 'Maternity Leave' },
  { value: 'PTL', name: 'Paternity Leave' },
  { value: 'ANL', name: 'Annual Leave' },
  { value: 'AWP', name: 'Approved Without Pay' },
  { value: 'UWP', name: 'Unapproved Without Pay' },
  { value: 'LE1', name: 'Leave Earned' },
  { value: 'LE2', name: 'Leave Earned' },
  { value: 'LP1', name: 'Leave Paid' },
  { value: 'LP2', name: 'Leave Paid' },
  { value: 'WO', name: 'Weekly Off' },
];

export const attendanceTypeMaster = [
  { value: 'time', description: 'Time' },
  { value: 'wholeday', description: 'Whole Day' },
  { value: 'halfday', description: 'Half Day' },
  { value: 'monthly', description: 'Monthly' },
];

export const bloodGroupMaster = [
  { value: 'A+', description: 'A+ (A positive)' },
  { value: 'A−', description: 'A− (A negative)' },
  { value: 'B+', description: 'B+ (B positive)' },
  { value: 'B−', description: 'B− (B negative)' },
  { value: 'AB+', description: 'AB+ (AB positive)' },
  { value: 'AB−', description: 'AB− (AB negative)' },
  { value: 'O+', description: 'O+ (O positive)' },
  { value: 'O−', description: 'O− (O negative)' },
];

export const maritalStatusMaster = [
  { value: 'unmarried', description: 'Un-Married' },
  { value: 'married', description: 'Married' },
  { value: 'divorced', description: 'Divorced' },
  { value: 'separated', description: 'Separated' },
  { value: 'widowed', description: 'Widowed' },
];

export const religionMaster = [
  { value: 'hindu', description: 'Hindu' },
  { value: 'christian', description: 'Christian' },
  { value: 'buddhist', description: 'Buddhist' },
  { value: 'muslim', description: 'Muslim' },
  { value: 'jewish', description: 'Jewish' },
  { value: 'sikh', description: 'Sikh' },
  { value: 'no_religion', description: 'No Religion' },
];

export const relationMaster = [
  { value: 'mother', gender: 'F', description: 'Mother' },
  { value: 'father', gender: 'M', description: 'Father' },
  { value: 'daughter', gender: 'F', description: 'Daughter' },
  { value: 'son', gender: 'M', description: 'Son' },
  { value: 'sister', gender: 'F', description: 'Sister' },
  { value: 'brother', gender: 'M', description: 'Brother' },
  { value: 'aunt', gender: 'F', description: 'Aunt' },
  { value: 'uncle', gender: 'M', description: 'Uncle' },
  { value: 'spouse', gender: 'M', description: 'Spouse' },
];

export const RazorpayDoc = {
  key: environment.RAZORPAYKEY,
  company_name: environment.RAZORPAYCOMPANYNAME,
  company_logo: environment.RAZORPAYCOMPANYLOGO,
  currency: environment.RAZORPAYCURRENCY,
  theme: {
    color: '#17A2B8',
  },
};

export function showValidationMessage(result: any[]) {
  for (const key in result) {
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      const element = result[key];
      if (element.message) {
        return element.message;
      }
    }
  }

  return 'Validation Error: Please check all the fields correctly';
}

export function showServerErrorMessage(err: any) {
// console.log(err);
  
  if(err.status == 402){
    return err.error.message + '. ' + 'Payment required!'
  }
  if (err.status == 401) {
    return err.error.message;
  } else {
    return 'Internal server error occured. Please try again later';
  }
}

export function checkModulePermission(
  role: any,
  module: any,
  operation: any,
  sub_module?: any,
  sub_operation?: any,
  user_type?:any
) {
  let permissions: any;
  let output = false;

  switch (role) {
    case 'subadmin':
      permissions = localStorage.getItem('payroll-subadmin-permission');
      permissions = JSON.parse(permissions);

      permissions?.forEach((permission: any) => {
        let chk_module = permission.modules[module];
        if (chk_module) {
          if (Array.isArray(operation)) {
            operation.forEach((oper) => {
              if (chk_module.includes(oper)) {
                output = true;
              }
            });
          } else {
            if (chk_module.includes(operation)) {
              output = true;
            }
          }
        }
      });
      break;

    // case 'companystaff':
    //   permissions = localStorage.getItem('payroll-companyuser-permission');
    //   permissions = JSON.parse(permissions);

    //   permissions?.forEach((permission: any) => {
    //     permission.modules.forEach((m: any) => {
    //       let chk_module = m[module];
    //       if (chk_module) {
    //         if (Array.isArray(operation)) {
    //           operation.forEach((oper) => {
    //             if (chk_module.includes(oper)) {
    //               output = true;
    //             }
    //           });
    //         } else {
    //           if (chk_module.includes(operation)) {
    //             output = true;
    //           }
    //         }
    //       }
    //     });
    //   });
    //   break;

    case 'companyuser':
      permissions = localStorage.getItem('payroll-companyuser-permission');
      permissions = JSON.parse(permissions);
      
      permissions?.forEach((permission: any) => {
        if (
          [
            'gov_bonus_rule',
            'gov_esic_rule',
            'gov_gratuity_rule',
            'gov_pf_rule',
            'gov_ptax_rule',
            'gov_tds_rule',
          ].includes(module)
          
        ) {
          if (Array.isArray(operation)) {
            operation.forEach((oper) => {
              if (
                permission[module]?.rule_apply == 'yes' &&
                permission[module]?.rule_type == oper
              ) {
                output = true;
              }
            });
          } else {
            if (
              permission[module]?.rule_apply == 'yes' &&
              permission[module]?.rule_type == operation
            ) {
              output = true;
            }
          }
        }else if(module == 'government_rules' && sub_module && user_type == 'companystaff'){
          permission.modules[module].forEach((m:any) =>{
            sub_module.forEach((s_module:any)=>{
              let chk_module = m[s_module];
              if (chk_module) {
                if (Array.isArray(sub_operation)) {
                  sub_operation.forEach((oper:any) => {
                    if (chk_module.includes(oper)) {
                      output = true;
                    }
                  });
                } else {
                  if (chk_module.includes(sub_operation)) {
                    output = true;
                  }
                }
              }
            })
            // if(Array.isArray(sub_operation)){
            //   sub_operation.forEach((oper)=>{
            //     if(m[sub_module].includes(oper)){
            //       output = true
            //     }
            //   })
            // }else{
            //   if(m[sub_module].includes(sub_operation)){
            //     output = true
            //   }
            // }
          })
          // if (Array.isArray(operation)) {
          //   operation.forEach((oper) => {
          //     if (
          //       permission[module]?.forEach((mod:any) =>{

          //       }).rule_apply == 'yes' &&
          //       permission[module]?.rule_type == oper
          //     ) {
          //       output = true;
          //     }
          //   });
          // } else {
          //   if (
          //     permission[module]?.rule_apply == 'yes' &&
          //     permission[module]?.rule_type == operation
          //   ) {
          //     output = true;
          //   }
          // }

        } else {
          let chk_module: any;
          let chk_modules: any;
          if (permission.module) {
            chk_module = permission.module[module];
          } else if (permission.modules) {
            chk_modules = permission.modules[module];
          }

          if (chk_modules && user_type == 'companystaff') {
            if (Array.isArray(chk_modules)) {
              chk_modules.forEach((m) => {
                if (sub_module) {
                  if(Array.isArray(sub_module)){
                    sub_module.forEach((s_module:any)=>{
                      let chk_module = m[s_module];
                      if (chk_module) {
                        if (Array.isArray(sub_operation)) {
                          sub_operation.forEach((oper:any) => {
                            if (chk_module.includes(oper)) {
                              output = true;
                            }
                          });
                        } else {
                          if (chk_module.includes(sub_operation)) {
                            output = true;
                          }
                        }
                      }
                    })
                  }else{
                    let chk_module = m[sub_module];
                    if (chk_module) {
                      if (Array.isArray(sub_operation)) {
                        sub_operation.forEach((oper) => {
                          if (chk_module.includes(oper)) {
                            output = true;
                          }
                        });
                      } else {
                        if (chk_module.includes(sub_operation)) {
                          output = true;
                        }
                      }
                    }
                  }
                } else if (Object.keys(m).includes(operation)) {
                  output = true;
                }
              });
            }
          }else if(chk_module && user_type == 'companyuser'){
            if (Array.isArray(operation)) {
              operation.forEach((oper) => {
                if (chk_module.includes(oper)) {
                  output = true;
                }
              });
            } else {
              if (chk_module.includes(operation)) {
                output = true;
              }
            }
          }
        }
      });
      break;

    case 'companyuserpreference':
      let companyuserdetails: any = localStorage.getItem(
        'payroll-companyuser-user'
      );
      if (companyuserdetails) {
        companyuserdetails = JSON.parse(companyuserdetails);
        let preference_settings: any =
          companyuserdetails?.com_det?.preference_settings;
        if (preference_settings) {
          let preference = preference_settings[module];
          if (Array.isArray(operation)) {
            operation.forEach((oper) => {
              if (preference == oper) {
                output = true;
              }
            });
          } else {
            if (preference == operation) {
              output = true;
            }
          }
        } else {
          output = false;
        }
      } else {
        output = false;
      }
      break;

    default:
      return false;
  }

  return output;
}

export function checkCompanyModulePermission({
  company_module = <any>null,
  company_sub_module = <any>null,
  company_operation = <any>null,
  company_sub_operation = <any>null,
  staff_module = <any>null,
  staff_operation = <any>null,
  company_strict = <Boolean>false,
  staff_strict = <Boolean>false,
} = {}) {
  // console.log('s');
  
  let user = localStorage.getItem('payroll-companyuser-user');
  // if (user && JSON.parse(user).user_type == 'staff') {
    if(user && JSON.parse(user).user_type == 'staff'){
      if (staff_strict) {
        return true;
      }
    }
    if(user && JSON.parse(user).user_type == 'company'){
      // if (staff_strict) {
      //   return true;
      // }
      if (company_strict) {
        return true;
      }
    }

  //   return checkModulePermission('companystaff', staff_module, staff_operation);
  // } else {

  return checkModulePermission(
    'companyuser',
    company_module,
    company_operation,
    company_sub_module,
    company_sub_operation,
    JSON.parse(user as any).user_type == 'staff' ? 'companystaff':'companyuser'
  );
  // }
}

export function loadCustomScripts(strict: any = 'none') {
  var loadScripts: any = {
    brackstJsScript: 'assets/js/bracket.js',
    resizeSensorJsScript: 'assets/js/ResizeSensor.js',
    widgetsJsScript: 'assets/js/widgets.js',
    customJsScript: 'assets/js/custom.js',
  };

  if (strict == 'none') {
    for (const [key, value] of Object.entries(loadScripts)) {
      let existImportScript = document.getElementById(key);
      if (existImportScript) {
        existImportScript.remove();
      }

      let val: any = value;

      let importScript = document.createElement('script');
      importScript.setAttribute('src', val);
      importScript.setAttribute('id', key);
      document.head.appendChild(importScript);
    }
  } else {
    const key: any = strict;
    const value: any = loadScripts[strict];

    let existImportScript = document.getElementById(key);
    if (existImportScript) {
      existImportScript.remove();
    }

    let importScript = document.createElement('script');
    importScript.setAttribute('src', value);
    importScript.setAttribute('id', key);
    document.head.appendChild(importScript);
  }
}

export function getGenderMaster() {
  return [
    { value: 'm', description: 'Male' },
    { value: 'f', description: 'Female' },
    { value: 't', description: 'Transgender' },
    { value: 'o', description: 'Other' },
  ];
}

export function getTableSortingOptions(
  returnType: any,
  dataTablesParameters: any
) {
  let value = null;

  try {
    if (dataTablesParameters.order.length > 0) {
      dataTablesParameters.order.forEach((element: any) => {
        switch (returnType) {
          case 'ascdesc':
            value = element?.dir;
            break;

          case 'sortbyfield':
            value = dataTablesParameters?.columns[element?.column]?.name;
            break;

          default:
            value = null;
            break;
        }
      });
    } else {
      value = null;
    }
  } catch (error) {
    value = null;
  }

  return value;
}

export function isValidationAvailable(
  formGroup: UntypedFormGroup,
  control: any,
  rules: any
) {
  const formControl: any = formGroup.get(control);
  if (formControl) {
    const validator =
      formControl.validator && formControl.validator(new UntypedFormControl());
    if (validator && validator[rules]) {
      return true;
    }
  }

  return false;
}

export function isInputValid(formGroup: UntypedFormGroup, control: any) {
  let valid: boolean = true;

  let cntrls = control.split('.');
  let fgroupcontrols: any = formGroup;
  if (cntrls.length > 1) {
    cntrls.forEach((c: any) => {
      fgroupcontrols = fgroupcontrols.controls[c];
    });
  } else {
    fgroupcontrols = fgroupcontrols.controls[control];
  }

  if (
    !['VALID', 'DISABLED'].includes(fgroupcontrols.status) &&
    (fgroupcontrols.touched || fgroupcontrols.dirty)
  ) {
    valid = false;
  }

  return valid;
}

export function isInputRuleValid(
  formGroup: UntypedFormGroup,
  control: any,
  rule: any
) {
  let valid: boolean = true;

  let cntrls = control.split('.');
  let fgroupcontrols: any = formGroup;
  if (cntrls.length > 1) {
    cntrls.forEach((c: any) => {
      fgroupcontrols = fgroupcontrols.controls[c];
    });
  } else {
    fgroupcontrols = fgroupcontrols.controls[control];
  }

  if (rule instanceof Array) {
    rule.forEach((r) => {
      if (
        fgroupcontrols.hasError(r) &&
        (fgroupcontrols.touched || fgroupcontrols.dirty)
      ) {
        valid = false;
      }
    });
  } else {
    if (
      fgroupcontrols.hasError(rule) &&
      (fgroupcontrols.touched || fgroupcontrols.dirty)
    ) {
      valid = false;
    }
  }

  return valid;
}

export function isInputRuleAvailable(
  formGroup: UntypedFormGroup,
  control: any,
  rule: any
) {
  const formControl: any = formGroup.get(control);
  if (formControl) {
    const validator =
      formControl.validator && formControl.validator(new UntypedFormControl());
    if (validator && validator[rule]) {
      return true;
    }
  }

  return false;
}

export function imageViewer(imagepath: any) {
  var modal: any = $('#image-viewer-modal');
  modal.modal();

  $(modal).find('#image-src').attr('src', imagepath);
}

export function scrollToQuery(query: any) {
  let $_errFormControl = document.querySelectorAll(query);
  if ($_errFormControl.length > 0) {
    const firstErr: Element = $_errFormControl[0];
    firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

export function viewRupeeFormat(string: any) {
  return parseFloat(string).toFixed(2);
}

export function checkIfArray(data: any) {
  return Array.isArray(data);
}

export function parseToInteger(string: any) {
  return parseInt(string);
}

export function isCreditAvailable(role: any) {
  let output: Boolean = false;
  switch (role) {
    case 'staff':
    case 'company':
    case 'company_user':
      let userDetails: any = localStorage.getItem('payroll-companyuser-user');
      if (userDetails) {
        userDetails = JSON.parse(userDetails);
        if (parseInt(userDetails.credit_stat) > 0) {
          output = true;
        }
      }
      break;
  }

  return output;
}

export function checkRole(role: any) {
  let output: Boolean = false;
  switch (role) {
    case 'company':
      let userDetails: any = localStorage.getItem('payroll-companyuser-user');
      if (userDetails) {
        userDetails = JSON.parse(userDetails);
        if (userDetails?.user_type == 'company') {
          output = true;
        }
      }
      break;

    case 'company-----ed':
      output = true;
      break;
  }

  return output;
}

export function getCurrentUser() {
  let userDetails: any = localStorage.getItem('payroll-companyuser-user');
  userDetails = JSON.parse(userDetails);

  return userDetails;
}

export function copyToClpboard(text: any) {
  const selBox = document.createElement('textarea');
  selBox.style.position = 'fixed';
  selBox.style.left = '0';
  selBox.style.top = '0';
  selBox.style.opacity = '0';
  selBox.value = text;
  document.body.appendChild(selBox);
  selBox.focus();
  selBox.select();
  document.execCommand('copy');
  document.body.removeChild(selBox);
}

import jsPDF from 'jspdf';
import { environment } from 'src/environments/environment';
const pdfMake = require('pdfmake/build/pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');
pdfMake.vfs = pdfFonts.pdfMake.vfs;
const htmlToPdfmake = require('html-to-pdfmake');

export function generatePdf(htmlContent: any) {
  const doc = new jsPDF();

  var html = htmlToPdfmake(htmlContent);

  const documentDefinition = { content: html };
  pdfMake.createPdf(documentDefinition).open();
}

export function parseFloatVal(number: any) {
  return parseFloat(number);
}

/**
 * ----------------------------------------
 * Form Control Global Functions
 * @param formGroup - Instance of FormGroup
 * ----------------------------------------
 * ----------------------------------------
 */

export function resetForm(
  formGroup: UntypedFormGroup,
  resetFormGroup: boolean = true
) {
  if (resetFormGroup) formGroup.reset();

  for (const key in formGroup.controls) {
    if (Object.prototype.hasOwnProperty.call(formGroup.controls, key)) {
      const element = formGroup.controls[key];

      element.markAsUntouched();
      element.markAsPristine();
    }
  }
}

export function isFormValidationAvailable(
  formGroup: UntypedFormGroup,
  control: any,
  rules: any
) {
  const formControl: any = formGroup.get(control);

  if (formControl) {
    const validator =
      formControl.validator && formControl.validator(new UntypedFormControl());
    if (validator && validator[rules]) {
      return true;
    }
  }

  return false;
}

export function getFormGroupArray(formGroup: UntypedFormGroup, type: any) {
  return (formGroup.get(type) as UntypedFormArray).controls;
}

export function removeFormGroupArrRow(
  formGroup: UntypedFormGroup,
  type: any,
  index: number
) {
  const control = <UntypedFormArray>formGroup.get(type);
  control.removeAt(index);
}

export function resetFormGroupArrRow(formGroup: UntypedFormGroup, type: any) {
  const control = <UntypedFormArray>formGroup.get(type);
  control.clear();
}

export function removeAllStringUnderscrore(str: String) {
  return str.replace(/_/g, ' ');
}

export function getTableSerialNumber(
  index: number,
  TableLength: number,
  currentPage: number
) {
  return currentPage == 1
    ? index + 1
    : TableLength * (currentPage - 1) + (index + 1);
}

export function checkEmptyObject(obj: Object): boolean {
  if (!obj) return true;

  if (
    obj &&
    Object.keys(obj).length === 0 &&
    Object.getPrototypeOf(obj) === Object.prototype
  ) {
    return true;
  }

  return false;
}

export function resetPaginationOption() {
  return {
    hasNextPage: false,
    hasPrevPage: false,
    limit: DataTableLength,
    nextPage: null,
    page: 1,
    pagingCounter: 1,
    prevPage: null,
    totalDocs: 0,
    totalPages: 1,
  };
}

export function resetTableFilterOptions() {
  return {
    length: DataTableLength,
    // length: 1,
    searchkey: '',
  };
}

export function convertNumberToWords(num: any) {
  var a = [
    '',
    'one ',
    'two ',
    'three ',
    'four ',
    'five ',
    'six ',
    'seven ', 
    'eight ',
    'nine ',
    'ten ',
    'eleven ',
    'twelve ',
    'thirteen ',
    'fourteen ',
    'fifteen ',
    'sixteen ',
    'seventeen ',
    'eighteen ',
    'nineteen ',
  ];
  var b = [
    '',
    '',
    'twenty',
    'thirty',
    'forty',
    'fifty',
    'sixty',
    'seventy',
    'eighty',
    'ninety',
  ];

  if ((num = num.toString()).length > 9) return 'overflow';
  let n: any = ('000000000' + num)
    .substr(-9)
    .match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return;
  var str = '';
  str +=
    n[1] != 0
      ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore '
      : '';
  str +=
    n[2] != 0
      ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh '
      : '';
  str +=
    n[3] != 0
      ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand '
      : '';
  str +=
    n[4] != 0
      ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred '
      : '';
  str +=
    n[5] != 0
      ? (str != '' ? 'and ' : '') +
        (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) +
        'only '
      : '';
  return str;
}

export function onFileUploaded(
  formGroup: UntypedFormGroup,
  event: any,
  sourceKey: any,
  type: any = 'single'
) {
  if (event.target.files.length > 0) {
    const file = event.target.files[0];
    formGroup.patchValue({
      [sourceKey]: file,
    });
  } else {
    formGroup.patchValue({
      [sourceKey]: null,
    });
  }
}
export function isEmpty(obj: Record<string, any>) {
  return Object.keys(obj).length === 0;
}
export function getTimeDifference(date1: any, date2: any, absolute = true) {
  let diff = date1 - date2;
  if (absolute == true) {
    diff = Math.abs(diff);
  }

  // get total seconds between the times
  var delta = diff / 1000;

  // console.log(date1 - date2);
  // console.log(Math.abs(date1 - date2));

  // calculate (and subtract) whole days
  var daysDifference = Math.floor(delta / 86400);
  delta -= daysDifference * 86400;

  // calculate (and subtract) whole hours
  var hoursDifference = Math.floor(delta / 3600) % 24;
  delta -= hoursDifference * 3600;

  // calculate (and subtract) whole minutes
  var minutesDifference = Math.floor(delta / 60) % 60;
  delta -= minutesDifference * 60;

  // what's left is seconds
  var secondsDifference = delta % 60; // in theory the modulus is not required

  return {
    daysDifference: daysDifference,
    hoursDifference: hoursDifference,
    minutesDifference: minutesDifference,
    secondsDifference: secondsDifference,
  };
}

export async function documentPrintByElement(element_id: any, css:string = '', isPageBreak:boolean = false) {
  var divContents: any = document.getElementById(element_id)?.innerHTML;
  if (divContents) {
    var a: any = window.open('', '');
    a.document.write(
      `<html><head><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous"></head><body class="m-5">${divContents}</body></html>`
    );
    const head = a.document.head || a.document.getElementsByTagName('head')[0];
    const style = a.document.createElement('style');

    style.type = 'text/css';
    style.media = 'print';

    let pageBreakCss = isPageBreak ?  `
      body > div {
        page-break-before: always;  /* Forces a page break before each div */
        break-before: page;         /* Modern CSS to enforce page break */
      }
      /* Optional: you can remove page breaks on the first div */
      body > div:first-child {
        page-break-before: auto;
        break-before: auto;
      }` : '';

    // Combine custom CSS with the passed-in CSS (if any)
    const finalCss = css + pageBreakCss;
      
    if (style.styleSheet){
      style.styleSheet.cssText = finalCss;
    } else {
      style.appendChild(document.createTextNode(finalCss));
    }
    
    head.appendChild(style);
    
    setTimeout(() => {
      a.print();
    }, 500);
    return a;
  }
}

export function createArrayRange(length: number) {
  return new Array(length).fill(0).map((n, index) => index + 1);
}

export function getMonthValue(index: any) {
  return (
    monthMaster.find((obj) => {
      return obj.index == index;
    }) ?? null
  );
}
export function objtoArray(elem: any) {
  // Array.isArray()
  let arr: any = [];
  Object.keys(elem).forEach(function (key) {
    arr.push({ key: key, value: elem[key] });
  });

  return arr;
}
export function fileSizeValidator(file:any,maxSize: number): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
   
    if (file) {
      const fileSizeInMB = file.size/1024  // Convert to MB
      if (fileSizeInMB > maxSize) {
        return { fileSize: true, maxSize: (maxSize) };
      }
    }
    return null;
  };
}

export function filesSizeValidator(files:any,maxSize: number): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
   
    if (files) {
      
        for(let i in files)
        {
          const fileSizeInMB = files[i].size/1024  // Convert to MB
          if (fileSizeInMB > maxSize) {
            return { fileSize: true, maxSize: (maxSize) };
          }  
        }
       
     
    }
    return null;

  };
}

export function maxFileSize(file_size: any=200) {
let max_size:any=0;  
if(file_size>200)
{
  max_size=200;
}
else{
  max_size=file_size;
}
return max_size;

}

// export function getFrequencymonths(freq:'quarterly' | 'half_yearly' | 'yearly'){
//   let financeYearEndDate = JSON.parse(localStorage.getItem("preference_settings") || '{}')?.financial_year_end
//   if(financeYearEndDate){
//     financeYearEndDate = new Date(financeYearEndDate);
//     const retData = {};
//     switch (freq) {
//       case 'quarterly':
        
//         break;
//       case 'half_yearly':
        
//         break;
//       case 'yearly':
        
//         break;
    
//       default:
//         break;
//     }
//   }
// }

export function getFrequencyMonths(freq: 'quaterly' | 'half_yearly' | 'yearly') {
  let financeYearEndDate = JSON.parse(localStorage.getItem("payroll-companyuser-details") || '{}')?.preference_settings?.financial_year_end;
  if (financeYearEndDate) {
    financeYearEndDate = new Date(financeYearEndDate);
    const endMonthIndex = financeYearEndDate.getMonth(); // Get the month index (0-11)
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    const retData = {
      monthsArray: [] as number[],
      describedData: [] as Array<{
        slot: number,
        fromMonth: {
          name: string,
          index: number
        },
        toMonth: {
          name: string,
          index: number
        }
      }>
    };

    const startMonthIndex = (endMonthIndex + 1) % 12;

    if (freq === 'quaterly') {
      retData.monthsArray = [
        (startMonthIndex + 2) % 12,
        (startMonthIndex + 5) % 12,
        (startMonthIndex + 8) % 12,
        (startMonthIndex + 11) % 12
      ];
      retData.describedData = Array.from({ length: 4 }, (_, i) => ({
        slot: i + 1,
        fromMonth: {
          name: monthNames[(startMonthIndex + i * 3) % 12],
          index: (startMonthIndex + i * 3) % 12
        },
        toMonth: {
          name: monthNames[(startMonthIndex + (i + 1) * 3 - 1) % 12],
          index: (startMonthIndex + (i + 1) * 3 - 1) % 12
        }
      }));
    } else if (freq === 'half_yearly') {
      retData.monthsArray = [
        (startMonthIndex + 5) % 12,
        startMonthIndex - 1
      ];
      retData.describedData = Array.from({ length: 2 }, (_, i) => ({
        slot: i + 1,
        fromMonth: {
          name: monthNames[(startMonthIndex + i * 6) % 12],
          index: (startMonthIndex + i * 6) % 12
        },
        toMonth: {
          name: monthNames[(startMonthIndex + (i + 1) * 6 - 1) % 12],
          index: (startMonthIndex + (i + 1) * 6 - 1) % 12
        }
      }));
    } else if (freq === 'yearly') {
      retData.monthsArray = [startMonthIndex - 1];
      retData.describedData = [
        {
          slot: 1,
          fromMonth: {
            name: monthNames[startMonthIndex],
            index: startMonthIndex
          },
          toMonth: {
            name: monthNames[startMonthIndex - 1],
            index: startMonthIndex
          }
        }
      ];
    }

    return retData;
  }
  return null;
}



