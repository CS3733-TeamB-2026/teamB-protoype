import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card.tsx";
import { useAvatarUrl } from "@/hooks/use-avatar-url.ts";
import { formatLabel } from "@/lib/utils.ts";
import type { Employee } from "@/lib/types.ts";

interface Props {
    employee: Employee;
    size?: "sm" | "default" | "lg";
}

const sizeClass = {
    sm: "w-8 h-8 text-xs",
    default: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
} as const;

/** Renders an avatar with a hover card showing the employee's name and role. */
export function EmployeeAvatar({ employee, size = "default" }: Props) {
    const avatarUrl = useAvatarUrl(employee?.id, employee?.profilePhotoURI);

    if (!employee) return null;

    const initials = employee.firstName[0] + employee.lastName[0];

    return (
        <HoverCard openDelay={150} closeDelay={100}>
            <HoverCardTrigger asChild>
                <Avatar className={`${sizeClass[size]} cursor-default`}>
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                        {initials}
                    </AvatarFallback>
                </Avatar>
            </HoverCardTrigger>
            <HoverCardContent className="w-52 p-3" side="top">
                <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9 shrink-0">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">
                            {employee.firstName} {employee.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            {formatLabel(employee.persona)}
                        </p>
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}
