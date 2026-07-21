import { Link } from "react-router-dom";

interface NotFoundPageProps {
  returnTo?: string;
  returnLabel?: string;
  fullScreen?: boolean;
}

export function NotFoundPage({
  returnTo = "/",
  returnLabel = "홈으로 돌아가기",
  fullScreen = false,
}: NotFoundPageProps) {
  return (
    <div className={`${fullScreen ? "h-screen" : "h-full"} flex flex-col items-center justify-center bg-background`}>
      <div className="mb-4 text-6xl font-black text-muted-foreground/20">404</div>
      <h1 className="mb-2 text-xl font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="mb-4 text-sm text-muted-foreground">이 페이지는 더 이상 존재하지 않거나 이동되었습니다.</p>
      <Link to={returnTo} className="text-sm font-semibold text-[#246BFD] hover:underline">
        {returnLabel}
      </Link>
    </div>
  );
}
