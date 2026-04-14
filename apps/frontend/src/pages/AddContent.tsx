"use client";
import { useState } from "react";
import { Hero } from "@/components/shared/Hero.tsx";
import { FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useUser } from "@/hooks/use-user.ts";
import { Separator } from "@/components/ui/separator.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ContentFormFields } from "@/components/shared/ContentFormFields.tsx";
import { type ContentFormValues, initialValues, getErrors } from "@/lib/content-form.ts";
import { useAuth0 } from "@auth0/auth0-react"

function AddContent() {
    const user = useUser();
    const [values, setValues] = useState<ContentFormValues>(() => initialValues(user?.id ?? 0));
    const patch = (p: Partial<ContentFormValues>) => setValues(prev => ({ ...prev, ...p }));

    const [submitted, setSubmitted] = useState(false);
    const [formKey, setFormKey] = useState(0);
    const errors = submitted ? getErrors(values) : {};

    const { getAccessTokenSilently } = useAuth0();

    const handleReset = () => {
        setValues(initialValues(user!.id));
        setSubmitted(false);
        setFormKey(k => k + 1);
    };

    // Function to handle post requests to backend
    const handleSubmit = async () => {
        if (!user) return;
        setSubmitted(true);
        if (Object.keys(getErrors(values)).length > 0) return;

        try {
            const formData = new FormData();
            formData.append("name", values.name);
            formData.append("linkURL", values.uploadMode === "url" ? values.linkUrl : "");
            formData.append("ownerID", user.id.toString());
            formData.append("contentType", values.contentType);
            formData.append("status", values.status);

            const lastModifiedDate = values.dateModified ? new Date(values.dateModified) : new Date();
            const [lmh, lmm, lms] = values.lastModifiedTime.split(":").map(Number);
            lastModifiedDate.setHours(lmh, lmm, lms ?? 0, 0);
            formData.append("lastModified", lastModifiedDate.toISOString());

            if (values.dateExpiration) {
                const expDate = new Date(values.dateExpiration);
                expDate.setHours(0, 0, 0, 0);
                formData.append("expiration", expDate.toISOString());
            } else {
                formData.append("expiration", "");
            }
            formData.append("jobPosition", values.jobPosition);
            if (values.uploadMode === "file" && values.file) {
                formData.append("file", values.file);
            }

            const token = await getAccessTokenSilently();
            const res = await fetch("/api/content", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData });
            if (!res.ok) { toast.error("Error creating content."); return; }

            toast.success("Content created successfully!");
            setValues(initialValues(user!.id));
            setSubmitted(false);
        } catch {
            toast.error("Error creating content.");
        }
    };

    if (!user) return null;

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
                            <Button
                                onClick={handleReset}
                                variant="outline"
                                size="lg"
                            >
                                Reset
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={Object.keys(getErrors(values)).length > 0}
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
