import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgePercent,
  BellRing,
  CalendarDays,
  Clock3,
  Globe2,
  ImageIcon,
  Package,
  Pencil,
  Plus,
  Power,
  Search,
  Sparkles,
  Store as StoreIcon,
} from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import type {
  CreateDiscountPayload,
  CreateProductPayload,
  CreateStorePayload,
  Discount,
  DiscountStatus,
  DiscountType,
  Product,
  ProductStatus,
  Store,
} from "../../entities/commerce/commerce.types";
import { commerceApi } from "../../features/commerce/api/commerceApi";
import {
  FeedbackBanner,
  FormField,
  ModalActions,
  OperationModal,
  SelectField,
} from "../../features/commerce/ui/CommerceUi";
import { ApiError } from "../../shared/api/apiClient";
import { Badge } from "../../shared/components/Badge";
import { PageShell } from "../../shared/components/PageShell";

type CommerceTab = "products" | "online" | "discounts";
type CommerceModal = "store" | "product" | "discount" | null;

const EMPTY_STORE: CreateStorePayload = {
  name: "",
  businessNumber: "",
  category: "",
  address: "",
  phoneNumber: "",
};

const EMPTY_PRODUCT: CreateProductPayload = {
  name: "",
  description: "",
  price: 0,
  stockQuantity: 0,
  imageUrl: "",
};

function localDateTime(daysFromNow = 0, hour?: number) {
  const date = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  if (hour !== undefined) date.setHours(hour, 0, 0, 0);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function emptyDiscount(): CreateDiscountPayload {
  return {
    name: "",
    description: "",
    discountType: "RATE",
    discountValue: 10,
    productId: 0,
    startsAt: localDateTime(0),
    endsAt: localDateTime(30),
    dailyStartTime: null,
    dailyEndTime: null,
    reminderEnabled: false,
  };
}

function toModalErrorMessage(message: string) {
  const separatorIndex = message.indexOf(":");
  if (separatorIndex < 0) return message;

  const fieldName = message.slice(0, separatorIndex).trim();
  return /^[A-Za-z][A-Za-z0-9_.]*$/.test(fieldName)
    ? message.slice(separatorIndex + 1).trim()
    : message;
}

function formatBusinessNumberInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function isValidBusinessNumber(value: string) {
  return /^\d{3}-?\d{2}-?\d{5}$/.test(value);
}

const DEMO_STORE: Store = {
  id: 1,
  name: "성수 브루랩",
  businessNumber: "1234567890",
  category: "카페·베이커리",
  address: "서울특별시 성동구 성수이로 20",
  phoneNumber: "02-1234-5678",
  onlineSalesStatus: "OPEN",
  createdAt: "2026-07-01T09:00:00",
  updatedAt: "2026-07-24T09:00:00",
};

const DEMO_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "아이스 아메리카노",
    description: "고소한 원두로 내린 시원한 아메리카노",
    price: 4_000,
    stockQuantity: 42,
    imageUrl: null,
    status: "ACTIVE",
    onlineSalesStatus: "ON_SALE",
    createdAt: "2026-07-01T09:00:00",
    updatedAt: "2026-07-24T09:00:00",
  },
  {
    id: 2,
    name: "클럽 샌드위치",
    description: "신선한 채소와 닭가슴살을 넣은 든든한 샌드위치",
    price: 6_500,
    stockQuantity: 18,
    imageUrl: null,
    status: "ACTIVE",
    onlineSalesStatus: "ON_SALE",
    createdAt: "2026-07-02T09:00:00",
    updatedAt: "2026-07-24T09:00:00",
  },
  {
    id: 3,
    name: "버터 크루아상",
    description: "매일 아침 매장에서 굽는 버터 크루아상",
    price: 3_800,
    stockQuantity: 0,
    imageUrl: null,
    status: "SOLD_OUT",
    onlineSalesStatus: "NOT_REGISTERED",
    createdAt: "2026-07-03T09:00:00",
    updatedAt: "2026-07-24T09:00:00",
  },
];

const DEMO_DISCOUNTS: Discount[] = [
  {
    id: 1,
    name: "오후 아메리카노 할인",
    description: "비수기 시간대 방문 고객을 위한 할인",
    discountType: "RATE",
    discountValue: 15,
    product: { id: 1, name: "아이스 아메리카노", price: 4_000 },
    startsAt: "2026-07-01T14:00:00",
    endsAt: "2026-08-31T17:00:00",
    dailyStartTime: "14:00:00",
    dailyEndTime: "17:00:00",
    reminderEnabled: true,
    status: "ACTIVE",
    createdAt: "2026-07-01T09:00:00",
    updatedAt: "2026-07-01T09:00:00",
  },
];

const DISCOUNT_STATUS_LABEL: Record<DiscountStatus, string> = {
  DRAFT: "작성 중",
  SCHEDULED: "예약",
  ACTIVE: "진행 중",
  PAUSED: "일시중지",
  ENDED: "종료",
};

