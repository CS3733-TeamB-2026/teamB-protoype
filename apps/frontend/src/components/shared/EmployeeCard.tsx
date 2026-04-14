import { Card } from "@/components/ui/card.tsx";
import { Avatar, AvatarFallback } from "@/components/ui/avatar.tsx";

export type EmployeeCardData = {
    id: number;
    firstName: string;
    lastName: string;
    persona: string;
};

interface Props {
    employee: EmployeeCardData;
    /** If true, renders as a compact inline row instead of a padded card */
    compact?: boolean;
}

export function EmployeeCard({ employee, compact = false }: Props) {
    const initials = employee.firstName[0] + employee.lastName[0];

    if (compact) {
        return (
            <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {initials}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                    <p className="font-semibold text-sm leading-none">
                        {employee.firstName} {employee.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{employee.persona}</p>
                </div>
            </div>
        );
    }

    return (
        <Card className="text-left p-4">
            <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                        {initials}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">
                        {employee.firstName} {employee.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">{employee.persona}</p>
                </div>
            </div>
        </Card>
    );
}