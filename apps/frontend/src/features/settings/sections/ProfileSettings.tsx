import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {useEffect, useState} from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import SettingsSection from "../SettingsSection";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useUser } from "@/context/UserContext";
import {
    Avatar,
    AvatarImage,
    AvatarFallback,
} from "@/components/ui/avatar";
import { useAvatarUrl } from "@/hooks/use-avatar-url";

const profileSchema = z.object({
    firstName: z
        .string()
        .min(1, "First name is required")
        .max(50, "First name is too long"),
    lastName: z
        .string()
        .min(1, "Last name is required")
        .max(50, "Last name is too long"),
});

type ProfileFormValues = z.infer<typeof profileSchema>

function ProfileSettings() {

    const { user, updateUser, uploadProfilePhoto } = useUser();
    const avatarUrl = useAvatarUrl(user?.id, user?.profilePhotoURI);
    const [uploading, setUploading] = useState(false);

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be under 5MB");
            return;
        }

        setUploading(true);
        try {
            await uploadProfilePhoto(file);
            toast.success("Profile photo successfully uploaded!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload photo")
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    }

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
        },
    });

    useEffect(() => {
        if (user) {
            form.reset({
                firstName: user.firstName,
                lastName: user.lastName,
            });
        }
    }, [user, form]);

    const onSubmit = async (values: ProfileFormValues) => {
        try {
            await updateUser(values);
            toast.success("Profile updated");
            form.reset(values); // resets isDirty to false after successful save
        } catch (err) {
            toast.error("Failed to update profile");
            console.error(err);
        }
    };

    return (
        <SettingsSection
            title="Profile"
            description="Update your personal information."
        >

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card>
                        <CardContent className="pt-6 space-y-6">
                            <div className="flex items-center gap-6 pb-2">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={avatarUrl} />
                                    <AvatarFallback className="text-lg">
                                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <h1 className="text-lg font-medium">Profile Photo</h1>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                        id="profile-photo-upload"
                                        disabled={uploading}
                                    />
                                    <Button asChild variant="outline" disabled={uploading}>
                                        <label htmlFor="profile-photo-upload" className="cursor-pointer flex items-center gap-2">
                                            {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                                            {uploading ? "Uploading..." : "Change photo"}
                                        </label>
                                    </Button>
                                    <p className="text-sm text-muted-foreground">
                                        JPG, PNG, or GIF. Max 5MB.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>First name <span className="text-destructive">*</span></FormLabel>
                                            <FormControl>
                                                <Input placeholder="First Name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Last name <span className="text-destructive">*</span></FormLabel>
                                            <FormControl>
                                                <Input placeholder="Last Name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Read-only fields — showing but not editable */}
                            <div className="space-y-2">
                                <FormLabel>Username</FormLabel>
                                <Input value={user?.userName ?? ""} disabled />
                                <FormDescription>
                                    Managed through your Auth0 account.
                                </FormDescription>
                            </div>

                            <div className="space-y-2">
                                <FormLabel>Role</FormLabel>
                                <Input value={user?.persona ?? ""} disabled className="capitalize"/>
                                <FormDescription>
                                    Contact an administrator to change your role.
                                </FormDescription>
                            </div>
                        </CardContent>

                        <CardFooter className="justify-end gap-2 border-t pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={!form.formState.isDirty || form.formState.isSubmitting}
                                onClick={() => form.reset({ firstName: user?.firstName ?? "", lastName: user?.lastName ?? "" })}
                            >
                                Reset
                            </Button>
                            <Button
                                type="submit"
                                disabled={!form.formState.isDirty || form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                                    : "Save changes"}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </Form>
        </SettingsSection>
    );

}

export default ProfileSettings;