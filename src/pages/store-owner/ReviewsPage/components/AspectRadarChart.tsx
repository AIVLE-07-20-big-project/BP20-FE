import type { AspectStat } from "../api/review";
import { Info } from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const ASPECT_LABELS: Record<string, string> = {
  food: "맛",
  service: "서비스",
  convenience: "편의성",
  price: "가격",
  atmosphere: "분위기",
};

interface AspectRadarChartProps {
  aspectStats: AspectStat[];
}

export default function AspectRadarChart({
  aspectStats,
}: AspectRadarChartProps) {
  const radarData = aspectStats.map((item) => {
    const total = item.positive + item.neutral + item.negative;

    const score =
      total === 0
        ? 0
        : (item.positive * 5 + item.neutral * 3 + item.negative) / total;

    return {
      subject: ASPECT_LABELS[item.aspect] ?? item.aspect,
      score: Number(score.toFixed(1)),
    };
  });

  return (
    <div className="h-full bg-card border border-border rounded-2xl p-5">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-bold">속성별 평점</h3>
        <div className="group relative">
          <button
            type="button"
            className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="속성별 평점 산출 방식"
          >
            <Info className="h-4 w-4" />
          </button>
          <div className="pointer-events-none absolute right-0 top-7 z-10 w-64 rounded-lg bg-slate-800 px-3 py-2 text-xs leading-5 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            <p className="font-semibold">점수 산출 방식</p>
            <p className="mt-0.5 text-slate-200">
              (긍정 × 5 + 중립 × 3 + 부정 × 1) / 해당 속성의 전체 언급 수
            </p>
          </div>
        </div>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        분석된 전체 리뷰 기준
      </p>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="#DDE3EC" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fontSize: 11, fill: "#667085" }}
            />
            <PolarRadiusAxis 
                domain={[0, 5]} 
                tickCount={6} 
                tick={false}
                axisLine={false} 
            />

            <Radar
              name="속성 평점"
              dataKey="score"
              stroke="#246BFD"
              fill="#246BFD"
              fillOpacity={0.2}
              strokeWidth={2}
            />

            <Tooltip formatter={(value: number) => [`${value}점`, "평점"]} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
