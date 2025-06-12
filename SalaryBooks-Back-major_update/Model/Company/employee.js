var db = require("../../db");
var mongoose = require("mongoose");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
Schema = mongoose.Schema;
var employeesSchema = Schema(
  {
    corporate_id: { type: String, required: true },
    created_by: { type: String, required: true },
    //userid      : {type: String, required: true},
    emp_id: { type: String  , },
    emp_first_name: { type: String, required: true },
    emp_last_name: { type: String, required: true },
    emp_father_name: { type: String },
    email_id: { type: String },
    mobile_no: { type: String, required: true },
    alternate_mob_no: { type: String },
    emp_dob: { type: Date, required: true },
    sex: {
      type: String,
      enum: ["m", "f", "o", "t"],
      required: true,
    },
    pan_no: { type: String },
    aadhar_no: { type: String },
    emp_aadhaar_image: { type: String },
    emp_pan_image: { type: String },
    passport_no: { type: String },
    emp_passport_image: { type: String },
    passport_val_form: { type: String },
    passport_val_to: { type: String },
    nationality: { type: String },
    blood_group: { type: String },
    physical_disability: { type: String },
    marital_status: {
      type: String,
      enum: ["unmarried", "married", "divorced", "separated", "widowed"],
      default: "unmarried",
    },
    marriage_date: { type: Date },
    emergency_contact_no: { type: String },
    emergency_contact_name: { type: String },
    domicile: { type: String },
    height: { type: String },
    religion: {
      type: String,
      enum: [
        "hindu",
        "christian",
        "buddhist",
        "muslim",
        "jewish",
        "sikh",
        "no_religion",
      ],
      default: "no_religion",
    },
    additional_id_image: { type: String },
    password: { type: String },
    status: {
      type: String,
      enum: ["active", "approved", "inactive", "pending", "deleted"],
      required: true,
    },
    approval_status: {
      type: String,
      enum: ["approved", "pending", "inactive", "deleted"],
      required: true,
    },
    emp_hod: { type: Schema.Types.ObjectId },
    parent_hods: { type: Schema.Types.Mixed },
    approve_at: { type: Date, default: null },
    profile_pic: { type: String },
    created_at: { type: Date, required: true },
    updated_at: { type: Date, default: Date.now },
    
    country: { type: String },
    aadhar_enrolment: { type: String },
    nominee: { type: String },
    nominee_dob: { type: Date },
    relation_with_nominee: { type: String },
    client_code: { type: Schema.Types.ObjectId },
    shift: {
      shift_id: { type: Schema.Types.Mixed },
      shift_start_date: { type: Date },
      shift_end_date: { type: Date },
    },
    total_file_size: { type: Number },
    shift_rate: { type: Schema.Types.Mixed },
    calculated_leave_balance: Schema.Types.Mixed,
    invitation_id: { type: Schema.Types.ObjectId },
    user_type:String
  },
  { strict: false }
  );

  employeesSchema.index({
    emp_id: 'text',
    emp_first_name: 'text',
    emp_last_name: 'text'
  });

  employeesSchema.plugin(aggregatePaginate);
  let Employee = db.model("employees", employeesSchema);
  // mongoose.set('debug', function (coll, method, query) {
    //   console.log(query);
    //  });
    module.exports = Employee;
