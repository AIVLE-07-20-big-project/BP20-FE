import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Upload, Sparkles, Loader2, AlertCircle, Download, ImageIcon } from "lucide-react";
import { PageShell } from "@/shared/components/PageShell";
import { ApiError } from "@/shared/api/apiClient";
import { generateProductImage, getProductImageCategories } from "@/entities/product-image/product-image.api";

export function ProductImagePage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => {
    getProductImageCategories()
      .then(res => {
        setCategories(res.categories);
        if (res.categories.length > 0) setSelectedCategory(res.categories[0]);
      })
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoading(false));
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
    try {
      const blob = await generateProductImage(file, selectedCategory);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "이미지 생성 중 오류가 발생했습니다.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `상품이미지_${selectedCategory || "생성결과"}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

          <h3 className="font-bold text-sm mt-5 mb-3">2. 메뉴 카테고리 선택</h3>
          {categoriesLoading ? (
            <p className="text-xs text-muted-foreground">카테고리 불러오는 중...</p>
          ) : categories.length === 0 ? (
            <p className="text-xs text-muted-foreground">카테고리 목록을 불러오지 못했습니다.</p>
          ) : (
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-muted rounded-xl border border-border focus:outline-none"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

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
                왼쪽에서 사진을 올리고 카테고리를 선택한 뒤 "AI 이미지 생성"을 누르면, 배경이 합성된 결과가 여기에 표시됩니다.
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
            <img src={resultUrl} alt="AI가 생성한 상품 이미지" className="w-full rounded-xl border border-border" />
          )}
        </div>
      </div>
    </PageShell>
  );
}
