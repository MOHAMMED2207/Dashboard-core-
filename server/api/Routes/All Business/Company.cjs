// server/api/Routes/Company.cjs
const express = require("express");
const CompanyController = require("../../Controllers/All Business/CompanyController.cjs");
const authMiddleware = require("../../middlewares/authentication.cjs");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Company CRUD
router.post("/", CompanyController.createCompany);
router.get("/my-companies", CompanyController.getUserCompanies);
router.get("/:companyId", CompanyController.getCompany);
router.put("/:companyId", CompanyController.updateCompany);

// Company Members
router.post("/:companyId/members", CompanyController.addMember);
router.delete("/:companyId/members/:memberId", CompanyController.removeMember);

// Company Statistics
router.get("/:companyId/statistics", CompanyController.getStatistics);

module.exports = router;