import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { TrendingUp, FileText, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import DashboardCard from "@/features/dashboard/components/cards/DashboardCard.tsx";
import InfoButton from "@/components/layout/InformationAlert.tsx";

interface TransactionSummary {
    summary: {
        totalContent: number;
        totalHits: number;
        uniqueOwners: number;
    };
    hitsByOwner: Array<{
        ownerId: number;
        firstName: string;
        lastName: string;
        persona: string;
        totalHits: number;
        contentCount: number;
    }>;
    hitsByPersona: Record<string, number>;
    contentCurrency: Array<{
        ownerId: number;
        ownerName: string;
        ownerPersona: string;
        totalContent: number;
        avgAge: number;
        mostRecentUpdate: string;
        oldestUpdate: string;
    }>;
    expirationStatus: {
        expired: number;
        'expiring-soon': number;
        ok: number;
    };
}

function ReportCard() {
    const [data, setData] = useState<TransactionSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'by-owner' | 'currency' | 'expiration'>('overview');
    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const token = await getAccessTokenSilently();
                const res = await fetch("/api/content/transaction-summary", {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);

                const summary = await res.json();
                setData(summary);
                setError(null);
            } catch (err) {
                console.error("Error fetching transaction summary:", err);
                setError(err instanceof Error ? err.message : "Failed to load report data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [getAccessTokenSilently]);

    if (loading) {
        return (
            <Card className="border-t-secondary border-t-4 shadow-lg md:col-span-2 lg:col-span-3 flex items-center justify-center min-h-96">
                <div className="text-center">
                    <p className="text-muted-foreground">Loading report data...</p>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <DashboardCard
                size="medium"
                borderColor="secondary"
            >
                <CardHeader>
                    <CardTitle className="text-2xl font-semibold">Reports</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-destructive text-sm">
                        <p className="font-semibold mb-2">Unable to load report data</p>
                        <p className="text-xs">{error}</p>
                        <p className="text-xs mt-2 text-muted-foreground">
                            Make sure the backend endpoint <code className="bg-muted px-2 py-1 rounded">/api/reports/transaction-summary</code> is implemented.
                        </p>
                    </div>
                </CardContent>
            </DashboardCard>
        );
    }

    if (!data) return null;

    const expirationData = [
        { name: 'OK', value: data.expirationStatus.ok, color: 'var(--primary)' },
        { name: 'Expiring (7d)', value: data.expirationStatus['expiring-soon'], color: 'var(--accent)' },
        { name: 'Expired', value: data.expirationStatus.expired, color: 'var(--destructive)' },
    ].filter(item => item.value > 0);

    const personaChartData = Object.entries(data.hitsByPersona).map(([persona, hits]) => ({
        name: persona,
        hits,
    }));

    const renderOverview = () => (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="from-background to-primary-surface dark:from-background dark:to-primary-surface p-4 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-foreground">Total Content</p>
                            <p className="text-3xl font-bold text-primary">
                                {data.summary.totalContent}
                            </p>
                        </div>
                        <FileText className="w-10 h-10 text-primary opacity-30" />
                    </div>
                </div>

                <div className="from-background to-accent-dark dark:from-background dark:to-accent-dark p-4 rounded-lg border border-accent/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-foreground">Total Accesses</p>
                            <p className="text-3xl font-bold text-accent">
                                {data.summary.totalHits}
                            </p>
                        </div>
                        <TrendingUp className="w-10 h-10 text-accent opacity-30" />
                    </div>
                </div>

                <div className="from-background to-primary-light dark:from-background dark:to-primary-light p-4 rounded-lg border border-primary-light/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-foreground">Content Owners</p>
                            <p className="text-3xl font-bold text-primary-light">
                                {data.summary.uniqueOwners}
                            </p>
                        </div>
                        <Clock className="w-10 h-10 text-primary-light opacity-30" />
                    </div>
                </div>
            </div>

            {/* Hits by Persona Chart */}
            <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold mb-4">Accesses by Department</h3>
                {personaChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={personaChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 12 }}
                                stroke="var(--muted-foreground)"
                                opacity={0.6}
                            />
                            <YAxis
                                tick={{ fontSize: 12 }}
                                stroke="var(--muted-foreground)"
                                opacity={0.6}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '6px',
                                    color: 'var(--foreground)',
                                }}
                            />
                            <Bar dataKey="hits" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-muted-foreground text-sm py-4">No access data available</p>
                )}
            </div>
        </div>
    );

    const renderByOwner = () => (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold">Accesses by Content Owner</h3>
            {data.hitsByOwner.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-b border-border">
                            <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Owner</th>
                            <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Department</th>
                            <th className="text-right py-3 px-3 font-semibold text-muted-foreground">Content</th>
                            <th className="text-right py-3 px-3 font-semibold text-muted-foreground">Accesses</th>
                        </tr>
                        </thead>
                        <tbody>
                        {data.hitsByOwner.map((owner) => (
                            <tr key={owner.ownerId} className="border-b border-border hover:bg-muted/50 transition-colors">
                                <td className="py-3 px-3">
                                    <p className="font-medium">{owner.firstName} {owner.lastName}</p>
                                </td>
                                <td className="py-3 px-3 text-muted-foreground">{owner.persona}</td>
                                <td className="py-3 px-3 text-right">{owner.contentCount}</td>
                                <td className="py-3 px-3 text-right font-semibold text-accent">
                                    {owner.totalHits}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-muted-foreground text-sm py-4">No owner data available</p>
            )}
        </div>
    );

    const renderCurrency = () => (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold">Content Currency by Owner</h3>
            {data.contentCurrency.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-b border-border">
                            <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Owner</th>
                            <th className="text-right py-3 px-3 font-semibold text-muted-foreground">Content</th>
                            <th className="text-right py-3 px-3 font-semibold text-muted-foreground">Avg Age</th>
                            <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Most Recent</th>
                        </tr>
                        </thead>
                        <tbody>
                        {data.contentCurrency.map((owner) => (
                            <tr key={owner.ownerId} className="border-b border-border hover:bg-muted/50 transition-colors">
                                <td className="py-3 px-3">
                                    <p className="font-medium">{owner.ownerName}</p>
                                    <p className="text-xs text-muted-foreground">{owner.ownerPersona}</p>
                                </td>
                                <td className="py-3 px-3 text-right">{owner.totalContent}</td>
                                <td className="py-3 px-3 text-right">
                                        <span className={`font-semibold ${
                                            owner.avgAge < 30 ? 'text-primary' :
                                                owner.avgAge < 90 ? 'text-accent' :
                                                    'text-destructive'
                                        }`}>
                                            {owner.avgAge}d
                                        </span>
                                </td>
                                <td className="py-3 px-3 text-xs text-muted-foreground">
                                    {new Date(owner.mostRecentUpdate).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-muted-foreground text-sm py-4">No currency data available</p>
            )}
        </div>
    );

    const renderExpiration = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Expiration Pie Chart */}
                <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold mb-4">Expiration Status</h3>
                    {expirationData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={expirationData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value }) => `${name}: ${value}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {expirationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--card)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '6px',
                                        color: 'var(--foreground)',
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-muted-foreground text-sm py-4">No expiration data</p>
                    )}
                </div>

                {/* Status Breakdown */}
                <div className="space-y-3">
                    <div className="bg-primary/10 dark:bg-primary/10 p-4 rounded-lg border border-primary/30">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">No Expiration Issues</span>
                            <span className="text-2xl font-bold text-primary">{data.expirationStatus.ok}</span>
                        </div>
                    </div>

                    <div className="bg-accent/10 dark:bg-accent/10 p-4 rounded-lg border border-accent/30">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Expiring Soon (7 days)</span>
                            <span className="text-2xl font-bold text-accent">{data.expirationStatus['expiring-soon']}</span>
                        </div>
                    </div>

                    <div className="bg-destructive/10 dark:bg-destructive/10 p-4 rounded-lg border border-destructive/30">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Already Expired</span>
                            <span className="text-2xl font-bold text-destructive">{data.expirationStatus.expired}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <DashboardCard
            size="medium"
            borderColor="secondary"
        >
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="capitalize text-2xl font-semibold flex items-center gap-2">
                            Reports & Analytics
                        </CardTitle>
                        <CardDescription>Transaction activity, content currency, and expiration status</CardDescription>
                    </div>
                    <div className="absolute right-1 top-1 w-8 h-8 cursor-pointer">
                        <InfoButton content={"The Overview tab shows the total accesses and content by each department. The By Owner tab shows the accesses and content for each user. The Currency tab shows the age and date of most recently added content. The Expiration tab shows a chart of all expiration status."}/>
                    </div>
                </div>
            </CardHeader>

            {/* Tab Navigation */}
            <div className="flex border-b border-border px-4 gap-1">
                {(['overview', 'by-owner', 'currency', 'expiration'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-3 px-4 text-sm font-medium transition-colors relative ${
                            activeTab === tab
                                ? 'text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {tab === 'overview' && 'Overview'}
                        {tab === 'by-owner' && 'By Owner'}
                        {tab === 'currency' && 'Currency'}
                        {tab === 'expiration' && 'Expiration'}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                ))}
            </div>

            <CardContent className="pt-6">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'by-owner' && renderByOwner()}
                {activeTab === 'currency' && renderCurrency()}
                {activeTab === 'expiration' && renderExpiration()}
            </CardContent>
        </DashboardCard>
    );
}

export default ReportCard;