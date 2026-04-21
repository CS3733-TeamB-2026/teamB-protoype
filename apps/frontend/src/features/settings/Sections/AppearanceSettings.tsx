import SettingsSection from "../SettingsSection";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "@/context/ThemeProvider"

function AppearanceSettings() {

    const { theme, setTheme } = useTheme();

    return (
        <SettingsSection
            title="Appearance"
            description="Customize how the app looks on your device."
        >
            <Card>
                <CardContent className="py-4 px-6">
                    <div className="space-y-3">
                        <Label className="text-lg text-primary font-medium mb-1">
                            Theme:
                        </Label>
                        <p className="text-muted-foreground">Set the color scheme of the application.</p>
                        <RadioGroup value={theme} onValueChange={setTheme}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="light" id="light" />
                                <Label htmlFor="light">Light</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="dark" id="dark" />
                                <Label htmlFor="dark">Dark</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="system" id="system" />
                                <Label htmlFor="system">System</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </CardContent>
            </Card>
        </SettingsSection>
    )
}

export default AppearanceSettings;