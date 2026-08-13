import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReviewTrend } from "../api/review";

interface ReviewTrendChartProps {
  data: ReviewTrend[];
  isLoading: boolean;
}

function getMondayOfIsoWeek(weekKey: string) {
  const [year, week] = weekKey.split("-").map(Number);
  const januaryFourth = new Date(Date.UTC(year, 0, 4));
  const day = januaryFourth.getUTCDay() || 7;

  januaryFourth.setUTCDate(januaryFourth.getUTCDate() - day + 1 + (week - 1) * 7);
  return januaryFourth;
}

function formatWeekLabel(weekKey: string) {
  const monday = getMondayOfIsoWeek(weekKey);
  return `${monday.getUTCMonth() + 1}/${monday.getUTCDate()}`;
}

export default function ReviewTrendChart({ data, isLoading }: ReviewTrendChartProps) {
  const hasReviewData = data.length > 0;
  const ratingDomain = data.some((trend) => trend.averageRating < 3.5)
    ? [0, 5]
    : [3.5, 5];

  return (
    <div className="h-full bg-card border border-border rounded-2xl p-5">
      <h3 className="font-bold mb-1">리뷰 추이</h3>
      <p className="text-xs text-muted-foreground mb-4">최근 5주</p>

      <div className="h-80">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            리뷰 추이를 불러오는 중입니다.
          </div>
        ) : !hasReviewData ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            최근 5주간 분석된 리뷰가 없습니다.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="reviewAvgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#246BFD" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#246BFD" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#DDE3EC" vertical={false} />
              <XAxis
                dataKey="week"
                tickFormatter={formatWeekLabel}
                tick={{ fontSize: 11, fill: "#667085" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                domain={ratingDomain}
                tick={{ fontSize: 11, fill: "#667085" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#667085" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip labelFormatter={(week) => `${formatWeekLabel(String(week))} 주간`} />
              <Area
                key="area-avg"
                yAxisId="left"
                type="monotone"
                dataKey="averageRating"
                stroke="#246BFD"
                fill="url(#reviewAvgGrad)"
                strokeWidth={2}
                name="평균 평점"
              />
              <Area
                key="area-negative"
                yAxisId="right"
                type="monotone"
                dataKey="negativeReviewCount"
                stroke="#D92D20"
                fill="none"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                name="부정 리뷰 수"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
