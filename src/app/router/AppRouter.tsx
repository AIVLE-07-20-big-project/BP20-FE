import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { AdminLayout } from "../layouts/AdminLayout";
import { StoreOwnerLayout } from "../layouts/StoreOwnerLayout";
import { useAuth } from "../providers/useAuth";
import { LoginPage } from "../../pages/auth/LoginPage";
import { SignupPage } from "../../pages/auth/SignupPage";
import { PrivacyPolicyPage } from "../../pages/legal/PrivacyPolicyPage";
import { TermsPage } from "../../pages/legal/TermsPage";
import { OpenSourceLicensesPage } from "../../pages/legal/OpenSourceLicensesPage";
import { NotFoundPage } from "../../pages/error/NotFoundPage";
import { GuestRoute } from "./GuestRoute";
import { ProtectedRoute } from "./ProtectedRoute";

const DashboardPage = lazy(() => import("../../pages/store-owner/DashboardPage").then(({ DashboardPage }) => ({ default: DashboardPage })));
const SalesPage = lazy(() => import("../../pages/store-owner/SalesPage").then(({ SalesPage }) => ({ default: SalesPage })));
const AiStrategyPage = lazy(() => import("../../pages/store-owner/AiStrategyPage").then(({ AiStrategyPage }) => ({ default: AiStrategyPage })));
const AiStrategyDetailPage = lazy(() => import("../../pages/store-owner/AiStrategyDetailPage").then(({ AiStrategyDetailPage }) => ({ default: AiStrategyDetailPage })));
const EffectVerificationHistoryPage = lazy(() => import("../../pages/store-owner/EffectVerificationHistoryPage").then(({ EffectVerificationHistoryPage }) => ({ default: EffectVerificationHistoryPage })));
const RecommendationHistoryPage = lazy(() => import("../../pages/store-owner/RecommendationHistoryPage").then(({ RecommendationHistoryPage }) => ({ default: RecommendationHistoryPage })));
const EffectVerificationDetailPage = lazy(() => import("../../pages/store-owner/EffectVerificationDetailPage").then(({ EffectVerificationDetailPage }) => ({ default: EffectVerificationDetailPage })));
const LedgerPage = lazy(() => import("../../pages/store-owner/LedgerPage").then(({ LedgerPage }) => ({ default: LedgerPage })));
const CostPage = lazy(() => import("../../pages/store-owner/CostPage").then(({ CostPage }) => ({ default: CostPage })));
const InventoryPage = lazy(() => import("../../pages/store-owner/InventoryPage").then(({ InventoryPage }) => ({ default: InventoryPage })));
const ReviewsPage = lazy(() => import("../../pages/store-owner/ReviewsPage").then(({ ReviewsPage }) => ({ default: ReviewsPage })));
const ReportsPage = lazy(() => import("../../pages/store-owner/ReportsPage").then(({ ReportsPage }) => ({ default: ReportsPage })));
const CommercePage = lazy(() => import("../../pages/store-owner/CommercePage").then(({ CommercePage }) => ({ default: CommercePage })));
const CustomersPage = lazy(() => import("../../pages/store-owner/CustomersPage").then(({ CustomersPage }) => ({ default: CustomersPage })));
const AccountPage = lazy(() => import("../../pages/account/AccountPage").then(({ AccountPage }) => ({ default: AccountPage })));
const PlaceholderPage = lazy(() => import("../../pages/store-owner/PlaceholderPage").then(({ PlaceholderPage }) => ({ default: PlaceholderPage })));
const ProductImagePage = lazy(() => import("../../pages/store-owner/ProductImagePage").then(({ ProductImagePage }) => ({ default: ProductImagePage })));

const PortfolioDashboard = lazy(() => import("../../pages/admin/PortfolioDashboard").then(({ PortfolioDashboard }) => ({ default: PortfolioDashboard })));
const MerchantDetailPage = lazy(() => import("../../pages/admin/MerchantDetailPage").then(({ MerchantDetailPage }) => ({ default: MerchantDetailPage })));
const RisksPage = lazy(() => import("../../pages/admin/RisksPage").then(({ RisksPage }) => ({ default: RisksPage })));
const ROIPage = lazy(() => import("../../pages/admin/ROIPage").then(({ ROIPage }) => ({ default: ROIPage })));
const SalesTargetsPage = lazy(() => import("../../pages/admin/SalesTargetsPage").then(({ SalesTargetsPage }) => ({ default: SalesTargetsPage })));
const NoticesPage = lazy(() => import("../../pages/admin/NoticesPage").then(({ NoticesPage }) => ({ default: NoticesPage })));
const ServiceStatusPage = lazy(() => import("../../pages/admin/ServiceStatusPage").then(({ ServiceStatusPage }) => ({ default: ServiceStatusPage })));

