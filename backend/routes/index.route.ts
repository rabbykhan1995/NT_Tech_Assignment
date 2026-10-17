import { Router } from "express";
import productRoute from "../src/product/product.route";
import ownerRoute from "../src/auth/owner.route";
import contactRoute from "../src/contact/contact.route";
import purchaseRoute from "../src/purchase/purchase.route"
import saleRoute from "../src/sale/sale.route"
import ledgerRoute from "../src/ledger/ledger.route"
import reportRoute from "../src/report/report.route"
import automationRoute from "../src/automation/auto.route"
import supplierProductRoute from "../src/supplier_product/supplier_product.route"
import dashboardRoute from "../src/dashboard/dashboard.route"
import aiRoute from "../src/ai/ai.route"


const router = Router();
router.use("/product", productRoute);

router.use("/auth", ownerRoute);

router.use("/contact", contactRoute)
router.use("/purchase", purchaseRoute)
router.use("/sale", saleRoute)
router.use("/ledger", ledgerRoute)
router.use("/report", reportRoute)
router.use("/automation", automationRoute)
router.use("/supplier-product", supplierProductRoute)
router.use("/dashboard", dashboardRoute)
router.use("/ai", aiRoute)

export default router;
