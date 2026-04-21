import { Outlet } from "react-router-dom";
import SettingsNav from "./SettingsNav"

function SettingsLayout() {
    return (
        <div className="container max-w-5xl py-8 mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account and preferences.
                </p>
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