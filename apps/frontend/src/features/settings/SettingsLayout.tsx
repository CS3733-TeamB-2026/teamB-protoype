import { Outlet } from "react-router-dom";
import SettingsNav from "./SettingsNav"
import {Separator} from "@/components/ui/separator.tsx";

function SettingsLayout() {
    return (
        <div className="container max-w-5xl py-8 mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-primary">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account and preferences.
                </p>
                <Separator className="bg-primary mt-4" />
            </div>
            <div className="flex gap-8">
                <SettingsNav />
                <div className="flex-1 min-w-0">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}

export default SettingsLayout;