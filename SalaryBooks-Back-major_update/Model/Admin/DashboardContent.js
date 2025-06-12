
const mongoose = require('mongoose');

const dashboardContentSchema = new mongoose.Schema({
  corporate_id    : {type: String, required: true},
  content_visible: {
    type: Boolean,
    // required: true,
  },
  content_credit: {
    type: Boolean,
    // required: true,
  },
  datarange: {
    type: Boolean,
  },
  dashboard_sections: { type: Array },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('DashboardContent', dashboardContentSchema);
