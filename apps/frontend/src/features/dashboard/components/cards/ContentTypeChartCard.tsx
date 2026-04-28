import { useEffect, useMemo, useState } from "react";
import {Bar, BarChart, CartesianGrid, XAxis, YAxis} from "recharts";
import { useAuth0 } from "@auth0/auth0-react";
import {
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import type { ContentItem } from "@/lib/types";
import InfoButton from "@/components/layout/InformationAlert.tsx";
import DashboardCard from "@/features/dashboard/components/cards/DashboardCard.tsx";

const chartConfig = {
    count: { label: "Files" },
} satisfies ChartConfig

// Maps a filename to a human-readable category based on its extension. Returns "Other" for unrecognized types.
function categorize(filename: string) {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "Images";
    if (ext === "pdf") return "PDFs";
    if (["doc", "docx", "md", "txt", "html"].includes(ext)) return "Documents";
    if (["xls", "xlsx", "csv"].includes(ext)) return "Spreadsheets";
    if (["ppt", "pptx"].includes(ext)) return "Presentations";
    if (["mp4", "mov", "webm"].includes(ext)) return "Videos";
    if (["zip", "rar", "7z"].includes(ext)) return "Archives";
    return "Other";
}

/**
 * Dashboard card showing a horizontal bar chart of content file type distribution.
 * Fetches all content items on mount, categorizes each by file extension, and
 * renders bars sorted ascending by count.
 */
function ContentTypeChartCard() {

    const [content, setContent] = useState<ContentItem[]>([]);
    const { getAccessTokenSilently } = useAuth0();

    //Fetch all content
    useEffect(() => {

        const fetchContent = async () => {
            const token = await getAccessTokenSilently();
            const res = await fetch("api/content", {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            setContent(data);
        }
        fetchContent();

    }, [getAccessTokenSilently]);

    //Chart data generation, only recalculated on content change
    const chartData = useMemo(() => {

        //Build file counts
        const counts = content
            .filter(item => {
                //Filter files without extensions and links
                const filename = item.fileURI ?? "";
                return filename.includes(".") && !filename.endsWith(".");
            })
            .reduce<Record<string,number>>((acc, item) => {
            const category = categorize(item.fileURI ?? "");
            acc[category] = (acc[category] ?? 0) + 1; //Add or increment file ext category
            return acc;
        }, {})

        //Convert to array, build chart data types and sort them descending
        const result = Object.entries(counts)
            .map(([type, count], i) => ({
                type,
                count,
                fill: `var(--chart-accent-${(i % 5) + 1})`
            }))
            .sort((a, b) => b.count - a.count);

        console.log("CONTENT LENGTH:", content.length);
        console.log("COUNTS:", counts);
        console.log("CHART DATA:", result);

        return result;

    }, [content]);

    return (
        <DashboardCard
            size="medium"
            borderColor="secondary"
        >
            <CardHeader className="items-center pb-0">
                <CardTitle className="capitalize text-2xl font-semibold">Content Type Breakdown</CardTitle>
                <CardDescription>Current distribution of file types in database.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0 pl-0 pr-4">
                <div className="absolute right-1 top-1 w-8 h-8 cursor-pointer">
                    <InfoButton content={"Shows the current distribution of file types stored in the database."}/>
                </div>
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-75 w-full"
                >
                    {/* Horizontal bar chart */}
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ left:0, right:12 }}
                    >
                        <CartesianGrid horizontal={false} />
                        <YAxis
                            dataKey="type"
                            type="category"
                            tickLine={false}
                            axisLine={false}
                            width={110}
                        />
                        <XAxis type="number" hide />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel/>}
                        />
                        <Bar dataKey="count" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </DashboardCard>
    )

}

export default ContentTypeChartCard;