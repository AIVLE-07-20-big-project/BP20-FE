import type { AspectStat } from "../api/review";
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
      <h3 className="font-bold mb-1">속성별 평점</h3>
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
