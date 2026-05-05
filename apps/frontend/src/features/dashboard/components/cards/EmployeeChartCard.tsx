import { Pie, PieChart, ResponsiveContainer } from "recharts";
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
import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import type { Employee } from "@/lib/types.ts";
import DashboardCard from "@/features/dashboard/components/cards/DashboardCard.tsx";
import InfoButton from "@/components/layout/InformationAlert.tsx";
import {useLocale} from "@/languageSupport/localeContext.tsx";
import {useTranslation} from "@/languageSupport/useTranslation.ts";

// Maps each persona key to a human-readable label for the chart legend and tooltip.
const chartConfig = {
    count: { label: "Employees" },
    underwriter: { label: "Underwriters"},
    businessAnalyst: { label: "Business Analysts"},
    actuarialAnalyst: { label: "Actuarial Analysts"},
    excelOperator: { label: "Excel Operator"},
    businessOps: { label: "Business Ops"},
    admin: { label: "Administrators"},
} satisfies ChartConfig;

/**
 * Dashboard card that displays a pie chart breaking down the current employee
 * headcount by persona (department). Fetches all employees from the API on
 * mount, groups them by persona, and assigns sequential CSS chart color
 * variables to each slice.
 */
function EmployeeChartCard() {
    const { locale } = useLocale();
    const { ts } = useTranslation(locale);
    const [employees, setEmployees] = useState([]);
    const { getAccessTokenSilently } = useAuth0();

    // Fetch the full employee list once on mount using a fresh Auth0 token.
    useEffect(() => {

        const fetchEmployees = async () => {
            const token = await getAccessTokenSilently();
            const res = await fetch("/api/employee/all", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            setEmployees(data);
        }
        fetchEmployees();

    }, [getAccessTokenSilently]);

    // Tally employees per persona to produce { underwriter: 3, admin: 1, ... }.
    const counts = employees.reduce<Record<string, number>>((acc, emp: Employee) => {
        acc[emp.persona] = (acc[emp.persona] ?? 0) + 1;
        return acc;
    }, {});

    // Convert tallies to the shape recharts expects, assigning a CSS color variable per slice.
    const chartData = Object.entries(counts).map(([persona, count], i) => ({
        persona,
        count,
        fill: `var(--chart-${ i === 5 ? 3 : (i % 5) + 1 })`,
    }));

    return (
        <DashboardCard
            size="small"
            borderColor="secondary"
        >
            <CardHeader className="items-center pb-0">
                <CardTitle className="capitalize text-2xl font-semibold">{ts('dashCard.DepartmentBreakdown')}</CardTitle>
                <CardDescription>{ts('dashCard.DepartmentHeadcount')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4 pb-4">
                <div className="absolute right-1 top-1 w-8 h-8 cursor-pointer">
                    <InfoButton content={"Shows the current distribution of employees across departments."}/>
                </div>
                <ChartContainer
                    config={chartConfig}
                    className="flex-1 w-full min-w-0 aspect-square max-h-[200px]"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                            />
                            <Pie
                                data={chartData}
                                dataKey="count"
                                nameKey="persona"
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>
                <div className="flex flex-col gap-0 w-full max-w-[250px]">
                    {chartData.map(({ persona, count, fill }) => (
                        <div key={persona} className="flex items-center gap-2 text-sm">
                            <span className="size-3 rounded-sm shrink-0" style={{ backgroundColor: fill }} />
                            <span>{chartConfig[persona as keyof typeof chartConfig]?.label ?? persona}</span>
                            <span className="ml-auto font-medium">{count}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </DashboardCard>
    );
}

export default EmployeeChartCard;
