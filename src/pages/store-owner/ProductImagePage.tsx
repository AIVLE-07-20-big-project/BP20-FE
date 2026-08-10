import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Upload, Sparkles, Loader2, AlertCircle, Download, ImageIcon, CheckCircle2 } from "lucide-react";
import { PageShell } from "@/shared/components/PageShell";
import { ApiError } from "@/shared/api/apiClient";
import { generateProductImage, getProductImageCategories } from "@/entities/product-image/product-image.api";
import { commerceApi } from "@/features/commerce/api/commerceApi";
import type { Product } from "@/entities/commerce/commerce.types";

export function ProductImagePage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [prompt, setPrompt] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    getProductImageCategories()
      .then(res => {
        setCategories(res.categories);
        if (res.categories.length > 0) setSelectedCategory(res.categories[0]);
      })
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoading(false));

    commerceApi.getProducts()
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    const inputEl = e.target;
    if (selected) {
      setFile(selected);
      setResultUrl(null);
      setError(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(selected));
    }
    inputEl.value = "";
  };

  const handleGenerate = async () => {
    if (!file || !selectedCategory) return;
    setGenerating(true);
    setError(null);
    setApplyError(null);
    setApplySuccess(false);
    try {
      const result = await generateProductImage(file, selectedCategory, prompt);
      setResultUrl(result.imageUrl);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "이미지 생성 중 오류가 발생했습니다.");
      setResultUrl(null);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `상품이미지_${selectedCategory || "생성결과"}.png`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleApplyToProduct = async () => {
    if (!resultUrl || !selectedProductId) return;
    const product = products.find(p => String(p.id) === selectedProductId);
    if (!product) return;

    setApplying(true);
    setApplyError(null);
    setApplySuccess(false);
    try {
      const updated = await commerceApi.updateProduct(product.id, {
        name: product.name,
        description: product.description ?? "",
        price: product.price,
        stockQuantity: product.stockQuantity,
        imageUrl: resultUrl,
      });
      setProducts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
      setApplySuccess(true);
    } catch (err) {
      setApplyError(err instanceof ApiError ? err.message : "상품에 이미지를 저장하는 중 오류가 발생했습니다.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <PageShell
      title="AI 상품 이미지 생성"
      subtitle="온라인 판매에 사용할 상품 사진을 업로드하면 AI가 메뉴에 어울리는 배경을 합성합니다."
      actions={(
        <Link
          to="/store/commerce"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-bold text-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          매장·커머스로 돌아가기
        </Link>
      )}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 왼쪽: 업로드 + 설정 */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold text-sm mb-3">1. 상품 사진 업로드</h3>

          <label
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) {
                setFile(dropped);
                setResultUrl(null);
                setError(null);
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewUrl(URL.createObjectURL(dropped));
              }
            }}
            className="border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-[#246BFD]/50 hover:bg-[#246BFD]/3 transition-colors"
          >
            <input type="file" accept="image/*" className="hidden" onChange={e => void handleFileChange(e)} />
            {previewUrl ? (
              <img src={previewUrl} alt="업로드한 상품 사진" className="max-h-48 rounded-xl object-contain" />
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-[#246BFD]/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-[#246BFD]" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold mb-1">상품 사진을 올려주세요</div>
                  <div className="text-xs text-muted-foreground">JPG, PNG · 최대 10MB</div>
                </div>
              </>
            )}
            <span className="flex items-center gap-1.5 text-xs bg-[#246BFD] text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-[#1D4ED8] transition-colors">
              <Upload className="w-3.5 h-3.5" />
              {previewUrl ? "다른 사진 선택" : "파일 선택"}
            </span>
          </label>

          <h3 className="font-bold text-sm mt-5 mb-3">2. 메뉴 카테고리</h3>
          <input
            list="product-image-category-presets"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            placeholder="메뉴명을 입력하세요 (예: 아메리카노)"
            className="w-full h-10 px-3 text-sm bg-muted rounded-xl border border-border focus:outline-none"
          />
          <datalist id="product-image-category-presets">
            {categories.map(c => (
              <option key={c} value={c} />
            ))}
          </datalist>
          {categoriesLoading && (
            <p className="mt-1.5 text-xs text-muted-foreground">추천 카테고리 불러오는 중...</p>
          )}

          <h3 className="font-bold text-sm mt-5 mb-3">3. 프롬프트 (선택, 비우면 기본값 사용)</h3>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="배경/분위기를 직접 지정하고 싶으면 영어로 입력하세요."
            rows={4}
            className="w-full px-3 py-2 text-sm bg-muted rounded-xl border border-border focus:outline-none resize-none"
          />

          <button
            onClick={() => void handleGenerate()}
            disabled={!file || !selectedCategory || generating}
            className="w-full mt-5 flex items-center justify-center gap-1.5 text-sm bg-[#246BFD] text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? "생성 중... (수 초~수십 초 소요)" : "AI 이미지 생성"}
          </button>

          {error && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* 오른쪽: 결과 */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm">생성 결과</h3>
            {resultUrl && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 text-xs bg-muted text-foreground px-3 py-1.5 rounded-lg font-semibold hover:bg-muted/70 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                다운로드
              </button>
            )}
          </div>

          {!resultUrl && !generating && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                왼쪽에서 사진을 올리고 카테고리를 입력한 뒤 "AI 이미지 생성"을 누르면, 배경이 합성된 결과가 여기에 표시됩니다.
              </p>
            </div>
          )}

          {generating && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Loader2 className="w-8 h-8 text-[#246BFD] animate-spin" />
              <p className="text-sm text-muted-foreground">AI가 이미지를 생성하고 있습니다...</p>
            </div>
          )}

          {resultUrl && !generating && (
            <>
              <img src={resultUrl} alt="AI가 생성한 상품 이미지" className="w-full rounded-xl border border-border" />

              <h3 className="font-bold text-sm mt-5 mb-3">4. 메뉴에 저장</h3>
              <div className="flex items-center gap-2">
                <select
                  value={selectedProductId}
                  onChange={e => {
                    setSelectedProductId(e.target.value);
                    setApplySuccess(false);
                    setApplyError(null);
                  }}
                  className="flex-1 h-10 px-3 text-sm bg-muted rounded-xl border border-border focus:outline-none"
                >
                  <option value="">저장할 상품을 선택하세요</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => void handleApplyToProduct()}
                  disabled={!selectedProductId || applying}
                  className="flex items-center gap-1.5 text-sm bg-[#8B5CF6] text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-[#7C3AED] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  이 상품에 저장
                </button>
              </div>

              {products.length === 0 && (
                <p className="mt-1.5 text-xs text-muted-foreground">등록된 상품이 없습니다. 매장·커머스에서 먼저 상품을 등록해주세요.</p>
              )}

              {applySuccess && (
                <div className="mt-3 bg-[#0E9F6E]/10 border border-[#0E9F6E]/20 rounded-xl p-3 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0E9F6E] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[#0E9F6E]">상품 이미지로 저장했습니다.</p>
                </div>
              )}

              {applyError && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{applyError}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
