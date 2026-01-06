// server/api/Routes/Company.cjs
const express = require("express");
const CompanyController = require("../../Controllers/All Business/CompanyController.cjs");
const authMiddleware = require("../../middlewares/authentication.cjs");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Company CRUD
router.post("/", CompanyController.createCompany); // create company ✅
router.get("/my-companies", CompanyController.getUserCompanies); // get all user's companies ✅
router.get("/:companyId", CompanyController.getCompany); // get single company by (Id) ✅
router.put("/:companyId", CompanyController.updateCompany); // update company by (Id) ✅

// Company Members
router.post("/:companyId/members", CompanyController.addMember); // add member to company ✅
router.delete("/:companyId/members/:memberId", CompanyController.removeMember); // remove member from company ✅

// Company Statistics
router.get("/:companyId/statistics", CompanyController.getStatistics); // get company statistics ✅

module.exports = router;
