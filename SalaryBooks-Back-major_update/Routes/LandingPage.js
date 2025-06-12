let express = require("express");
var middleware = require("../Middleware/middleware");
let router = express.Router();
const LandingPageController = require("../Controller/LandingPage/LandingPageController");

router.post(
  "/generate-page-slug",
  middleware.checkAuth,
  middleware.authUserType(["super_admin", "sub_admin"]),
  LandingPageController.generate_page_slug
);
router.post(
  "/create-landing-page",
  middleware.checkAuth,
  middleware.authUserType(["super_admin", "sub_admin"]),
  LandingPageController.create_public_page
);
router.post(
  "/update-landing-page",
  middleware.checkAuth,
  middleware.authUserType(["super_admin", "sub_admin"]),
  LandingPageController.update_public_page
);
router.post(
  "/create-page-post",
  middleware.checkAuth,
  middleware.authUserType(["super_admin", "sub_admin"]),
  LandingPageController.create_public_post
);
router.post(
  "/update-page-post",
  middleware.checkAuth,
  middleware.authUserType(["super_admin", "sub_admin"]),
  LandingPageController.update_public_post
);
router.post(
  "/create-membership-plan",
  middleware.checkAuth,
  middleware.authUserType(["super_admin", "sub_admin"]),
  LandingPageController.create_memberhsip_plan
);
router.post(
  "/update-membership-plan",
  middleware.checkAuth,
  middleware.authUserType(["super_admin", "sub_admin"]),
  LandingPageController.update_memberhsip_plan
);
router.post(
  "/update-settings",
  middleware.checkAuth,
  middleware.authUserType(["super_admin", "sub_admin"]),
  LandingPageController.update_settings
);

router.post("/get-landing-pages", LandingPageController.get_public_pages);
router.post("/get-page-posts", LandingPageController.get_public_posts);
router.post("/get-membership-plans", LandingPageController.get_memberhsip_plans);
router.post("/get-settings", LandingPageController.get_settings);

module.exports = router;
