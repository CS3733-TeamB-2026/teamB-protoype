import { Pie, PieChart } from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    type ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import type { Employee } from "@/lib/types.ts";

const chartConfig = {
    count: { label: "Employees" },
    underwriter: { label: "Underwriters"},
    businessAnalyst: { label: "Business Analysts"},
    admin: { label: "Administrators"},
} satisfies ChartConfig;

function EmployeeChart() {

    const [employees, setEmployees] = useState([]);
    const { getAccessTokenSilently } = useAuth0();

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

    const counts = employees.reduce<Record<string, number>>((acc, emp: Employee) => {
        acc[emp.persona] = (acc[emp.persona] ?? 0) + 1;
        return acc;
    }, {});

    const chartData = Object.entries(counts).map(([persona, count], i) => ({
        persona,
        count,
        fill: `var(--chart-${i + 1})`,
    }));

    return (
        <Card className="shadow-lg hover:scale-101 transition-transform md:col-span-1 flex flex-col">
            <CardHeader className="items-center pb-0">
                <CardTitle>Employee Department Breakdown</CardTitle>
                <CardDescription>Current headcount by department</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-75"
                >
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
                        <ChartLegend
                            content={<ChartLegendContent nameKey="persona" />}
                            className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
                        />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

export default EmployeeChart;