export function CommercePage() {
  const { isDemo } = useAuth();
  const [activeTab, setActiveTab] = useState<CommerceTab>("products");
  const [modal, setModal] = useState<CommerceModal>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [storeForm, setStoreForm] = useState<CreateStorePayload>(EMPTY_STORE);
  const [productForm, setProductForm] = useState<CreateProductPayload>(EMPTY_PRODUCT);
  const [discountForm, setDiscountForm] = useState<CreateDiscountPayload>(emptyDiscount);
  const [useDailyTime, setUseDailyTime] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [productFilter, setProductFilter] = useState<"ALL" | ProductStatus>("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [notice, setNotice] = useState("");

  const onlineProducts = useMemo(
    () => products.filter((product) => product.onlineSalesStatus === "ON_SALE"),
    [products],
  );
  const activeDiscounts = useMemo(
    () => discounts.filter((discount) => discount.status === "ACTIVE" || discount.status === "SCHEDULED"),
    [discounts],
  );
  const filteredProducts = useMemo(() => {
    const query = productQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery = !query
        || product.name.toLowerCase().includes(query)
        || product.description?.toLowerCase().includes(query);
      const matchesStatus = productFilter === "ALL" || product.status === productFilter;
      return matchesQuery && matchesStatus;
    });
  }, [productFilter, productQuery, products]);

  const loadData = async () => {
    setLoading(true);
    setError("");

    if (isDemo) {
      setStore(DEMO_STORE);
      setProducts(DEMO_PRODUCTS);
      setDiscounts(DEMO_DISCOUNTS);
      setLoading(false);
      return;
    }

    try {
      const currentStore = await commerceApi.getStore();
      const [productList, discountList] = await Promise.all([
        commerceApi.getProducts(),
        commerceApi.getDiscounts(),
      ]);
      setStore(currentStore);
      setProducts(productList);
      setDiscounts(discountList);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 404) {
        setStore(null);
        setProducts([]);
        setDiscounts([]);
      } else {
        setError(requestError instanceof Error ? requestError.message : "매장 정보를 불러오지 못했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [isDemo]);

  const perform = async (
    action: () => Promise<void>,
    message: string,
    onError: (message: string) => void = setError,
  ) => {
    setSaving(true);
    setError("");
    setModalError("");
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

  const openStoreModal = () => {
    setError("");
    setModalError("");
    setStoreForm(store ? {
      name: store.name,
      businessNumber: store.businessNumber,
      category: store.category,
      address: store.address,
      phoneNumber: store.phoneNumber ?? "",
    } : EMPTY_STORE);
    setModal("store");
  };

  const closeStoreModal = () => {
    setModal(null);
    setModalError("");
  };

  const updateStoreForm = (form: CreateStorePayload) => {
    setStoreForm(form);
    setModalError("");
  };

  const openProductModal = (product?: Product) => {
    setEditingProduct(product ?? null);
    setProductForm(product ? {
      name: product.name,
      description: product.description ?? "",
      price: product.price,
      stockQuantity: product.stockQuantity,
      imageUrl: product.imageUrl ?? "",
    } : EMPTY_PRODUCT);
    setModal("product");
  };

  const openDiscountModal = () => {
    setDiscountForm({
      ...emptyDiscount(),
      productId: products.find((product) => product.status === "ACTIVE")?.id ?? products[0]?.id ?? 0,
    });
    setUseDailyTime(false);
    setModal("discount");
  };

  const saveStore = async (event: React.FormEvent) => {
    event.preventDefault();
    const succeeded = await perform(async () => {
      const saved = isDemo
        ? {
            ...(store ?? DEMO_STORE),
            ...storeForm,
            id: store?.id ?? 1,
            onlineSalesStatus: store?.onlineSalesStatus ?? "CLOSED" as const,
            createdAt: store?.createdAt ?? new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : store
          ? await commerceApi.updateStore({
              name: storeForm.name,
              category: storeForm.category,
              address: storeForm.address,
              phoneNumber: storeForm.phoneNumber,
            })
          : await commerceApi.createStore(storeForm);
      setStore(saved);
    }, store ? "매장 정보가 수정되었습니다." : "매장이 등록되었습니다.", (message) => {
      setModalError(toModalErrorMessage(message));
    });
    if (succeeded) closeStoreModal();
  };

  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    const succeeded = await perform(async () => {
      const saved = isDemo
        ? {
            ...(editingProduct ?? {
              id: Math.max(0, ...products.map((product) => product.id)) + 1,
              status: productForm.stockQuantity > 0 ? "ACTIVE" as const : "SOLD_OUT" as const,
              onlineSalesStatus: "NOT_REGISTERED" as const,
              createdAt: new Date().toISOString(),
            }),
            ...productForm,
            description: productForm.description || null,
            imageUrl: productForm.imageUrl || null,
            updatedAt: new Date().toISOString(),
          }
        : editingProduct
          ? await commerceApi.updateProduct(editingProduct.id, productForm)
          : await commerceApi.createProduct(productForm);
      setProducts((current) => editingProduct
        ? current.map((product) => product.id === saved.id ? saved : product)
        : [saved, ...current]);
    }, editingProduct ? "상품 정보가 수정되었습니다." : "상품이 등록되었습니다.");
    if (succeeded) {
      setModal(null);
      setEditingProduct(null);
    }
  };

  const saveDiscount = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload: CreateDiscountPayload = {
      ...discountForm,
      dailyStartTime: useDailyTime ? discountForm.dailyStartTime : null,
      dailyEndTime: useDailyTime ? discountForm.dailyEndTime : null,
    };
    const succeeded = await perform(async () => {
      const product = products.find((item) => item.id === payload.productId);
      const saved = isDemo
        ? {
            ...payload,
            id: Math.max(0, ...discounts.map((discount) => discount.id)) + 1,
            description: payload.description || null,
            product: {
              id: product?.id ?? 0,
              name: product?.name ?? "상품",
              price: product?.price ?? 0,
            },
            status: "DRAFT" as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : await commerceApi.createDiscount(payload);
      setDiscounts((current) => [saved, ...current]);
    }, "할인이 작성 중 상태로 등록되었습니다.");
    if (succeeded) setModal(null);
  };

  const changeProductStatus = (product: Product, status: ProductStatus) => {
    void perform(async () => {
      const updated = isDemo
        ? { ...product, status, updatedAt: new Date().toISOString() }
        : await commerceApi.changeProductStatus(product.id, status);
      setProducts((current) => current.map((item) => item.id === updated.id ? updated : item));
    }, `${product.name} 상품 상태가 변경되었습니다.`);
  };

  const toggleOnlineProduct = (product: Product) => {
    const registering = product.onlineSalesStatus === "NOT_REGISTERED";
    void perform(async () => {
      const updated = isDemo
        ? {
            ...product,
            onlineSalesStatus: registering ? "ON_SALE" as const : "NOT_REGISTERED" as const,
            updatedAt: new Date().toISOString(),
          }
        : registering
          ? await commerceApi.registerOnline(product.id)
          : await commerceApi.unregisterOnline(product.id);
      setProducts((current) => current.map((item) => item.id === updated.id ? updated : item));
    }, registering ? "온라인 판매 상품으로 등록되었습니다." : "온라인 판매 등록이 해제되었습니다.");
  };

  const toggleOnlineStore = () => {
    if (!store) return;
    const nextStatus: Store["onlineSalesStatus"] =
      store.onlineSalesStatus === "OPEN" ? "CLOSED" : "OPEN";
    void perform(async () => {
      const updated = isDemo
        ? { ...store, onlineSalesStatus: nextStatus }
        : await commerceApi.changeOnlineSalesStatus(nextStatus);
      setStore(updated);
    }, nextStatus === "OPEN" ? "온라인 판매를 시작했습니다." : "온라인 판매를 종료했습니다.");
  };

  const changeDiscountStatus = (discount: Discount, status: DiscountStatus) => {
    void perform(async () => {
      const updated = isDemo
        ? { ...discount, status, updatedAt: new Date().toISOString() }
        : await commerceApi.changeDiscountStatus(discount.id, status);
      setDiscounts((current) => current.map((item) => item.id === updated.id ? updated : item));
    }, `${discount.name} 할인의 상태가 변경되었습니다.`);
  };

  if (loading) return <LoadingState />;

  if (!store) {
    return (
      <PageShell title="매장·커머스" subtitle="오프라인 매장을 등록한 뒤 같은 상품을 온라인에서도 판매할 수 있습니다.">
        <FeedbackBanner error={error} notice={notice} />
        <div className="relative overflow-hidden rounded-3xl border border-[#BFD4FF] bg-gradient-to-br from-[#F7FAFF] via-white to-[#EEF3FF] px-6 py-10 sm:px-10">
          <div className="absolute -right-14 -top-14 h-48 w-48 rounded-full bg-[#246BFD]/8" />
          <div className="relative max-w-xl">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#246BFD] text-white shadow-lg shadow-blue-200">
              <StoreIcon className="h-7 w-7" />
            </div>
            <Badge variant="info">시작하기</Badge>
            <h2 className="mt-3 text-2xl font-black tracking-tight">먼저 내 매장을 등록해 주세요</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              매장 등록 후 상품 관리, 온라인 판매, 시간대 할인과 고객 쿠폰 기능을 사용할 수 있습니다.
              점주 계정 하나에는 매장 하나만 연결됩니다.
            </p>
            <button
              type="button"
              onClick={openStoreModal}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#246BFD] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#1D4ED8]"
            >
              <Plus className="h-4 w-4" />
              내 매장 등록
            </button>
          </div>
        </div>
        <StoreModal
          open={modal === "store"}
          store={store}
          form={storeForm}
          setForm={updateStoreForm}
          saving={saving}
          error={modalError}
          onClose={closeStoreModal}
          onSubmit={saveStore}
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="매장·커머스"
      subtitle="매장 상품과 온라인 판매, 할인을 한곳에서 관리합니다."
    >
      {isDemo && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          프로토타입 계정에서는 화면 안에서만 데이터가 변경됩니다. 실제 계정에서는 백엔드에 즉시 반영됩니다.
        </div>
      )}
      <FeedbackBanner error={error} notice={notice} />
      <AiProductImageBanner />

      <section className="mb-5 overflow-hidden rounded-3xl border border-[#D8E3F5] bg-gradient-to-r from-white via-[#F8FAFF] to-[#F1F5FF] shadow-sm">
        <div className="grid gap-5 px-5 py-5 xl:grid-cols-[1fr_auto] xl:items-center">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF2FF] text-[#246BFD]">
              <StoreIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-black">{store.name}</h2>
                <Badge variant={store.onlineSalesStatus === "OPEN" ? "positive" : "muted"}>
                  {store.onlineSalesStatus === "OPEN" ? "온라인 영업 중" : "온라인 영업 종료"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{store.category}</p>
            </div>
          </div>
          <Link
            to="/store/profile"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#CCD9EE] bg-white px-3 text-xs font-semibold text-[#36537D] shadow-sm transition hover:border-[#AFC4E5] hover:bg-[#F8FAFF]"
          >
            <Pencil className="h-3.5 w-3.5" />
            내 정보에서 매장 관리
          </Link>
        </div>
        <div className="grid grid-cols-2 border-t border-border sm:grid-cols-4">
          <MiniMetric label="전체 상품" value={`${products.length}개`} />
          <MiniMetric label="온라인 상품" value={`${onlineProducts.length}개`} />
          <MiniMetric label="판매 가능" value={`${products.filter((product) => product.status === "ACTIVE").length}개`} />
          <MiniMetric label="진행·예약 할인" value={`${activeDiscounts.length}개`} />
        </div>
      </section>

      <div className="mb-5 flex gap-1.5 overflow-x-auto rounded-2xl border border-[#DCE4F0] bg-[#EEF3F9] p-1.5 shadow-inner">
        <TabButton active={activeTab === "products"} onClick={() => setActiveTab("products")} icon={Package}>상품 관리</TabButton>
        <TabButton active={activeTab === "online"} onClick={() => setActiveTab("online")} icon={Globe2}>온라인 판매</TabButton>
        <TabButton active={activeTab === "discounts"} onClick={() => setActiveTab("discounts")} icon={BadgePercent}>할인 관리</TabButton>
      </div>

      {activeTab === "products" && (
        <ProductSection
          products={filteredProducts}
          totalCount={products.length}
          query={productQuery}
          filter={productFilter}
          saving={saving}
          onQueryChange={setProductQuery}
          onFilterChange={setProductFilter}
          onCreate={() => openProductModal()}
          onEdit={openProductModal}
          onStatusChange={changeProductStatus}
          onOnlineToggle={toggleOnlineProduct}
        />
      )}

      {activeTab === "online" && (
        <OnlineSection
          store={store}
          products={products}
          onlineProducts={onlineProducts}
          saving={saving}
          onStoreToggle={toggleOnlineStore}
          onProductToggle={toggleOnlineProduct}
        />
      )}

      {activeTab === "discounts" && (
        <DiscountSection
          discounts={discounts}
          products={products}
          saving={saving}
          onCreate={openDiscountModal}
          onStatusChange={changeDiscountStatus}
        />
      )}

      <ProductModal
        open={modal === "product"}
        editingProduct={editingProduct}
        form={productForm}
        setForm={setProductForm}
        saving={saving}
        onClose={() => {
          setModal(null);
          setEditingProduct(null);
        }}
        onSubmit={saveProduct}
      />
      <DiscountModal
        open={modal === "discount"}
        products={products}
        form={discountForm}
        setForm={setDiscountForm}
        useDailyTime={useDailyTime}
        setUseDailyTime={setUseDailyTime}
        saving={saving}
        onClose={() => setModal(null)}
        onSubmit={saveDiscount}
      />
    </PageShell>
  );
}

function AiProductImageBanner() {
  return (
    <section className="relative mb-5 overflow-hidden rounded-[28px] border border-[#506CFF]/45 bg-[#07142E] shadow-[0_20px_50px_rgba(24,52,120,0.24)]">
      <div className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full bg-[#246BFD]/30 blur-3xl" />
      <div className="pointer-events-none absolute left-1/3 top-1/2 h-40 w-40 rounded-full bg-[#8B5CF6]/20 blur-3xl" />

      <div className="relative grid xl:grid-cols-[minmax(0,1.25fr)_minmax(420px,0.75fr)]">
        <div className="relative z-10 flex min-w-0 flex-col justify-center px-6 py-7 sm:px-8 sm:py-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#AFC7FF] backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-[#7EA2FF]" />
              BP20 Generative Studio
            </span>
            <span className="rounded-full bg-[#7C5CFC]/20 px-2.5 py-1 text-[10px] font-bold text-[#CFC2FF]">
              AI 배경 합성
            </span>
          </div>

          <h2 className="max-w-2xl text-2xl font-black leading-tight tracking-[-0.03em] text-white sm:text-[28px]">
            메뉴 사진 한 장을,
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-[#72A3FF] via-[#A78BFA] to-[#E2D8FF] bg-clip-text text-transparent">
              고객이 멈춰 보는 판매 이미지로
            </span>
          </h2>
          <p className="mt-3 max-w-xl text-xs leading-5 text-[#B9C5DB] sm:text-sm sm:leading-6">
            상품과 메뉴 카테고리만 선택하세요. AI가 상품의 매력을 살리는 조명과 배경을 합성해
            촬영 장비나 디자인 도구 없이도 온라인 판매에 바로 활용할 이미지를 완성합니다.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-[#C5D0E4]">
            <span className="rounded-lg border border-white/10 bg-white/[0.07] px-2.5 py-1.5">1. 상품 사진 선택</span>
            <ArrowRight className="h-3.5 w-3.5 text-[#7183A4]" />
            <span className="inline-flex items-center gap-1 rounded-lg border border-[#7C5CFC]/30 bg-[#7C5CFC]/15 px-2.5 py-1.5 text-[#D5CAFF]">
              <Sparkles className="h-3 w-3" />
              2. AI 분위기 생성
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-[#7183A4]" />
            <span className="rounded-lg border border-white/10 bg-white/[0.07] px-2.5 py-1.5">3. 판매 이미지 완성</span>
          </div>

          <Link
            to="/store/commerce/product-images"
            className="mt-6 inline-flex h-11 w-fit items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#246BFD] to-[#6D5DFC] px-5 text-xs font-bold text-white shadow-[0_10px_28px_rgba(36,107,253,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(36,107,253,0.46)]"
          >
            <Sparkles className="h-4 w-4" />
            AI 상품 이미지 만들기
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="relative aspect-[16/7] min-h-[220px] overflow-hidden border-t border-white/10 sm:min-h-[250px] xl:-ml-32 xl:aspect-auto xl:min-h-[300px] xl:w-[calc(100%+8rem)] xl:border-t-0">
          <img
            src="/images/ai-product-image-banner-natural.png"
            alt="AI가 밝고 자연스러운 카페 배경을 합성한 아이스 아메리카노 판매 이미지 예시"
            className="absolute inset-0 h-full w-full object-cover object-[90%_center] sm:object-[76%_center] xl:object-[68%_center] 2xl:object-[88%_center]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#07142E] via-[#07142E]/20 to-transparent xl:hidden" />
          <div
            className="pointer-events-none absolute inset-y-0 left-0 hidden w-[58%] xl:block"
            style={{
              background:
                "linear-gradient(90deg, #07142E 0%, rgba(7, 20, 46, 0.98) 20%, rgba(7, 20, 46, 0.72) 48%, rgba(7, 20, 46, 0.28) 72%, rgba(7, 20, 46, 0) 100%)",
            }}
          />

          <div className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-[#07142E]/65 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-white backdrop-blur-md">
            <Sparkles className="h-3 w-3 text-[#8BB1FF]" />
            AI Generated
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductSection({
  products,
  totalCount,
  query,
  filter,
  saving,
  onQueryChange,
  onFilterChange,
  onCreate,
  onEdit,
  onStatusChange,
  onOnlineToggle,
}: {
  products: Product[];
  totalCount: number;
  query: string;
  filter: "ALL" | ProductStatus;
  saving: boolean;
  onQueryChange: (value: string) => void;
  onFilterChange: (value: "ALL" | ProductStatus) => void;
  onCreate: () => void;
  onEdit: (product: Product) => void;
  onStatusChange: (product: Product, status: ProductStatus) => void;
  onOnlineToggle: (product: Product) => void;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-[#D8E3F2] bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#E1E8F2] bg-gradient-to-r from-[#F7FAFF] to-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold">등록 상품</h2>
          <p className="mt-1 text-xs text-muted-foreground">매장에서 판매하는 상품을 등록하고 상태를 관리합니다. 총 {totalCount}개</p>
        </div>
        <button type="button" onClick={onCreate} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#246BFD] px-3 text-xs font-bold text-white">
          <Plus className="h-3.5 w-3.5" />상품 등록
        </button>
      </div>
      <div className="flex flex-col gap-2 border-b border-[#E5EAF2] bg-[#F4F7FB] p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="상품명 또는 설명 검색"
            className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-[#246BFD]"
          />
        </div>
        <select
          value={filter}
          onChange={(event) => onFilterChange(event.target.value as "ALL" | ProductStatus)}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
        >
          <option value="ALL">전체 상태</option>
          <option value="ACTIVE">판매 가능</option>
          <option value="SOLD_OUT">품절</option>
          <option value="INACTIVE">판매 중지</option>
        </select>
      </div>
      {products.length === 0 ? (
        <EmptyState icon={Package} title="조건에 맞는 상품이 없습니다" description="검색 조건을 바꾸거나 새 상품을 등록해 주세요." />
      ) : (
        <div className="divide-y divide-border">
          {products.map((product) => (
            <div key={product.id} className="grid gap-4 bg-white p-4 transition-colors hover:bg-[#F8FAFD] lg:grid-cols-[1fr_150px_150px_auto] lg:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <ProductImage product={product} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-bold">{product.name}</span>
                    {product.onlineSalesStatus === "ON_SALE" && <Badge variant="info">온라인</Badge>}
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{product.description || "상품 설명 없음"}</p>
                  <div className="mt-1.5 text-xs font-semibold">₩{product.price.toLocaleString()} <span className="ml-2 font-normal text-muted-foreground">재고 {product.stockQuantity}개</span></div>
                </div>
              </div>
              <select
                value={product.status}
                disabled={saving}
                onChange={(event) => onStatusChange(product, event.target.value as ProductStatus)}
                className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-semibold"
              >
                <option value="ACTIVE">판매 가능</option>
                <option value="SOLD_OUT">품절</option>
                <option value="INACTIVE">판매 중지</option>
              </select>
              <button
                type="button"
                onClick={() => onOnlineToggle(product)}
                disabled={saving || (product.onlineSalesStatus === "NOT_REGISTERED" && (product.status !== "ACTIVE" || product.stockQuantity === 0))}
                className={`h-9 rounded-xl px-3 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 ${
                  product.onlineSalesStatus === "ON_SALE"
                    ? "bg-blue-50 text-blue-700"
                    : "border border-border bg-card text-muted-foreground"
                }`}
              >
                {product.onlineSalesStatus === "ON_SALE" ? "온라인 해제" : "온라인 등록"}
              </button>
              <button type="button" onClick={() => onEdit(product)} className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-border px-3 text-xs font-semibold hover:bg-muted">
                <Pencil className="h-3.5 w-3.5" />수정
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function OnlineSection({
  store,
  products,
  onlineProducts,
  saving,
  onStoreToggle,
  onProductToggle,
}: {
  store: Store;
  products: Product[];
  onlineProducts: Product[];
  saving: boolean;
  onStoreToggle: () => void;
  onProductToggle: (product: Product) => void;
}) {
  const isOpen = store.onlineSalesStatus === "OPEN";

  return (
    <div className="space-y-5">
      <section className={`overflow-hidden rounded-3xl border p-5 shadow-sm ${
        isOpen
          ? "border-emerald-200 bg-gradient-to-r from-emerald-50 to-white"
          : "border-[#D8E3F2] bg-gradient-to-r from-[#F4F7FB] to-white"
      }`}>
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isOpen ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}>
              <Power className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black">{isOpen ? "온라인 판매 운영 중" : "온라인 판매가 닫혀 있습니다"}</h2>
                <Badge variant={isOpen ? "positive" : "muted"}>{isOpen ? "OPEN" : "CLOSED"}</Badge>
              </div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {isOpen
                  ? onlineProducts.length > 0
                    ? `현재 ${onlineProducts.length}개 상품이 온라인 판매에 등록되어 있습니다.`
                    : "온라인 판매는 열려 있습니다. 아래에서 고객에게 판매할 상품을 등록해 주세요."
                  : "온라인 판매를 먼저 열고, 아래에서 고객에게 판매할 상품을 선택해 등록하세요."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onStoreToggle}
            disabled={saving}
            className={`h-11 rounded-xl px-5 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40 ${isOpen ? "bg-slate-700" : "bg-[#246BFD]"}`}
          >
            {isOpen ? "온라인 판매 닫기" : "온라인 판매 열기"}
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-[#D8E3F2] bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold">온라인 판매 상품</h2>
            <p className="mt-1 text-xs text-muted-foreground">전체 상품 중 고객에게 온라인으로 노출할 상품만 선택합니다.</p>
          </div>
          <Badge variant="info">{onlineProducts.length}/{products.length}개 등록</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => {
            const registered = product.onlineSalesStatus === "ON_SALE";
            const unavailable = product.status !== "ACTIVE" || product.stockQuantity === 0;
            return (
              <article key={product.id} className={`rounded-2xl border p-4 transition ${
                registered
                  ? "border-[#BFD4FF] bg-[#F1F6FF] shadow-sm"
                  : "border-[#E0E7F0] bg-[#FAFBFD] hover:border-[#C9D6E8]"
              }`}>
                <div className="flex items-start gap-3">
                  <ProductImage product={product} compact />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{product.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">₩{product.price.toLocaleString()} · 재고 {product.stockQuantity}</div>
                  </div>
                  <Badge variant={registered ? "info" : unavailable ? "warning" : "muted"}>
                    {registered ? "등록됨" : unavailable ? "준비 필요" : "미등록"}
                  </Badge>
                </div>
                <button
                  type="button"
                  onClick={() => onProductToggle(product)}
                  disabled={saving || (!registered && unavailable)}
                  className={`mt-4 h-9 w-full rounded-xl text-xs font-bold disabled:opacity-40 ${
                    registered ? "bg-white text-[#1D4ED8] shadow-sm" : "bg-[#246BFD] text-white"
                  }`}
                >
                  {registered ? "온라인 판매 해제" : "온라인 판매 등록"}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function DiscountSection({
  discounts,
  products,
  saving,
  onCreate,
  onStatusChange,
}: {
  discounts: Discount[];
  products: Product[];
  saving: boolean;
  onCreate: () => void;
  onStatusChange: (discount: Discount, status: DiscountStatus) => void;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-[#DED9F2] bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#E7E2F5] bg-gradient-to-r from-[#FAF8FF] to-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold">상품 할인</h2>
          <p className="mt-1 text-xs text-muted-foreground">등록된 상품 하나를 대상으로 기간과 시간대를 설정합니다.</p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          disabled={products.length === 0}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#8B5CF6] px-3 text-xs font-bold text-white disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />할인 등록
        </button>
      </div>
      {discounts.length === 0 ? (
        <EmptyState icon={BadgePercent} title="등록된 할인이 없습니다" description="비수기 시간대나 인기 상품을 위한 할인을 등록해 보세요." />
      ) : (
        <div className="grid gap-3 p-4 lg:grid-cols-2">
          {discounts.map((discount) => (
            <article key={discount.id} className="rounded-2xl border border-[#E7E2F5] bg-[#FCFBFF] p-4 transition hover:border-[#D7CFF0]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-bold">{discount.name}</h3>
                    <Badge variant={discount.status === "ACTIVE" ? "positive" : discount.status === "SCHEDULED" ? "info" : "muted"}>
                      {DISCOUNT_STATUS_LABEL[discount.status]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{discount.product.name}</p>
                </div>
                <div className="shrink-0 text-right text-lg font-black text-[#8B5CF6]">
                  {discount.discountType === "RATE"
                    ? `${discount.discountValue}%`
                    : `₩${discount.discountValue.toLocaleString()}`}
                </div>
              </div>
              <div className="mt-4 grid gap-2 rounded-xl bg-muted/40 p-3 text-xs sm:grid-cols-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDate(discount.startsAt)} ~ {formatDate(discount.endsAt)}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  {discount.dailyStartTime && discount.dailyEndTime
                    ? `${discount.dailyStartTime.slice(0, 5)} ~ ${discount.dailyEndTime.slice(0, 5)}`
                    : "종일 적용"}
                </div>
                {discount.reminderEnabled && (
                  <div className="flex items-center gap-2 text-[#1D4ED8]">
                    <BellRing className="h-3.5 w-3.5" />리마인드 사용
                  </div>
                )}
              </div>
              <DiscountActions discount={discount} saving={saving} onChange={onStatusChange} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function DiscountActions({
  discount,
  saving,
  onChange,
}: {
  discount: Discount;
  saving: boolean;
  onChange: (discount: Discount, status: DiscountStatus) => void;
}) {
  if (discount.status === "ENDED") return null;

  const startsInFuture = new Date(discount.startsAt).getTime() > Date.now();
  return (
    <div className="mt-3 flex justify-end gap-2">
      {discount.status === "DRAFT" && startsInFuture && (
        <ActionButton onClick={() => onChange(discount, "SCHEDULED")} disabled={saving}>예약</ActionButton>
      )}
      {(discount.status === "DRAFT" || discount.status === "PAUSED") && !startsInFuture && (
        <ActionButton onClick={() => onChange(discount, "ACTIVE")} disabled={saving} primary>활성화</ActionButton>
      )}
      {discount.status === "ACTIVE" && (
        <ActionButton onClick={() => onChange(discount, "PAUSED")} disabled={saving}>일시중지</ActionButton>
      )}
      <ActionButton onClick={() => onChange(discount, "ENDED")} disabled={saving} danger>종료</ActionButton>
    </div>
  );
}

function StoreModal({
  open,
  store,
  form,
  setForm,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  store: Store | null;
  form: CreateStorePayload;
  setForm: (form: CreateStorePayload) => void;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  const businessNumberError = !store && form.businessNumber.length > 0 && !isValidBusinessNumber(form.businessNumber)
    ? "사업자등록번호 형식이 올바르지 않습니다."
    : "";
  const invalid = !form.name.trim()
    || !isValidBusinessNumber(form.businessNumber)
    || !form.category.trim()
    || !form.address.trim();

  return (
    <OperationModal
      open={open}
      title={store ? "매장 정보 수정" : "내 매장 등록"}
      description="점주 계정에는 매장 한 곳만 연결됩니다."
      onClose={onClose}
      footer={<ModalActions saving={saving} onClose={onClose} submitLabel={store ? "수정 완료" : "매장 등록"} disabled={invalid} formId="store-form" />}
    >
      <FeedbackBanner error={error} notice="" />
      <form id="store-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <FormField label="매장명" required value={form.name} onChange={(name) => setForm({ ...form, name })} placeholder="매장명을 입력해 주세요" />
        <FormField label="업종" required value={form.category} onChange={(category) => setForm({ ...form, category })} placeholder="예: 카페, 베이커리" />
        <FormField
          label="사업자등록번호"
          required
          value={form.businessNumber}
          onChange={(businessNumber) => setForm({
            ...form,
            businessNumber: formatBusinessNumberInput(businessNumber),
          })}
          placeholder="000-00-00000"
          hint={store ? "사업자등록번호는 등록 후 변경할 수 없습니다." : undefined}
          error={businessNumberError}
          disabled={Boolean(store)}
        />
        <FormField label="전화번호" value={form.phoneNumber} onChange={(phoneNumber) => setForm({ ...form, phoneNumber })} placeholder="02-0000-0000" />
        <div className="sm:col-span-2">
          <FormField label="매장 주소" required value={form.address} onChange={(address) => setForm({ ...form, address })} placeholder="도로명 주소를 입력해 주세요" />
        </div>
      </form>
    </OperationModal>
  );
}

function ProductModal({
  open,
  editingProduct,
  form,
  setForm,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editingProduct: Product | null;
  form: CreateProductPayload;
  setForm: (form: CreateProductPayload) => void;
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  const invalid = !form.name.trim() || form.price <= 0 || form.stockQuantity < 0;
  return (
    <OperationModal
      open={open}
      title={editingProduct ? "상품 정보 수정" : "상품 등록"}
      description="등록한 상품은 매장 상품 목록에 저장되며, 온라인 판매 여부는 별도로 선택합니다."
      onClose={onClose}
      footer={<ModalActions saving={saving} onClose={onClose} submitLabel={editingProduct ? "수정 완료" : "상품 등록"} disabled={invalid} formId="product-form" />}
    >
      <form id="product-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormField label="상품명" required value={form.name} onChange={(name) => setForm({ ...form, name })} placeholder="클럽 샌드위치" />
        </div>
        <FormField label="판매 가격" required type="number" min={1} value={form.price} onChange={(price) => setForm({ ...form, price: Number(price) })} />
        <FormField label="재고 수량" required type="number" min={0} value={form.stockQuantity} onChange={(stockQuantity) => setForm({ ...form, stockQuantity: Number(stockQuantity) })} />
        <div className="sm:col-span-2">
          <FormField label="상품 설명" multiline value={form.description} onChange={(description) => setForm({ ...form, description })} placeholder="상품의 특징과 구성을 입력해 주세요." />
        </div>
        <div className="sm:col-span-2">
          <FormField label="이미지 URL" value={form.imageUrl} onChange={(imageUrl) => setForm({ ...form, imageUrl })} placeholder="https://..." hint="이미지가 없으면 기본 상품 아이콘이 표시됩니다." />
        </div>
      </form>
    </OperationModal>
  );
}

function DiscountModal({
  open,
  products,
  form,
  setForm,
  useDailyTime,
  setUseDailyTime,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  products: Product[];
  form: CreateDiscountPayload;
  setForm: (form: CreateDiscountPayload) => void;
  useDailyTime: boolean;
  setUseDailyTime: (value: boolean) => void;
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  const invalid = !form.name.trim()
    || !form.productId
    || form.discountValue <= 0
    || !form.startsAt
    || !form.endsAt
    || form.endsAt <= form.startsAt
    || (useDailyTime && (!form.dailyStartTime || !form.dailyEndTime || form.dailyEndTime <= form.dailyStartTime));

  return (
    <OperationModal
      open={open}
      title="상품 할인 등록"
      description="할인 하나에는 상품 하나를 연결합니다. 등록 후 예약 또는 활성화해 주세요."
      onClose={onClose}
      width="max-w-2xl"
      footer={<ModalActions saving={saving} onClose={onClose} submitLabel="할인 등록" disabled={invalid} formId="discount-form" />}
    >
      <form id="discount-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormField label="할인명" required value={form.name} onChange={(name) => setForm({ ...form, name })} placeholder="오후 2~5시 아메리카노 할인" />
        </div>
        <div className="sm:col-span-2">
          <SelectField label="대상 상품" required value={form.productId} onChange={(productId) => setForm({ ...form, productId: Number(productId) })}>
            <option value={0}>상품을 선택하세요</option>
            {products.map((product) => <option key={product.id} value={product.id}>{product.name} · ₩{product.price.toLocaleString()}</option>)}
          </SelectField>
        </div>
        <SelectField label="할인 유형" required value={form.discountType} onChange={(discountType) => setForm({ ...form, discountType: discountType as DiscountType })}>
          <option value="RATE">정률 할인(%)</option>
          <option value="FIXED_AMOUNT">정액 할인(원)</option>
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
        <FormField label="시작 일시" required type="datetime-local" value={form.startsAt} onChange={(startsAt) => setForm({ ...form, startsAt })} />
        <FormField label="종료 일시" required type="datetime-local" value={form.endsAt} onChange={(endsAt) => setForm({ ...form, endsAt })} />
        <div className="sm:col-span-2 rounded-2xl border border-border bg-muted/30 p-4">
          <label className="flex cursor-pointer items-center justify-between gap-4">
            <div>
              <span className="block text-xs font-bold">매일 적용 시간 설정</span>
              <span className="mt-1 block text-[11px] text-muted-foreground">설정하지 않으면 할인 기간 동안 종일 적용됩니다.</span>
            </div>
            <input type="checkbox" checked={useDailyTime} onChange={(event) => setUseDailyTime(event.target.checked)} className="h-4 w-4 accent-[#246BFD]" />
          </label>
          {useDailyTime && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <FormField label="시작 시간" type="time" value={form.dailyStartTime ?? ""} onChange={(dailyStartTime) => setForm({ ...form, dailyStartTime })} />
              <FormField label="종료 시간" type="time" value={form.dailyEndTime ?? ""} onChange={(dailyEndTime) => setForm({ ...form, dailyEndTime })} />
            </div>
          )}
        </div>
        <div className="sm:col-span-2">
          <FormField label="할인 설명" multiline value={form.description} onChange={(description) => setForm({ ...form, description })} placeholder="할인의 목적과 적용 내용을 입력해 주세요." />
        </div>
        <label className="sm:col-span-2 flex cursor-pointer items-center gap-3 rounded-2xl border border-border p-4">
          <input
            type="checkbox"
            checked={form.reminderEnabled}
            onChange={(event) => setForm({ ...form, reminderEnabled: event.target.checked })}
            className="h-4 w-4 accent-[#246BFD]"
          />
          <div>
            <span className="block text-xs font-bold">할인 리마인드 사용</span>
            <span className="mt-1 block text-[11px] text-muted-foreground">추후 고객 알림 기능과 연동할 수 있도록 설정을 저장합니다.</span>
          </div>
        </label>
      </form>
    </OperationModal>
  );
}

function ProductImage({ product, compact = false }: { product: Product; compact?: boolean }) {
  const size = compact ? "h-10 w-10 rounded-xl" : "h-14 w-14 rounded-2xl";
  return product.imageUrl ? (
    <img src={product.imageUrl} alt="" className={`${size} shrink-0 object-cover`} />
  ) : (
    <div className={`flex ${size} shrink-0 items-center justify-center bg-gradient-to-br from-[#EAF2FF] to-[#F3EEFF] text-[#246BFD]`}>
      <ImageIcon className={compact ? "h-4 w-4" : "h-5 w-5"} />
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-border px-4 py-3 last:border-r-0">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-black">{value}</div>
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
  icon: typeof StoreIcon;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 min-w-max flex-1 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition ${
        active
          ? "bg-[#EAF2FF] text-[#246BFD] shadow-sm ring-1 ring-[#246BFD]/10"
          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />{children}
    </button>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof StoreIcon;
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

function ActionButton({
  children,
  onClick,
  disabled,
  primary,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`h-8 rounded-lg px-3 text-[11px] font-bold disabled:opacity-50 ${
        primary
          ? "bg-[#246BFD] text-white"
          : danger
            ? "bg-red-50 text-red-700"
            : "border border-border bg-card text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#246BFD]/25 border-t-[#246BFD]" />
        매장 정보를 불러오는 중입니다.
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
