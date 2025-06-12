var db = require('../../db');
var mongoose = require('mongoose');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');
Schema = mongoose.Schema;
var companyDetailsSchema = Schema({
    company_id    : {type: Schema.Types.ObjectId, required: true, ref: "companies"},
    details:
    {
        establishment_name    : {type: String, required: true},
        corporate_id    : {type: String, required: true},
        establishment_type    : {type: String,enum: ['individual','proprietorship','partnership','pvt_ltd','ltd','llp','trust','other']},
        establishment_reg_certificate    : {type: String},
    },
    attendence_register: {
        register_type    : {
            type: String, 
            enum: ['daily', 'monthly','hourly'],
            required: true
        },
        daily_type    : {
            type: String, 
            enum: ['wholeday', 'halfday','timebasis'],
        },
    },
     
    establishment:{
            nature_of_business    : {type: String, default : null},
            date_of_incorporation    : {type: String, default : null},
            trade_licence_no    : {type: String, default : null},
            trade_Licence_doc    : {type: String},
            gst_no    : {type: String},
            gst_doc    : {type: String},
            pan_numberc    : {type: String},
            pan_numberc_doc    : {type: String},
            tan_number    : {type: String},
            tan_number_doc    : {type: String},
            website    : {type: String},
            mobile_no    : {type: String},
            land_line    : {type: String},
            email_id    : {type: String},
            alternate_email_id    : {type: String},
    },
    partners:[{
        first_name    : {type: String},
        last_name    : {type: String},
        designation    : {type: String},
        din_no    : {type: String},
        date_of_appointment    : {type: Date},
        mobile_no    : {type: String},
        pan_no    : {type: String},
        aadhaar_no    : {type: String},
        partners_pan_doc    : {type: String},
        partners_aadhaar_no    : {type: String},
    }],
    reg_office_address:{
            door_no    : {type: String},
            street_name    : {type: String},
            locality    : {type: String},
            district_name    : {type: String},
            state    : {type: String},
            pin_code    : {type: String},
            state_code    : {type: String},
            
    },
    communication_office_address:{
            door_no    : {type: String},
            street_name    : {type: String},
            locality    : {type: String},
            district_name    : {type: String},
            state    : {type: String},
            pin_code    : {type: String},
    },
    epf:{
            registration_no    : {type: String},
            group_no    : {type: String},
            pf_rule_apply:{
                type: String, 
                enum: ['yes', 'no']
            },
            pf_rule    : {type: String},
            pf_certificate    : {type: String},
            lin_no    : {type: String},
            note_box    : {type: String},
            regional_office_address    : {type: String},
    },
    esic:{
            registration_no    : {type: String},
            regional_pf_office    : {type: String},
            lin_no    : {type: String},
            esic_certificate    : {type: String},
            note_box    : {type: String},
    },
    professional_tax:{
            registration_no_enrolment    : {type: String},
            registration_no_rgistration    : {type: String},
            registration_no_enrolment_certificate    : {type: String},
            registration_no_rgistration_certificate    : {type: String},
            note_box    : {type: String},
    },
    company_branch:[
        {
            branch_name    : {type: String, required: true},
            branch_contact_person    : {type: String},
            contact_person_number    : {type: String},
            contact_person_email    : {type: String},
            branch_EPFO_number    : {type: String},
            branch_EPFO_number_doc    : {type: String},
            branch_ESIC_number    : {type: String},
            branch_ESIC_number_doc    : {type: String},
            branch_P_Tax_number    : {type: String},
            branch_P_Tax_number_doc    : {type: String},
            branch_address    : {type: String},
            lwf_shop    : {type: String},
            establishment_labour_license    : {type: String},
            state    : {type: String},
            state_code    : {type: String},
            status:{
                type: String, 
                enum: ['active', 'inactive'],
                required: true
            }
        }
    ],
    preference_settings:{
        epfo_rule    : {type: String,enum: ['custom', 'default']},
        esic_rule    : {type: String,enum: ['custom', 'default']},
        gratuity_rule    : {type: String,enum: ['custom', 'default']},
        bonus_rule    : {type: String,enum: ['custom', 'default']},
        financial_year_end    : {type: Date},
        quater: { type: Schema.Types.Mixed },
    },
    status:{
        type: String, 
        enum: ['active', 'inactive'],
        required: true
    },
    created_at:{ type: Date ,required: true },
    updated_at:{ type: Date, default: Date.now() },
  }, {strict: false});
  companyDetailsSchema.plugin(aggregatePaginate);
var CompanyDetails = db.model('company_details',companyDetailsSchema);
module.exports = CompanyDetails;