const express = require("express");
const CompanyController = require("../../Controllers/All Business/CompanyController.cjs");
const authMiddleware = require("../../middlewares/authentication.cjs");
const permission = require("../../middlewares/permissions.cjs");

const router = express.Router();

// كل الروتات تحتاج مصادقة
router.use(authMiddleware);

// إنشاء شركة ✅
router.post("/", CompanyController.createCompany);

// الحصول على شركات المستخدم ✅
router.get("/my-companies", CompanyController.getUserCompanies);

// الحصول على شركة واحدة ✅
router.get(
  "/:companyId",
  permission.hasPermission("company.read"), // تحقق من صلاحية قراءة الشركة
  CompanyController.getCompany
);

// تحديث الشركة ✅
router.put(
  "/:companyId",
  permission.isOwnerOrAdmin, // فقط Owner/Admin يستطيع التحديث
  CompanyController.updateCompany
);

// إضافة عضو ✅
router.get(
  "/:companyId/members",
  // permission.isMember, // فقط Owner/Admin يستطيع الإضافة
  CompanyController.getMember
);
router.post(
  "/:companyId/members",
  permission.isMember, // فقط Owner/Admin يستطيع الإضافة
  CompanyController.addMember
);

// إزالة عضو ✅
router.delete(
  "/:companyId/members/:memberId",
  permission.isOwnerOrAdmin, // فقط Owner/Admin يستطيع الإزالة
  CompanyController.removeMember
);

// الحصول على إحصائيات الشركة ✅
router.get(
  "/:companyId/statistics",
  permission.hasPermission("company.read"), // تحقق من صلاحية قراءة الشركة
  CompanyController.getStatistics
);

module.exports = router;
