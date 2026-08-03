import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface AspectStatData {
    aspect: string;
    positive: number;
    neutral: number;
    negative: number;
}

interface AspectBarChartProps {
    data: AspectStatData[];
    isLoading: boolean;
    error: string | null;
}

const ASPECT_LABELS: Record<string, string> = {
    food: "음식/맛",
    price: "가격",
    atmosphere: "분위기",
    service: "서비스",
    convenience: "편의성",
}

export default function AspectBarChart({ data, isLoading, error }: AspectBarChartProps) {
    
    const chartData = data.map((item) => ({
        ...item,
        label: ASPECT_LABELS[item.aspect] || item.aspect,
    }));

    if (isLoading)
      return <div className="p-5 text-xs text-muted-foreground">통계 불러오는 중...</div>;
    if (error)
      return <div className="p-5 text-xs text-red-500">{error}</div>

    return (
        <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart   
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#667085" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#667085" }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ paddingTop: "10px" }} />

                    <Bar name="긍정" dataKey="positive" fill="#22c55e" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar name="중립" dataKey="neutral" fill="#94a3b8" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar name="부정" dataKey="negative" fill="#ef4444" stackId="a" radius={[4, 4, 0, 0]} />   
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}