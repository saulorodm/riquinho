import { Router } from "express";

import { createAsset, deleteAsset, listAssets, updateAsset } from "../controllers/assets-controller.js";
import {
  bootstrapAuth,
  getAuthStatus,
  loginAuth,
  readAuthMe
} from "../controllers/auth-controller.js";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory
} from "../controllers/categories-controller.js";
import { createCycle, listCycles } from "../controllers/cycles-controller.js";
import { getDashboard } from "../controllers/dashboard-controller.js";
import {
  createExpense,
  deleteExpense,
  listExpenses,
  updateExpense
} from "../controllers/expenses-controller.js";
import { createIncome, deleteIncome, listIncome, updateIncome } from "../controllers/income-controller.js";
import {
  createInvestment,
  deleteInvestment,
  listInvestments,
  updateInvestment
} from "../controllers/investments-controller.js";
import {
  createLoan,
  deleteLoan,
  listLoans,
  toggleLoanInstallment
} from "../controllers/loans-controller.js";
import { requireAuth } from "../middlewares/auth-middleware.js";
import { readSettings, saveSettings } from "../controllers/settings-controller.js";
import { asyncHandler } from "../utils/async-handler.js";

export const apiRouter = Router();

apiRouter.get("/auth/status", asyncHandler(getAuthStatus));
apiRouter.post("/auth/bootstrap", asyncHandler(bootstrapAuth));
apiRouter.post("/auth/login", asyncHandler(loginAuth));
apiRouter.get("/auth/me", requireAuth, asyncHandler(readAuthMe));

apiRouter.use(requireAuth);

apiRouter.get("/dashboard", asyncHandler(getDashboard));

apiRouter
  .route("/assets")
  .get(asyncHandler(listAssets))
  .post(asyncHandler(createAsset));

apiRouter
  .route("/assets/:id")
  .put(asyncHandler(updateAsset))
  .delete(asyncHandler(deleteAsset));

apiRouter
  .route("/categories")
  .get(asyncHandler(listCategories))
  .post(asyncHandler(createCategory));

apiRouter
  .route("/categories/:id")
  .put(asyncHandler(updateCategory))
  .delete(asyncHandler(deleteCategory));

apiRouter
  .route("/financial-cycles")
  .get(asyncHandler(listCycles))
  .post(asyncHandler(createCycle));

apiRouter
  .route("/expenses")
  .get(asyncHandler(listExpenses))
  .post(asyncHandler(createExpense));

apiRouter
  .route("/expenses/:id")
  .put(asyncHandler(updateExpense))
  .delete(asyncHandler(deleteExpense));

apiRouter
  .route("/income")
  .get(asyncHandler(listIncome))
  .post(asyncHandler(createIncome));

apiRouter
  .route("/income/:id")
  .put(asyncHandler(updateIncome))
  .delete(asyncHandler(deleteIncome));

apiRouter
  .route("/investments")
  .get(asyncHandler(listInvestments))
  .post(asyncHandler(createInvestment));

apiRouter
  .route("/investments/:id")
  .put(asyncHandler(updateInvestment))
  .delete(asyncHandler(deleteInvestment));

apiRouter
  .route("/loans")
  .get(asyncHandler(listLoans))
  .post(asyncHandler(createLoan));

apiRouter
  .route("/loans/:id")
  .delete(asyncHandler(deleteLoan));

apiRouter
  .route("/loans/installments/:installmentId")
  .patch(asyncHandler(toggleLoanInstallment));

apiRouter
  .route("/settings")
  .get(asyncHandler(readSettings))
  .patch(asyncHandler(saveSettings));
