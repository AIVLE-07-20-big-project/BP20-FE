import { Loader2, Plus, Trash2, X } from "lucide-react";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { createTestReviews, type TestReviewCreateRequest } from "../api/review";

interface TestReviewFormProps {
  storeId: number;
  onCreated: () => Promise<void>;
}

interface TestReviewDraft extends TestReviewCreateRequest {
  id: number;
}

function currentLocalDateTime() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function createDraft(): TestReviewDraft {
  return {
    id: Date.now() + Math.random(),
    rating: 5,
    content: "",
    reviewedDate: currentLocalDateTime(),
  };
}

export default function TestReviewForm({ storeId, onCreated }: TestReviewFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reviews, setReviews] = useState<TestReviewDraft[]>([createDraft()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const closeForm = () => {
    setIsOpen(false);
    setError(null);
  };

  const updateReview = (id: number, field: keyof TestReviewCreateRequest, value: string | number) => {
    setReviews((current) => current.map((review) => (
      review.id === id ? { ...review, [field]: value } : review
    )));
  };

  const handleJsonImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const parsed: unknown = JSON.parse(await file.text());
      const items = Array.isArray(parsed)
        ? parsed
        : typeof parsed === "object" && parsed !== null && "reviews" in parsed
          ? (parsed as { reviews: unknown }).reviews
          : null;

      if (!Array.isArray(items) || items.length === 0) {
        throw new Error("리뷰 배열이 필요합니다.");
      }

      const importedReviews = items.map((item): TestReviewDraft => {
        if (
          typeof item !== "object" || item === null ||
          typeof (item as { rating?: unknown }).rating !== "number" ||
          typeof (item as { content?: unknown }).content !== "string" ||
          typeof (item as { reviewedDate?: unknown }).reviewedDate !== "string"
        ) {
          throw new Error("리뷰 형식이 올바르지 않습니다.");
        }

        const { rating, content, reviewedDate } = item as TestReviewCreateRequest;
        if (rating < 0.5 || rating > 5 || !content.trim() || Number.isNaN(new Date(reviewedDate).getTime())) {
          throw new Error("평점, 내용, 작성 일시를 확인해 주세요.");
        }

        return { id: Date.now() + Math.random(), rating, content, reviewedDate: reviewedDate.slice(0, 16) };
      });

      setReviews(importedReviews);
      setError(null);
    } catch (importError) {
      console.error("테스트 리뷰 JSON 불러오기에 실패했습니다:", importError);
      setError("JSON 형식을 확인해 주세요. 리뷰 배열과 rating, content, reviewedDate가 필요합니다.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (reviews.some((review) => !review.content.trim())) {
      setError("모든 리뷰 내용을 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createTestReviews(storeId, reviews.map(({ id: _id, content, ...review }) => ({
        ...review,
        content: content.trim(),
      })));
      await onCreated();
      setReviews([createDraft()]);
      setIsOpen(false);
    } catch (requestError) {
      console.error("테스트용 리뷰 등록에 실패했습니다:", requestError);
      setError("테스트용 리뷰를 등록하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        title="테스트용 리뷰 작성"
        aria-label="테스트용 리뷰 작성"
        className="inline-flex rounded-lg border border-dashed border-slate-300 p-1.5 text-slate-500 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onClick={closeForm} role="presentation">
      <form
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-violet-100 bg-white p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="test-review-form-title"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h4 id="test-review-form-title" className="text-base font-bold text-slate-800">테스트용 리뷰 작성</h4>
            <p className="mt-1 text-xs text-violet-700">데모·분석 검증용 입력이며, 실서비스 리뷰가 아닙니다.</p>
          </div>
          <button type="button" onClick={closeForm} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="테스트 리뷰 작성 닫기">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {reviews.map((review, index) => (
            <section key={review.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">리뷰 {index + 1}</span>
                <button type="button" disabled={reviews.length === 1} onClick={() => setReviews((current) => current.filter((item) => item.id !== review.id))} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30" aria-label={`리뷰 ${index + 1} 삭제`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium text-slate-700">
                  평점
                  <select value={review.rating} onChange={(event) => updateReview(review.id, "rating", Number(event.target.value))} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400">
                    {[5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5].map((score) => <option key={score} value={score}>{score}점</option>)}
                  </select>
                </label>
                <label className="text-xs font-medium text-slate-700">
                  작성 일시
                  <input type="datetime-local" value={review.reviewedDate} max={currentLocalDateTime()} onChange={(event) => updateReview(review.id, "reviewedDate", event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400" required />
                </label>
              </div>

              <label className="mt-3 block text-xs font-medium text-slate-700">
                리뷰 내용
                <textarea value={review.content} onChange={(event) => updateReview(review.id, "content", event.target.value)} placeholder="분석할 리뷰 내용을 입력하세요." maxLength={5000} rows={3} className="mt-1 block w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400" required />
              </label>
            </section>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => setReviews((current) => [...current, createDraft()])} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-violet-300 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-50">
            <Plus className="h-3.5 w-3.5" /> 리뷰 추가
          </button>
          <input ref={jsonInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleJsonImport} />
          <button type="button" onClick={() => jsonInputRef.current?.click()} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            JSON 불러오기
          </button>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">배열 또는 {'{ "reviews": [...] }'} 형식의 JSON 파일을 불러올 수 있습니다.</p>

        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={closeForm} className="rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100">취소</button>
          <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-700 disabled:bg-violet-300">
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {reviews.length}건 테스트 리뷰 등록
          </button>
        </div>
      </form>
    </div>
  );
}
