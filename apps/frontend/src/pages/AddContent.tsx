"use client";
import { Hero } from "@/components/shared/Hero.tsx";
import { FilePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useUser } from "@/hooks/use-user.ts";
import { Separator } from "@/components/ui/separator.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ContentFormFields } from "@/components/shared/ContentFormFields.tsx";
import { initialValues, buildContentFormData } from "@/lib/content-form.ts";
import { useContentForm } from "@/hooks/use-content-form.ts";
import { useAuth0 } from "@auth0/auth0-react";

function AddContent() {
    const user = useUser();
    const { values, patch, setSubmitted, errors, hasErrors, formKey, reset } =
        useContentForm(initialValues(user?.id ?? 0));

    const { getAccessTokenSilently } = useAuth0();

    const handleReset = () => reset(initialValues(user!.id));

    const handleSubmit = async () => {
        if (!user) return;
        setSubmitted(true);
        if (hasErrors) return;

        try {
            const formData = buildContentFormData(values);
            const token = await getAccessTokenSilently();
            const res = await fetch("/api/content", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (!res.ok) { toast.error("Error creating content."); return; }
            toast.success("Content created successfully!");
            reset(initialValues(user!.id));
        } catch {
            toast.error("Error creating content.");
        }
    };

    if (!user) return (
        <div className="flex items-center justify-center min-h-screen bg-secondary">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    );

    return (
        <>
            <Hero
                title="Add Content"
                description="Add new content here."
                icon={FilePlus}
            />

            <div className="bg-secondary px-4">
                <Card className="shadow-lg max-w-5xl mx-auto mt-8 mb-8">
                    <div className="px-6">
                        <div className="bg-background py-4 text-center">
                            <h1 className="text-primary text-2xl font-semibold">Add Content</h1>
                        </div>

                        <Separator className="bg-primary" />

                        <ContentFormFields
                            key={formKey}
                            values={values}
                            patch={patch}
                            errors={errors}
                            showLastModified
                        />

                        <div className="flex justify-center gap-4 bg-background py-4">
                            <Button asChild variant="outline" size="lg">
                                <Link to="/files">View Files</Link>
                            </Button>
                            <Button onClick={handleReset} variant="outline" size="lg">
                                Reset
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={hasErrors}
                                className="bg-primary text-background hover:bg-black hover:text-background"
                                variant="outline"
                                size="lg"
                            >
                                Submit
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </>
    );
}

export default AddContent;