const AdminAccountsPage = lazy(() => import("../../pages/iam/AdminAccountsPage").then(({ AdminAccountsPage }) => ({ default: AdminAccountsPage })));
const StoreOwnerAccountsPage = lazy(() => import("../../pages/iam/StoreOwnerAccountsPage").then(({ StoreOwnerAccountsPage }) => ({ default: StoreOwnerAccountsPage })));
const InvitationsPage = lazy(() => import("../../pages/iam/InvitationsPage").then(({ InvitationsPage }) => ({ default: InvitationsPage })));
const IAMLogsPage = lazy(() => import("../../pages/iam/IAMLogsPage").then(({ IAMLogsPage }) => ({ default: IAMLogsPage })));

function RouteLoading() {
  return (
    <div className="flex h-full min-h-64 items-center justify-center bg-background" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#246BFD]/30 border-t-[#246BFD]" aria-hidden="true" />
        페이지를 불러오는 중입니다.
      </div>
    </div>
  );
}

function LegacyEffectVerificationDetailRedirect() {
  const { recommendationId } = useParams();
  return (
    <Navigate
      to={recommendationId
        ? `/store/strategy-verifications/${encodeURIComponent(recommendationId)}`
        : "/store/strategy-verifications"}
      replace
    />
  );
}

export function AppRouter() {
  const { user, isInitializing } = useAuth();

  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/open-source-licenses" element={<OpenSourceLicensesPage />} />
        <Route
          path="/"
          element={
            isInitializing ? (
              <RouteLoading />
            ) : user ? (
              <Navigate to={user.role === "STORE_OWNER" ? "/store" : "/admin"} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/store"
          element={
            <ProtectedRoute requiredRole="STORE_OWNER">
              <StoreOwnerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="actions" element={<AiStrategyPage />} />
          <Route path="recommendations/history" element={<RecommendationHistoryPage />} />
          <Route path="strategy-verifications" element={<Navigate to="/store/strategy-verifications/sales" replace />} />
          <Route path="strategy-verifications/sales" element={<EffectVerificationHistoryPage recommendationType="SALES" />} />
          <Route path="strategy-verifications/review" element={<EffectVerificationHistoryPage recommendationType="REVIEW" />} />
          <Route path="strategy-verifications/:recommendationId" element={<EffectVerificationDetailPage />} />
          <Route path="actions/history" element={<Navigate to="/store/strategy-verifications" replace />} />
          <Route
            path="actions/verifications/:recommendationId"
            element={<LegacyEffectVerificationDetailRedirect />}
          />
          <Route path="actions/:id" element={<AiStrategyDetailPage />} />
          <Route path="ledger" element={<LedgerPage />} />
          <Route path="cost" element={<CostPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="commerce" element={<CommercePage />} />
          <Route path="commerce/product-images" element={<ProductImagePage />} />
          <Route path="help" element={<PlaceholderPage title="도움말" />} />
          <Route path="profile" element={<AccountPage />} />
          <Route path="staff" element={<NotFoundPage returnTo="/store" returnLabel="점주 대시보드로 돌아가기" />} />
          <Route path="settings" element={<NotFoundPage returnTo="/store" returnLabel="점주 대시보드로 돌아가기" />} />
          <Route path="*" element={<NotFoundPage returnTo="/store" returnLabel="점주 대시보드로 돌아가기" />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<PortfolioDashboard />} />
          <Route path="merchants/:id" element={<MerchantDetailPage />} />
          <Route path="store-owner-invitations" element={<Navigate to="/admin/accounts/store-owners" replace />} />
          <Route path="risks" element={<RisksPage />} />
          <Route path="market-intelligence" element={<PlaceholderPage title="소비·상권 분석" />} />
          <Route path="roi" element={<ROIPage />} />
          <Route path="sales-targets" element={<SalesTargetsPage />} />
          <Route path="subscriptions" element={<PlaceholderPage title="구독·계약 현황" />} />
          <Route path="notices" element={<NoticesPage />} />
          <Route path="service-status" element={<ServiceStatusPage />} />
          <Route path="profile" element={<AccountPage />} />
          <Route
            path="accounts/admins"
            element={(
              <ProtectedRoute requiredRole="SUPER_ADMIN">
                <AdminAccountsPage />
              </ProtectedRoute>
            )}
          />
          <Route path="accounts/store-owners" element={<StoreOwnerAccountsPage />} />
          <Route path="accounts/invitations" element={<InvitationsPage />} />
          <Route
            path="accounts/iam-logs"
            element={(
              <ProtectedRoute requiredRole="SUPER_ADMIN">
                <IAMLogsPage />
              </ProtectedRoute>
            )}
          />
          <Route path="iam/admins" element={<Navigate to="/admin/accounts/admins" replace />} />
          <Route path="iam/invitations" element={<Navigate to="/admin/accounts/invitations" replace />} />
          <Route path="iam/logs" element={<Navigate to="/admin/accounts/iam-logs" replace />} />
          <Route path="adoption" element={<NotFoundPage returnTo="/admin" returnLabel="관리자 대시보드로 돌아가기" />} />
          <Route path="*" element={<NotFoundPage returnTo="/admin" returnLabel="관리자 대시보드로 돌아가기" />} />
        </Route>

        <Route path="*" element={<NotFoundPage fullScreen />} />
      </Routes>
    </Suspense>
  );
}
