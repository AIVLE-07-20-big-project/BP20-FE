import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Ban,
  CheckCircle2,
  Gift,
  Mail,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  ShieldCheck,
  Store,
  TicketCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useAuth } from "../../app/providers/useAuth";
import type {
  Coupon,
  CouponStatus,
  CreateCustomerPayload,
  Customer,
  DiscountType,
  IssueCouponPayload,
  OnlinePurchase,
} from "../../entities/commerce/commerce.types";
import { commerceApi } from "../../features/commerce/api/commerceApi";
import {
  FeedbackBanner,
  FormField,
  ModalActions,
  OperationModal,
  SelectField,
} from "../../features/commerce/ui/CommerceUi";
import { Badge } from "../../shared/components/Badge";
import { PageShell } from "../../shared/components/PageShell";
import {
  formatPhoneNumber,
  isValidPhoneNumber,
  normalizePhoneNumber,
} from "../../shared/lib/phoneNumber";

type CustomerTab = "customers" | "coupons";
type CustomerModal = "customer" | "coupon" | null;

function futureDate(days: number) {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

const EMPTY_CUSTOMER: CreateCustomerPayload = {
  email: "",
  name: "",
  phoneNumber: "",
};

const EMPTY_COUPON: IssueCouponPayload = {
  customerId: 0,
  name: "",
  discountType: "FIXED_AMOUNT",
  discountValue: 3_000,
  expiresAt: futureDate(30),
  usageChannel: "OFFLINE_ONLY",
  sourceOnlinePurchaseId: null,
};

const DEMO_CUSTOMERS: Customer[] = [
  {
    id: 1,
    email: "customer@bp20.com",
    name: "김고객",
    phoneNumber: "010-1234-5678",
    status: "ACTIVE",
    createdAt: "2026-07-20T10:00:00",
    updatedAt: "2026-07-20T10:00:00",
  },
  {
    id: 2,
    email: "coffee-lover@example.com",
    name: "이단골",
    phoneNumber: "010-2222-3333",
    status: "ACTIVE",
    createdAt: "2026-07-18T15:30:00",
    updatedAt: "2026-07-18T15:30:00",
  },
  {
    id: 3,
    email: "guest@example.com",
    name: "박신규",
    phoneNumber: null,
    status: "ACTIVE",
    createdAt: "2026-07-27T12:10:00",
    updatedAt: "2026-07-27T12:10:00",
  },
];

const DEMO_COUPONS: Coupon[] = [
  {
    id: 1,
    name: "신규 고객 3,000원 쿠폰",
    status: "ISSUED",
    discountType: "FIXED_AMOUNT",
    discountValue: 3_000,
    customerId: 3,
    customerEmail: "guest@example.com",
    customerName: "박신규",
    usageChannel: "OFFLINE_ONLY",
    sourceOnlinePurchaseId: 5,
    issuedAt: "2026-07-27T12:15:00",
    expiresAt: "2026-08-27T23:59:59",
    usedAt: null,
    revokedAt: null,
  },
  {
    id: 2,
    name: "단골 고객 감사 쿠폰",
    status: "USED",
    discountType: "RATE",
    discountValue: 15,
    customerId: 2,
    customerEmail: "coffee-lover@example.com",
    customerName: "이단골",
    usageChannel: "ONLINE_ONLY",
    sourceOnlinePurchaseId: null,
    issuedAt: "2026-07-10T10:00:00",
    expiresAt: "2026-08-10T23:59:59",
    usedAt: "2026-07-19T14:20:00",
    revokedAt: null,
  },
  {
    id: 3,
    name: "재방문 10% 쿠폰",
    status: "ISSUED",
    discountType: "RATE",
    discountValue: 10,
    customerId: 2,
    customerEmail: "coffee-lover@example.com",
    customerName: "이단골",
    usageChannel: "OFFLINE_ONLY",
    sourceOnlinePurchaseId: 3,
    issuedAt: "2026-08-05T12:40:00",
    expiresAt: "2026-09-05T23:59:59",
    usedAt: null,
    revokedAt: null,
  },
  {
    id: 4,
    name: "매장 방문 감사 쿠폰",
    status: "USED",
    discountType: "FIXED_AMOUNT",
    discountValue: 2_000,
    customerId: 1,
    customerEmail: "customer@bp20.com",
    customerName: "김고객",
    usageChannel: "OFFLINE_ONLY",
    sourceOnlinePurchaseId: 1,
    issuedAt: "2026-08-05T10:20:00",
    expiresAt: "2026-09-05T23:59:59",
    usedAt: "2026-08-08T14:10:00",
    revokedAt: null,
  },
];

const DEMO_ONLINE_PURCHASES: OnlinePurchase[] = [
  {
    id: 5,
    customerId: 3,
    customerName: "박신규",
    customerEmail: "gue****@example.com",
    purchasedAt: "2026-08-05T02:30:00",
    totalAmount: 36_000,
    items: [{ productId: 11, productName: "시그니처 블렌드 원두 500g", unitPrice: 18_000, quantity: 2, lineAmount: 36_000 }],
  },
  {
    id: 4,
    customerId: 1,
    customerName: "김고객",
    customerEmail: "cus****@bp20.com",
    purchasedAt: "2026-08-05T02:30:00",
    totalAmount: 5_500,
    items: [{ productId: 12, productName: "플레인 베이글", unitPrice: 5_500, quantity: 1, lineAmount: 5_500 }],
  },
  {
    id: 3,
    customerId: 2,
    customerName: "이단골",
    customerEmail: "cof****@example.com",
    purchasedAt: "2026-08-05T02:30:00",
    totalAmount: 33_000,
    items: [{ productId: 13, productName: "콜드브루 원액", unitPrice: 5_500, quantity: 6, lineAmount: 33_000 }],
  },
  {
    id: 2,
    customerId: 3,
    customerName: "박신규",
    customerEmail: "gue****@example.com",
    purchasedAt: "2026-08-05T02:30:00",
    totalAmount: 7_600,
    items: [{ productId: 14, productName: "버터 크루아상", unitPrice: 3_800, quantity: 2, lineAmount: 7_600 }],
  },
  {
    id: 1,
    customerId: 1,
    customerName: "김고객",
    customerEmail: "cus****@bp20.com",
    purchasedAt: "2026-08-05T02:30:00",
    totalAmount: 5_600,
    items: [{ productId: 15, productName: "초코칩 쿠키", unitPrice: 2_800, quantity: 2, lineAmount: 5_600 }],
  },
];

const COUPON_STATUS_LABEL: Record<CouponStatus, string> = {
  ISSUED: "사용 가능",
  USED: "사용 완료",
  EXPIRED: "기간 만료",
  REVOKED: "발급 취소",
};

export function CustomersPage() {
  const { isDemo } = useAuth();
  const [activeTab, setActiveTab] = useState<CustomerTab>("customers");
  const [modal, setModal] = useState<CustomerModal>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [onlinePurchases, setOnlinePurchases] = useState<OnlinePurchase[]>([]);
  const [customerForm, setCustomerForm] = useState<CreateCustomerPayload>(EMPTY_CUSTOMER);
  const [couponForm, setCouponForm] = useState<IssueCouponPayload>(EMPTY_COUPON);
  const [query, setQuery] = useState("");
  const [couponFilter, setCouponFilter] = useState<"ALL" | CouponStatus>("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [customerModalError, setCustomerModalError] = useState("");
  const [couponModalError, setCouponModalError] = useState("");
  const [notice, setNotice] = useState("");

  const filteredCustomers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const normalizedPhone = normalizePhoneNumber(normalized);
    return customers.filter((customer) => !normalized
      || customer.name.toLowerCase().includes(normalized)
      || customer.email.toLowerCase().includes(normalized)
      || customer.phoneNumber?.includes(normalized)
      || (Boolean(normalizedPhone)
        && normalizePhoneNumber(customer.phoneNumber).includes(normalizedPhone)));
  }, [customers, query]);

  const filteredCoupons = useMemo(
    () => coupons.filter((coupon) => couponFilter === "ALL" || coupon.status === couponFilter),
    [couponFilter, coupons],
  );

  const availableCoupons = coupons.filter((coupon) => coupon.status === "ISSUED").length;
  const usedCoupons = coupons.filter((coupon) => coupon.status === "USED").length;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      if (isDemo) {
        setCustomers(DEMO_CUSTOMERS);
        setCoupons(DEMO_COUPONS);
        setOnlinePurchases(DEMO_ONLINE_PURCHASES);
        setLoading(false);
        return;
      }
      try {
        const [customerList, couponList, purchaseList] = await Promise.all([
          commerceApi.getCustomers(),
          commerceApi.getCoupons(),
          commerceApi.getOnlinePurchases(),
        ]);
        setCustomers(customerList);
        setCoupons(couponList);
        setOnlinePurchases(purchaseList);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "고객·쿠폰 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [isDemo]);

  const perform = async (
    action: () => Promise<void>,
    message: string,
    onError: (message: string) => void = setError,
  ) => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(message);
      return true;
    } catch (requestError) {
      onError(requestError instanceof Error ? requestError.message : "요청 처리에 실패했습니다.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const openCouponModal = (customerId?: number, sourceOnlinePurchaseId: number | null = null) => {
    setCouponModalError("");
    setCouponForm({
      ...EMPTY_COUPON,
      customerId: customerId ?? customers[0]?.id ?? 0,
      name: sourceOnlinePurchaseId ? "온라인 구매 고객 방문 쿠폰" : "",
      usageChannel: "OFFLINE_ONLY",
      sourceOnlinePurchaseId,
      expiresAt: futureDate(30),
    });
    setModal("coupon");
  };

  const saveCustomer = async (event: React.FormEvent) => {
    event.preventDefault();
    const succeeded = await perform(async () => {
      const created = isDemo
        ? {
            ...customerForm,
            id: Math.max(0, ...customers.map((customer) => customer.id)) + 1,
            phoneNumber: customerForm.phoneNumber || null,
            status: "ACTIVE" as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : await commerceApi.createCustomer(customerForm);
      setCustomers((current) => [created, ...current]);
    }, "고객이 등록되었습니다.", (message) => {
      setCustomerModalError(toModalErrorMessage(message));
    });
    if (succeeded) {
      setCustomerForm(EMPTY_CUSTOMER);
      setCustomerModalError("");
      setModal(null);
    }
  };

  const saveCoupon = async (event: React.FormEvent) => {
    event.preventDefault();
    const succeeded = await perform(async () => {
      const selectedCustomer = customers.find((customer) => customer.id === couponForm.customerId);
      const issued = isDemo
        ? {
            id: Math.max(0, ...coupons.map((coupon) => coupon.id)) + 1,
            ...couponForm,
            status: "ISSUED" as const,
            customerEmail: selectedCustomer?.email ?? "",
            customerName: selectedCustomer?.name ?? "",
            issuedAt: new Date().toISOString(),
            usedAt: null,
            revokedAt: null,
          }
        : await commerceApi.issueCoupon(couponForm);
      setCoupons((current) => [issued, ...current]);
    }, "고객에게 쿠폰을 발급했습니다.", (message) => {
      setCouponModalError(toModalErrorMessage(message));
    });
    if (succeeded) {
      setCouponModalError("");
      setModal(null);
      setActiveTab("coupons");
    }
  };

  const revokeCoupon = (coupon: Coupon) => {
    void perform(async () => {
      const revoked = isDemo
        ? { ...coupon, status: "REVOKED" as const, revokedAt: new Date().toISOString() }
        : await commerceApi.revokeCoupon(coupon.id);
      setCoupons((current) => current.map((item) => item.id === revoked.id ? revoked : item));
    }, "쿠폰 발급을 취소했습니다.");
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#246BFD]/25 border-t-[#246BFD]" />
          고객 정보를 불러오는 중입니다.
        </div>
      </div>
    );
  }

  return (
    <PageShell
      title="고객·쿠폰"
      subtitle="매장 고객을 안전하게 관리하고 고객별 맞춤 쿠폰을 발급합니다."
      actions={(
        <button
          type="button"
          onClick={() => {
            setCustomerForm(EMPTY_CUSTOMER);
            setCustomerModalError("");
            setModal("customer");
          }}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#246BFD] px-4 text-xs font-bold text-white hover:bg-[#1D4ED8]"
        >
          <UserPlus className="h-4 w-4" />고객 등록
        </button>
      )}
    >
      {isDemo && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          프로토타입 계정에서는 화면 안에서만 데이터가 변경됩니다.
        </div>
      )}
      <FeedbackBanner error={error} notice={notice} />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <SummaryCard icon={Users} label="등록 고객" value={`${customers.length}명`} tone="blue" />
        <SummaryCard icon={Gift} label="사용 가능 쿠폰" value={`${availableCoupons}개`} tone="violet" />
        <SummaryCard icon={TicketCheck} label="사용 완료" value={`${usedCoupons}개`} tone="green" />
      </div>

      <div className="mb-5 flex gap-1 rounded-2xl border border-border bg-card p-1.5">
        <TabButton active={activeTab === "customers"} onClick={() => setActiveTab("customers")} icon={Users}>고객 목록</TabButton>
        <TabButton active={activeTab === "coupons"} onClick={() => setActiveTab("coupons")} icon={Gift}>쿠폰 발급 내역</TabButton>
      </div>

      {activeTab === "customers" ? (
        <section className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold">매장 고객</h2>
              <p className="mt-1 text-xs text-muted-foreground">쿠폰을 발급할 고객을 등록하고 조회합니다.</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="이름, 이메일, 전화번호 검색"
                className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-[#246BFD]"
              />
            </div>
          </div>
          <div className="flex items-start gap-3 border-b border-border bg-[#F7FAFF] px-5 py-3 text-xs text-[#1D4ED8]">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            고객 정보는 쿠폰 발급과 매장 고객 관리 목적으로만 사용합니다. 고객 계정의 비밀번호는 저장하지 않습니다.
          </div>
          {filteredCustomers.length === 0 ? (
            <EmptyState icon={Users} title="등록된 고객이 없습니다" description="고객을 등록하면 맞춤 쿠폰을 발급할 수 있습니다." />
          ) : (
            <div className="divide-y divide-border">
              {filteredCustomers.map((customer) => (
                <article key={customer.id} className="grid gap-4 p-4 hover:bg-muted/20 md:grid-cols-[1fr_1fr_auto] md:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EAF2FF] text-sm font-black text-[#246BFD]">
                      {customer.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold">{customer.name}</span>
                        <Badge variant={customer.status === "ACTIVE" ? "positive" : "muted"}>
                          {customer.status === "ACTIVE" ? "활성" : "비활성"}
                        </Badge>
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">등록 {formatDate(customer.createdAt)}</div>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{customer.email}</div>
                    <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{formatPhoneNumber(customer.phoneNumber) || "전화번호 미등록"}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openCouponModal(customer.id)}
                    disabled={customer.status !== "ACTIVE"}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#BFD4FF] bg-[#F7FAFF] px-3 text-xs font-bold text-[#1D4ED8] disabled:opacity-40"
                  >
                    <Gift className="h-3.5 w-3.5" />쿠폰 발급
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : (
        <div className="space-y-5">
          <O2OConversionSection
            purchases={onlinePurchases}
            coupons={coupons}
            saving={saving}
            onIssueCoupon={(purchase) => openCouponModal(purchase.customerId, purchase.id)}
          />
          <section className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold">쿠폰 발급 내역</h2>
              <p className="mt-1 text-xs text-muted-foreground">고객에게 발급한 쿠폰의 사용·만료·취소 상태를 확인합니다.</p>
            </div>
            <div className="flex gap-2">
              <select
                value={couponFilter}
                onChange={(event) => setCouponFilter(event.target.value as "ALL" | CouponStatus)}
                className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-semibold"
              >
                <option value="ALL">전체 상태</option>
                <option value="ISSUED">사용 가능</option>
                <option value="USED">사용 완료</option>
                <option value="EXPIRED">기간 만료</option>
                <option value="REVOKED">발급 취소</option>
              </select>
              <button
                type="button"
                onClick={() => openCouponModal()}
                disabled={customers.length === 0}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#8B5CF6] px-3 text-xs font-bold text-white disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />쿠폰 발급
              </button>
            </div>
          </div>
          {filteredCoupons.length === 0 ? (
            <EmptyState icon={Gift} title="발급된 쿠폰이 없습니다" description="등록 고객을 선택해 첫 쿠폰을 발급해 보세요." />
          ) : (
            <div className="divide-y divide-border">
              {filteredCoupons.map((coupon) => (
                <article key={coupon.id} className="grid gap-4 p-4 hover:bg-muted/20 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto] lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold">{coupon.name}</span>
                      <CouponStatusBadge status={coupon.status} />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{coupon.customerName} · {coupon.customerEmail}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground">혜택</div>
                    <div className="mt-1 text-sm font-black text-[#8B5CF6]">
                      {coupon.discountType === "RATE" ? `${coupon.discountValue}% 할인` : `₩${coupon.discountValue.toLocaleString()} 할인`}
                    </div>
                  </div>
                  <div className="text-xs">
                    <div className="text-[11px] text-muted-foreground">발급 / 만료</div>
                    <div className="mt-1">{formatDate(coupon.issuedAt)} · {formatDate(coupon.expiresAt)}</div>
                  </div>
                  {coupon.status === "ISSUED" ? (
                    <button
                      type="button"
                      onClick={() => revokeCoupon(coupon)}
                      disabled={saving}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-red-50 px-3 text-xs font-bold text-red-700 disabled:opacity-40"
                    >
                      <Ban className="h-3.5 w-3.5" />발급 취소
                    </button>
                  ) : <div className="w-20" />}
                </article>
              ))}
            </div>
          )}
          </section>
        </div>
      )}

      <CustomerModal
        open={modal === "customer"}
        form={customerForm}
        setForm={(form) => {
          setCustomerForm(form);
          setCustomerModalError("");
        }}
        saving={saving}
        error={customerModalError}
        onClose={() => {
          setCustomerModalError("");
          setModal(null);
        }}
        onSubmit={saveCustomer}
      />
      <CouponModal
        open={modal === "coupon"}
        customers={customers}
        form={couponForm}
        setForm={setCouponForm}
        saving={saving}
        error={couponModalError}
        onClose={() => {
          setCouponModalError("");
          setModal(null);
        }}
        onSubmit={saveCoupon}
      />
    </PageShell>
  );
}

function O2OConversionSection({
  purchases,
  coupons,
  saving,
  onIssueCoupon,
}: {
  purchases: OnlinePurchase[];
  coupons: Coupon[];
  saving: boolean;
  onIssueCoupon: (purchase: OnlinePurchase) => void;
}) {
  const convertedPurchaseIds = new Set(
    coupons
      .map((coupon) => coupon.sourceOnlinePurchaseId)
      .filter((purchaseId): purchaseId is number => purchaseId !== null),
  );
  const customerCount = new Set(purchases.map((purchase) => purchase.customerId)).size;
  const convertedCount = purchases.filter((purchase) => convertedPurchaseIds.has(purchase.id)).length;
  const candidateCount = purchases.length - convertedCount;

  return (
    <section className="overflow-hidden rounded-3xl border border-[#D8E3FF] bg-gradient-to-br from-[#F7FAFF] via-white to-[#FBF8FF] shadow-sm">
      <div className="flex flex-col gap-5 border-b border-[#E4EAF7] p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#246BFD] px-2.5 py-1 text-[10px] font-black text-white shadow-sm">
            <Store className="h-3 w-3" /> Online to Offline
          </div>
          <h2 className="mt-3 text-lg font-black tracking-tight">온라인 구매 고객을 오프라인 매장 방문으로 연결</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            온라인 구매 이력을 확인하고, 방문 가능성이 높은 고객에게 매장 전용 혜택을 발급합니다.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <ConversionMetric label="온라인 구매" value={`${purchases.length}건`} tone="blue" />
          <ConversionMetric label="구매 고객" value={`${customerCount}명`} tone="slate" />
          <ConversionMetric label="쿠폰 발급 완료" value={`${convertedCount}건`} tone="violet" />
          <ConversionMetric label="미발급 전환 대상" value={`${candidateCount}건`} tone="amber" />
        </div>
      </div>

      {purchases.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="온라인 구매 이력이 없습니다"
          description="온라인 구매가 발생하면 고객별 구매 내역과 방문 쿠폰 발급 대상을 확인할 수 있습니다."
        />
      ) : (
        <div className="grid gap-3 p-4 xl:grid-cols-2">
          {purchases.map((purchase) => {
            const converted = convertedPurchaseIds.has(purchase.id);
            return (
              <article
                key={purchase.id}
                className="rounded-2xl border border-[#E1E7F2] bg-white p-4 shadow-[0_8px_30px_rgba(36,107,253,0.04)] transition hover:-translate-y-0.5 hover:border-[#BFD4FF] hover:shadow-[0_12px_34px_rgba(36,107,253,0.09)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black">온라인 구매 #{purchase.id}</span>
                      <Badge variant={converted ? "positive" : "info"}>
                        {converted ? "방문 쿠폰 발급 완료" : "방문 전환 후보"}
                      </Badge>
                    </div>
                    <div className="mt-1 truncate text-[11px] text-muted-foreground">
                      {purchase.customerName} · {purchase.customerEmail} · {formatDateTime(purchase.purchasedAt)}
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-black text-[#173B74]">₩{purchase.totalAmount.toLocaleString()}</span>
                </div>

                <div className="mt-3 space-y-1.5 rounded-xl bg-[#F7F9FC] px-3 py-2.5">
                  {purchase.items.map((item) => (
                    <div key={`${purchase.id}-${item.productId}`} className="flex items-center justify-between gap-3 text-xs">
                      <span className="min-w-0 truncate font-semibold text-[#344054]">{item.productName} × {item.quantity}</span>
                      <span className="shrink-0 text-muted-foreground">₩{item.lineAmount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[11px] text-muted-foreground">구매 상품과 연관된 오프라인 재방문 혜택 추천</p>
                  <button
                    type="button"
                    onClick={() => onIssueCoupon(purchase)}
                    disabled={converted || saving}
                    className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-bold transition ${
                      converted
                        ? "cursor-default bg-[#F2F4F7] text-[#98A2B3]"
                        : "bg-[#246BFD] text-white shadow-sm hover:bg-[#1D4ED8] disabled:opacity-50"
                    }`}
                  >
                    {converted ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Gift className="h-3.5 w-3.5" />}
                    {converted ? "발급 완료" : "매장 방문 쿠폰 발급"}
                    {!converted && <ArrowRight className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ConversionMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "blue" | "slate" | "violet" | "amber";
}) {
  const toneClass = {
    blue: "border-blue-100 bg-blue-50/80 text-blue-700",
    slate: "border-slate-200 bg-white text-slate-700",
    violet: "border-violet-100 bg-violet-50/80 text-violet-700",
    amber: "border-amber-100 bg-amber-50/80 text-amber-700",
  }[tone];
  return (
    <div className={`min-w-28 rounded-2xl border px-3 py-2.5 ${toneClass}`}>
      <div className="text-[10px] font-semibold opacity-75">{label}</div>
      <div className="mt-1 text-base font-black">{value}</div>
    </div>
  );
}

function CustomerModal({
  open,
  form,
  setForm,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  form: CreateCustomerPayload;
  setForm: (form: CreateCustomerPayload) => void;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  const phoneNumberError = form.phoneNumber.length > 0 && !isValidPhoneNumber(form.phoneNumber)
    ? "전화번호 형식이 올바르지 않습니다."
    : "";
  const invalid = !form.name.trim() || !form.email.trim() || Boolean(phoneNumberError);
  return (
    <OperationModal
      open={open}
      title="고객 등록"
      description="같은 매장에서는 동일한 이메일을 중복 등록할 수 없습니다."
      onClose={onClose}
      footer={<ModalActions saving={saving} onClose={onClose} submitLabel="고객 등록" disabled={invalid} formId="customer-form" />}
    >
      <FeedbackBanner error={error} notice="" />
      <form id="customer-form" onSubmit={onSubmit} className="space-y-4">
        <FormField label="이름" required value={form.name} onChange={(name) => setForm({ ...form, name })} placeholder="이름을 입력해 주세요" />
        <FormField label="이메일" required type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} placeholder="이메일을 입력해 주세요" />
        <FormField
          label="전화번호"
          type="tel"
          value={form.phoneNumber}
          onChange={(phoneNumber) => setForm({
            ...form,
            phoneNumber: formatPhoneNumber(phoneNumber),
          })}
          placeholder="숫자만 입력해 주세요"
          error={phoneNumberError}
        />
      </form>
    </OperationModal>
  );
}

function toModalErrorMessage(message: string) {
  const separatorIndex = message.indexOf(":");
  if (separatorIndex < 0) return message;

  const fieldName = message.slice(0, separatorIndex).trim();
  return /^[A-Za-z][A-Za-z0-9_.]*$/.test(fieldName)
    ? message.slice(separatorIndex + 1).trim()
    : message;
}

function CouponModal({
  open,
  customers,
  form,
  setForm,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  customers: Customer[];
  form: IssueCouponPayload;
  setForm: (form: IssueCouponPayload) => void;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  const invalid = !form.customerId
    || !form.name.trim()
    || form.discountValue <= 0
    || !form.expiresAt
    || !form.usageChannel;
  return (
    <OperationModal
      open={open}
      title="고객 쿠폰 발급"
      description="발급 후 사용하지 않은 쿠폰만 취소할 수 있습니다."
      onClose={onClose}
      footer={<ModalActions saving={saving} onClose={onClose} submitLabel="쿠폰 발급" disabled={invalid} formId="coupon-form" />}
    >
      <FeedbackBanner error={error} notice="" />
      <form id="coupon-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        {form.sourceOnlinePurchaseId !== null && (
          <div className="sm:col-span-2 flex items-start gap-3 rounded-2xl border border-[#BFD4FF] bg-[#F4F8FF] px-4 py-3 text-xs text-[#1D4ED8]">
            <ShoppingBag className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <div className="font-bold">온라인 구매 #{form.sourceOnlinePurchaseId} 연계 쿠폰</div>
              <div className="mt-1 text-[11px] text-[#496A9F]">온라인 구매 고객의 매장 방문을 위한 오프라인 전용 쿠폰으로 발급됩니다.</div>
            </div>
          </div>
        )}
        <div className="sm:col-span-2">
          <SelectField
            label="수령 고객"
            required
            disabled={form.sourceOnlinePurchaseId !== null}
            value={form.customerId}
            onChange={(customerId) => setForm({ ...form, customerId: Number(customerId) })}
          >
            <option value={0}>고객을 선택하세요</option>
            {customers.filter((customer) => customer.status === "ACTIVE").map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.name} · {customer.email}</option>
            ))}
          </SelectField>
        </div>
        <div className="sm:col-span-2">
          <FormField label="쿠폰명" required value={form.name} onChange={(name) => setForm({ ...form, name })} placeholder="신규 고객 3,000원 쿠폰" />
        </div>
        <SelectField label="할인 유형" required value={form.discountType} onChange={(discountType) => setForm({ ...form, discountType: discountType as DiscountType })}>
          <option value="FIXED_AMOUNT">정액 할인(원)</option>
          <option value="RATE">정률 할인(%)</option>
        </SelectField>
        <SelectField
          label="사용 채널"
          required
          disabled={form.sourceOnlinePurchaseId !== null}
          value={form.usageChannel}
          onChange={(usageChannel) => setForm({
            ...form,
            usageChannel: usageChannel as IssueCouponPayload["usageChannel"],
          })}
        >
          <option value="OFFLINE_ONLY">오프라인 전용</option>
          <option value="ONLINE_ONLY">온라인 전용</option>
        </SelectField>
        <FormField
          label={form.discountType === "RATE" ? "할인율" : "할인 금액"}
          required
          type="number"
          min={1}
          max={form.discountType === "RATE" ? 100 : undefined}
          value={form.discountValue}
          onChange={(discountValue) => setForm({ ...form, discountValue: Number(discountValue) })}
        />
        <div className="sm:col-span-2">
          <FormField label="만료 일시" required type="datetime-local" value={form.expiresAt} onChange={(expiresAt) => setForm({ ...form, expiresAt })} />
        </div>
      </form>
    </OperationModal>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  tone: "blue" | "violet" | "green";
}) {
  const toneClass = {
    blue: "bg-[#EAF2FF] text-[#246BFD]",
    violet: "bg-violet-50 text-violet-600",
    green: "bg-emerald-50 text-emerald-600",
  }[tone];
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-[11px] font-semibold text-muted-foreground">{label}</div>
        <div className="mt-1 text-xl font-black">{value}</div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Users;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition ${
        active ? "bg-[#246BFD] text-white shadow-sm" : "text-muted-foreground hover:bg-muted"
      }`}
    >
      <Icon className="h-4 w-4" />{children}
    </button>
  );
}

function CouponStatusBadge({ status }: { status: CouponStatus }) {
  const variant = status === "ISSUED"
    ? "positive"
    : status === "USED"
      ? "info"
      : status === "REVOKED"
        ? "negative"
        : "muted";
  return <Badge variant={variant}>{COUPON_STATUS_LABEL[status]}</Badge>;
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Users;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-sm font-bold">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}
