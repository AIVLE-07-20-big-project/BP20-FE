import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Globe2,
  MapPin,
  Pencil,
  Phone,
  Store as StoreIcon,
} from "lucide-react";
import type {
  Store,
  UpdateStorePayload,
} from "../../../entities/commerce/commerce.types";
import { ApiError } from "../../../shared/api/apiClient";
import { Badge } from "../../../shared/components/Badge";
import {
  formatPhoneNumber,
  isValidPhoneNumber,
} from "../../../shared/lib/phoneNumber";
import { commerceApi } from "../api/commerceApi";
import {
  FeedbackBanner,
  FormField,
  ModalActions,
  OperationModal,
} from "./CommerceUi";

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

const EMPTY_FORM: UpdateStorePayload = {
  name: "",
  category: "",
  address: "",
  phoneNumber: "",
};

export function StoreProfileSection({ isDemo }: { isDemo: boolean }) {
  const [store, setStore] = useState<Store | null>(null);
  const [form, setForm] = useState<UpdateStorePayload>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    if (isDemo) {
      setStore(DEMO_STORE);
      setLoading(false);
      return;
    }

    commerceApi.getStore()
      .then(setStore)
      .catch((requestError: unknown) => {
        if (requestError instanceof ApiError && requestError.status === 404) {
          setStore(null);
          return;
        }
        setError(requestError instanceof Error ? requestError.message : "매장 정보를 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  }, [isDemo]);

  const openEditModal = () => {
    if (!store) return;
    setForm({
      name: store.name,
      category: store.category,
      address: store.address,
      phoneNumber: formatPhoneNumber(store.phoneNumber),
    });
    setModalError("");
    setNotice("");
    setOpen(true);
  };

  const closeEditModal = () => {
    if (saving) return;
    setOpen(false);
    setModalError("");
  };

  const updateForm = (nextForm: UpdateStorePayload) => {
    setForm(nextForm);
    setModalError("");
  };

  const saveStore = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!store) return;

    setSaving(true);
    setModalError("");
    setNotice("");
    try {
      const updated = isDemo
        ? { ...store, ...form, updatedAt: new Date().toISOString() }
        : await commerceApi.updateStore(form);
      setStore(updated);
      setNotice("매장 정보가 수정되었습니다.");
      setOpen(false);
    } catch (requestError) {
      setModalError(toUserMessage(
        requestError instanceof Error ? requestError.message : "매장 정보를 수정하지 못했습니다.",
      ));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="mt-5 rounded-3xl border border-[#D8E3F2] bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#246BFD]/25 border-t-[#246BFD]" />
          매장 정보를 불러오는 중입니다.
        </div>
      </section>
    );
  }

  if (!store) {
    return (
      <section className="mt-5 rounded-3xl border border-[#D8E3F2] bg-gradient-to-r from-[#F5F8FE] to-white p-6 shadow-sm">
        <FeedbackBanner error={error} notice="" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EAF2FF] text-[#246BFD]">
              <StoreIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold">연결된 매장이 없습니다</h2>
              <p className="mt-1 text-xs text-muted-foreground">매장을 등록하면 내 정보에서 상세정보를 관리할 수 있습니다.</p>
            </div>
          </div>
          <Link
            to="/store/commerce"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[#246BFD] px-4 text-xs font-bold text-white"
          >
            매장 등록하기
          </Link>
        </div>
      </section>
    );
  }

  const phoneNumberError = form.phoneNumber.length > 0 && !isValidPhoneNumber(form.phoneNumber)
    ? "전화번호 형식이 올바르지 않습니다."
    : "";

  return (
    <>
      <section className="mt-5 overflow-hidden rounded-3xl border border-[#D8E3F2] bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#E1E8F2] bg-gradient-to-r from-[#F2F7FF] via-white to-[#F7F4FF] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#246BFD] text-white shadow-md shadow-blue-200">
              <StoreIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-black">매장 정보</h2>
                <Badge variant={store.onlineSalesStatus === "OPEN" ? "positive" : "muted"}>
                  {store.onlineSalesStatus === "OPEN" ? "온라인 영업 중" : "온라인 영업 종료"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">계정에 연결된 매장의 상세정보입니다.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={openEditModal}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#CBD8EB] bg-white px-3 text-xs font-bold text-[#36537D] shadow-sm hover:bg-[#F8FAFF]"
          >
            <Pencil className="h-3.5 w-3.5" />
            매장 정보 수정
          </button>
        </div>

        <div className="p-5">
          <FeedbackBanner error={error} notice={notice} />
          <div className="grid gap-3 sm:grid-cols-2">
            <StoreField icon={Building2} label="매장명" value={store.name} />
            <StoreField icon={Globe2} label="업종" value={store.category} />
            <StoreField icon={MapPin} label="매장 주소" value={store.address} wide />
            <StoreField icon={Phone} label="전화번호" value={formatPhoneNumber(store.phoneNumber) || "등록되지 않음"} />
            <StoreField icon={StoreIcon} label="사업자등록번호" value={formatBusinessNumber(store.businessNumber)} />
          </div>
        </div>
      </section>

      <OperationModal
        open={open}
        title="매장 정보 수정"
        description="사업자등록번호를 제외한 매장 기본정보를 수정할 수 있습니다."
        onClose={closeEditModal}
        footer={(
          <ModalActions
            saving={saving}
            onClose={closeEditModal}
            submitLabel="수정 완료"
            disabled={!form.name.trim()
              || !form.category.trim()
              || !form.address.trim()
              || Boolean(phoneNumberError)}
            formId="profile-store-form"
          />
        )}
      >
        <FeedbackBanner error={modalError} notice="" />
        <form id="profile-store-form" onSubmit={saveStore} className="grid gap-4 sm:grid-cols-2">
          <FormField label="매장명" required value={form.name} onChange={(name) => updateForm({ ...form, name })} placeholder="매장명을 입력해 주세요" />
          <FormField label="업종" required value={form.category} onChange={(category) => updateForm({ ...form, category })} placeholder="예: 카페, 베이커리" />
          <FormField
            label="사업자등록번호"
            value={formatBusinessNumber(store.businessNumber)}
            onChange={() => undefined}
            disabled
            hint="사업자등록번호는 등록 후 변경할 수 없습니다."
          />
          <FormField
            label="전화번호"
            type="tel"
            value={form.phoneNumber}
            onChange={(phoneNumber) => updateForm({
              ...form,
              phoneNumber: formatPhoneNumber(phoneNumber),
            })}
            placeholder="숫자만 입력해 주세요"
            error={phoneNumberError}
          />
          <div className="sm:col-span-2">
            <FormField label="매장 주소" required value={form.address} onChange={(address) => updateForm({ ...form, address })} placeholder="도로명 주소를 입력해 주세요" />
          </div>
        </form>
      </OperationModal>
    </>
  );
}

function StoreField({
  icon: Icon,
  label,
  value,
  wide,
}: {
  icon: typeof StoreIcon;
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={`rounded-2xl border border-[#E1E8F2] bg-[#F8FAFD] p-4 ${wide ? "sm:col-span-2" : ""}`}>
      <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-[#5E7DA8]" />
        {label}
      </div>
      <div className="mt-2 text-sm font-bold">{value}</div>
    </div>
  );
}

function formatBusinessNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10
    ? `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
    : value;
}

function toUserMessage(message: string) {
  const separatorIndex = message.indexOf(":");
  if (separatorIndex < 0) return message;

  const fieldName = message.slice(0, separatorIndex).trim();
  return /^[A-Za-z][A-Za-z0-9_.]*$/.test(fieldName)
    ? message.slice(separatorIndex + 1).trim()
    : message;
}
