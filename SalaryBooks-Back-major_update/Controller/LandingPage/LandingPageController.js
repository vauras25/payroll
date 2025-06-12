var PublicPage = require("../../Model/Admin/PublicPage");
var PublicPost = require("../../Model/Admin/PublicPost");
var PublicSetting = require("../../Model/Admin/PublicSetting");
var MembershipPlan = require("../../Model/Admin/MembershipPlan");

const { Validator } = require("node-input-validator");
var multer = require("multer");
var fs = require("fs");

var storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "../../storage/company/landing_page");
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + "-" + Date.now());
  },
});

const getOptionsPayload = (req) => {
  try {
    let options = {};
    var sortbyfield = req.body.sortbyfield;
    if (sortbyfield) {
      var sortoption = {};
      sortoption[sortbyfield] = req.body.ascdesc == "asc" ? 1 : -1;
    } else {
      var sortoption = { created_at: -1 };
    }

    options.page = parseInt(req.body.pageno || 1);
    options.limit = req.body.perpage ? parseInt(req.body.perpage) : perpage;
    options.sort = sortoption;

    return options;
  } catch (err) {
    return err;
  }
};

module.exports = {
  create_public_page: async (req, resp) => {
    try {
      const v = new Validator(req.body, {
        page_title: "required",
        page_slug: "required",
      });
      if (!(await v.check()))
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      let document = {
        page_title: req.body.page_title,
        page_slug: req.body.page_slug,
        page_content: req.body.page_content,
      };

      multer({ storage }).single("page_img")(req, resp, (err) => {
        if (!err) {
          if (req.files.length > 0) {
            document.page_img = req.files[0].path;
          }
          PublicPage.create(document, (err, doc) => {
            if (err){
              return resp.status(200).json({
                status: "error",
                message: err,
              });
            }
            return resp.status(200).send({
              status: "success",
              message: "Page has been created successfully",
              page_data: doc,
            });
          });
        }
      });
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  update_public_page: async (req, resp) => {
    try {
      const v = new Validator(req.body, {
        page_id: "required",
        page_title: "required",
      });
      if (!(await v.check()))
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      let { page_id } = req.body;
      let document = {
        page_title: req.body.page_title,
        page_content: req.body.page_content,
        status: req.body.status,
      };

      multer({ storage }).single("page_img")(req, resp, async (err) => {
        if (!err) {
          if (req.files.length > 0) {
            document.page_img = req.files[0].path;
            await PublicPage.findById(page_id, "page_img", (err, res) => {
              if (err){
                return resp.status(200).json({
                  status: "error",
                  message: err,
                });
              }

              let filePath = file_path + "/" + res._doc.page_img;
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            });
          }
          await PublicPage.updateOne({ _id: page_id }, document, (err, doc) => {
            if (err){
              return resp.status(200).json({
                status: "error",
                message: err,
              });
            }
            return resp.status(200).send({
              status: "success",
              message: "Page Updated successfully",
              page_data: doc,
            });
          });
        }
      });
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  generate_page_slug: async (req, resp) => {
    try {
      const v = new Validator(req.body, {
        page_slug: "required",
      });
      if (!(await v.check()))
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      let isExist = await PublicPage.findOne({
        page_slug: req.body.page_slug,
      });
      let index = 0;

      if (isExist !== null) {
        do {
          index++;
          let page_slug = req.body.page_slug + "_" + index;
          isExist = await PublicPage.findOne({ page_slug });
        } while (isExist !== null);
      }
      return resp.status(200).send({
        status: "success",
        message: "Page slug generated successfully",
        page_slug: req.body.page_slug + (index ? "_" + index : ""),
      });
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  create_public_post: async (req, resp) => {
    try {
      const v = new Validator(req.body, {
        title: "required",
        category: "required",
      });
      if (!(await v.check()))
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      let document = {
        title: req.body.title,
        category: req.body.category.toLowerCase(),
        content: req.body.content,
      };

      multer({ storage }).single("post_img")(req, resp, (err) => {
        if (!err) {
          if (req.files.length > 0) {
            document.post_img = req.files[0].path;
          }
          PublicPost.create(document, (err, doc) => {
            if (err){
              return resp.status(200).json({
                status: "error",
                message: err,
              });
            }
            return resp.status(200).send({
              status: "success",
              message: "Post has been created successfully",
              post_data: doc,
            });
          });
        }
      });
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  update_public_post: async (req, resp) => {
    try {
      const v = new Validator(req.body, {
        post_id: "required",
        title: "required",
        category: "required",
      });
      if (!(await v.check()))
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      let { post_id } = req.body;
      let document = {
        title: req.body.title,
        category: req.body.category,
        content: req.body.content,
        status: req.body.status,
      };

      multer({ storage }).single("post_img")(req, resp, async (err) => {
        if (!err) {
          if (req.files.length > 0) {
            document.post_img = req.files[0].path;
            await PublicPost.findById(post_id, "post_img", (err, res) => {
              if (err){
                return resp.status(200).json({
                  status: "error",
                  message: err,
                });
              }

              let filePath = file_path + "/" + res._doc.post_img;
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            });
          }
          await PublicPost.updateOne({ _id: post_id }, document, (err, doc) => {
            if (err){
              return resp.status(200).json({
                status: "error",
                message: err,
              });
            }
            return resp.status(200).send({
              status: "success",
              message: "Post Updated successfully",
              page_data: doc,
            });
          });
        }
      });
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  get_public_pages: async (req, resp) => {
    try {
      let filters = {};
      let options = await getOptionsPayload(req);
      if (req.body.page_slug) filters.page_slug = req.body.page_slug;
      if (req.body.status) filters.status = req.body.status;

      PublicPage.find(filters, (err, docs) => {
        if (err)
          return resp.status(200).json({
            status: "error",
            message: err,
          });
        return resp.status(200).send({
          status: "success",
          docs,
        });
      })
        .limit(options.limit)
        .skip((options.page - 1) * options.limit)
        .sort(options.sort);
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  get_public_posts: async (req, resp) => {
    try {
      let filters = {};
      let options = await getOptionsPayload(req);
      if (req.body.category) filters.category = req.body.category;

      PublicPost.find(filters, (err, docs) => {
        if (err)
          return resp.status(200).json({
            status: "error",
            message: err,
          });
        return resp.status(200).send({
          status: "success",
          docs,
        });
      })
        .limit(options.limit)
        .skip((options.page - 1) * options.limit)
        .sort(options.sort);
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  update_settings: async (req, resp) => {
    try {
      const v = new Validator(req.body, {
        title: "required",
      });
      if (!(await v.check()))
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });

      let document = {
        title: req.body.title,
        description: req.body.description,
      };

      if (req.body.social_links) {
        let social_links = JSON.parse(req.body.social_links);

        if (social_links.length) {
          document.social_links = social_links.map((item) => {
            return {
              slug_name: item.slug_name,
              link: item.link,
            };
          });
        }
      }
      if (req.body.setting_id) {
        let isExist = await PublicSetting.findById(req.body.setting_id);
        await isExist.delete();
      }
      PublicSetting.create(document, (err, doc) => {
        if (err){
          return resp.status(200).json({
            status: "error",
            message: err,
          });
        }
        return resp.status(200).send({
          status: "success",
          message: "Settings has been Updated successfully",
          post_data: doc,
        });
      });
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  get_settings: async (req, resp) => {
    try {
      let filters = {};
      let options = await getOptionsPayload(req);
      PublicSetting.find(filters, (err, docs) => {
        if (err)
          return resp.status(200).json({
            status: "error",
            message: err,
          });
        return resp.status(200).send({
          status: "success",
          docs,
        });
      })
        .limit(options.limit)
        .skip((options.page - 1) * options.limit)
        .sort(options.sort);
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  create_memberhsip_plan:async (req, resp) => {
    try {
      const v = new Validator(req.body, {
        title: "required",
        amount:"required",
        duration:"required",
      });
      if (!(await v.check()))
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });

        let document = {
          title:req.body.title,
          amount:req.body.amount,
          features:req.body.features ? JSON.parse(req.body.features) : null,
          duration:req.body.duration,
          discount:req.body.discount,
        }

        MembershipPlan.create(document, (err, doc) => {
          if (err) return resp.status(200).json({status: "error", message: err});
          
          return resp.status(200).send({
            status: "success",
            message: "Membership plan has been created successfully",
            plan_data: doc,
          });
        })

    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  get_memberhsip_plans: async (req, resp) => {
    try {
      let filters = {};
      let options = await getOptionsPayload(req);
      if (req.body.amount) filters.amount = req.body.amount;
      if (req.body.status) filters.status = req.body.status;

      MembershipPlan.find(filters, (err, docs) => {
        if (err)
          return resp.status(200).json({
            status: "error",
            message: err,
          });
        return resp.status(200).send({  
          status: "success",
          docs,
        });
      })
        .limit(options.limit)
        .skip((options.page - 1) * options.limit)
        .sort(options.sort);
    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  },
  update_memberhsip_plan:async (req, resp) => {
    try {
      const v = new Validator(req.body, {
        plan_id:'required',
        title: "required",
        amount:"required",
        duration:"required",
      });
      if (!(await v.check()))
        return resp.status(200).send({
          status: "val_err",
          message: "Validation error",
          val_msg: v.errors,
        });
      let { plan_id } = req.body;

      let document = {
        title:req.body.title,
        amount:req.body.amount,
        features:req.body.features ? JSON.parse(req.body.features) : null,
        duration:req.body.duration,
        discount:req.body.discount,
      }

      await MembershipPlan.updateOne({ _id:plan_id }, document, (err, doc) => {
        if (err){
          return resp.status(200).json({
            status: "error",
            message: err,
          });
        }
        return resp.status(200).send({
          status: "success",
          message: "Member plan updated successfully",
          plan_data: doc,
        });
      });

    } catch (e) {
      return resp.status(200).json({
        status: "error",
        message: e ? e.message : "Something went wrong",
      });
    }
  }
};
