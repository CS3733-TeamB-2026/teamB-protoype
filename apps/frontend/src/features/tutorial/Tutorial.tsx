import React from "react";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight} from "lucide-react";
import { useUser } from "@/hooks/use-user.ts";
import { slideDecks } from '@/components/ui/slide-deck.tsx';

type SlideKey = keyof typeof slideDecks;
interface Step {
    title: string;
    desc: string;
    image: SlideKey;
    tag?: { label: string; variant: "ui" | "warning" };
}
interface Section {
    label: string;
    title: string;
    steps: Step[];
    adminOnly?: boolean;
}
interface Slide {
    sectionIndex: number;
    sectionLabel: string;
    sectionTitle: string;
    stepIndex: number;
    totalStepsInSection: number;
    step: Step;
    isAdminSection: boolean;
}

const USER_SECTIONS: Section[] = [
    {
        label: "Uploading Documents",
        title: "Uploading Documents",
        steps: [
            { title: "Finding The Upload Page", desc: "From the sidebar, select Upload Document. This opens the document submission form.", image: 'slide1' },
            { title: "Select Your File", desc: "Click to choose a file on your computer, or drag and drop files to upload them!", image: 'slide2' },
            { title: "Fill in Document Information", desc: "While uploading documents, make sure to add all the relevant information for others to use.", image: 'slide3' },
            { title: "Submitting", desc: "Finally, once you're done entering the information, just hit the submit button and you're done!", tag: { label: "Confirmation dialog appears", variant: "ui" }, image: 'slide4'},
            { title: "Bulk Uploading", desc: "Another choice is to upload files in bulk, the process is the same but from here you can upload as many files as you want at once", image: 'slide5' },
        ],
    },
    {
        label: "Changing & Editing Files",
        title: "Changing & Editing Files",
        steps: [
            { title: "Find the Document", desc: "Search or browse the document list and click the document you want to update.", image: 'slide6' },
            { title: "Open the Edit Menu", desc: "On the document detail page, click the Edit button (pencil icon) in the top-right corner.", image: 'slide7' },
            { title: "Editing A File", desc: "Upload a new version of the file or change the title, category, or tags. Both can be done in the same edit session.", image: 'slide8' },
            { title: "Saving Your Changes", desc: "Click Save to commit your edits. The document version history will be updated automatically.", tag: { label: "Note: document must be checked out to you first", variant: "warning" }, image: 'slide9' },
        ],
    },
    {
        label: "Check-In / Check-Out",
        title: "Check-In / Check-Out System",
        steps: [
            { title: "Checking Out", desc: "Files in the system work with a check-in / check-out system. When you check out a document, only you have permissions to change it, however others can still view it. Once you are done editing the file, you'll just check it back in for the next person to use.", image: 'slide10' },
            { title: "Making Edits", desc: "While checked out, download the file, make your changes locally, and re-upload the updated version using the Edit flow. Or alternatively, change document metadata without downloading.", image: 'slide11' },
            { title: "Checking In", desc: "Once finished, click Check In on the document page. This saves your changes and releases the lock for others.", image: 'slide12' },
            { title: "Who Has What?", desc: "A locked document shows a Checked Out badge with the name of the user who currently has it.", tag: { label: "Badge visible on document card", variant: "ui" }, image: 'slide13' },
        ],
    },
    {
        label: "Viewing Documents",
        title: "Viewing Documents",
        steps: [
            { title: "Document Search", desc: "Use the search bar or filter by category to find documents. Results update and highlight as you type.", image: 'SearchTutorial' },
            { title: "Document Filtering", desc: "Alternatively, you can also filter by category. There are simple filters and more advanced content filters", image: 'slide15' },
            { title: "Viewing a Document", desc: "Click any document title to open its detail page, which shows metadata, version history, and a preview where available.", image: 'slide16' },
            { title: "Downloading Files", desc: "Click Download on the document detail page to save a copy locally. No check-out needed for downloading.", image: 'slide17' },
        ],
    },
];

const ADMIN_SECTIONS: Section[] = [
    {
        label: "Adding New Users",
        title: "Adding New Users",
        adminOnly: true,
        steps: [
            { title: "Go to User Management", desc: "From the sidebar, navigate to Admin → User Management.", image: 'slide16' },
            { title: 'Click "Add User"', desc: "Press the + Add User button in the top-right of the user list.", image: 'slide16' },
            { title: "Fill in user details", desc: "Enter the employee's first name, last name, email, and assign a Persona (Standard User or Administrator).", image: 'slide16' },
            { title: "Send invite / set password", desc: "Either send the user an email invite or set a temporary password they'll change on first login.", tag: { label: "Invite email sent automatically", variant: "ui" }, image: 'slide16' },
            { title: "Confirm the new account", desc: "The new user will appear in the user list immediately. You can edit or deactivate their account at any time.", image: 'slide16'},
        ],
    },
    {
        label: "Editing & Managing Users",
        title: "Editing & Managing Users",
        adminOnly: true,
        steps: [
            { title: "Find the user", desc: "In User Management, search by name or email, then click the user's row to open their profile.", image: 'slide16' },
            { title: "Edit user details or role", desc: "Click Edit to change their name, email, or persona. Changing a user's persona takes effect immediately on their next action.", image: 'slide16' },
            { title: "Reset password", desc: "Use the Reset Password option to send the user a reset link or set a new temporary password directly.", image: 'slide16' },
            { title: "Deactivate an account", desc: "Toggle the Active switch to off to disable the account. The user's documents and history are preserved; they simply cannot log in.", tag: { label: "Deactivation also releases all their active check-outs", variant: "warning" }, image: 'slide16' },
        ],
    },
];

function buildSlides(sections: Section[], adminStartIndex: number): Slide[] {
    const slides: Slide[] = [];
    sections.forEach((section, sectionIdx) => {
        section.steps.forEach((step, stepIdx) => {
            slides.push({
                sectionIndex: sectionIdx,
                sectionLabel: section.label,
                sectionTitle: section.title,
                stepIndex: stepIdx,
                totalStepsInSection: section.steps.length,
                step,
                isAdminSection: sectionIdx >= adminStartIndex,
            });
        });
    });
    return slides;
}
function SectionPills({
                          sections,
                          currentSectionIndex,
                          slides,
                          onJump,
                      }: {
    sections: Section[];
    currentSectionIndex: number;
    slides: Slide[];
    adminStartIndex: number;
    onJump: (slideIndex: number) => void;
}) {
    const sectionFirstSlide = (si: number) =>
        slides.findIndex((s) => s.sectionIndex === si);

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {sections.map((section, si) => {
                const isActive = si === currentSectionIndex;
                const isDone = si < currentSectionIndex;

                const activeClass = "bg-accent text-primary-foreground";
                const doneClass = "bg-secondary hover:bg-border";

                return (
                    <button
                        key={si}
                        onClick={() => onJump(sectionFirstSlide(si))}
                        title={section.label}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                            isActive
                                ? activeClass
                                : isDone
                                    ? doneClass
                                    : "bg-border text-muted-foreground hover:bg-secondary"
                        }`}
                    >
                        <span>{section.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

function TutorialPage() {
    const [slideIndex, setSlideIndex] = React.useState(0);

    const { user } = useUser();
    const isAdminUser = user?.persona === "admin";

    const adminStartIndex = USER_SECTIONS.length;
    const sections = isAdminUser
        ? [...USER_SECTIONS, ...ADMIN_SECTIONS]
        : USER_SECTIONS;

    const slides = React.useMemo(
        () => buildSlides(sections, isAdminUser ? adminStartIndex : 0),
        [sections, isAdminUser]
    );

    const current = slides[slideIndex];
    const isFirst = slideIndex === 0;
    const isLast = slideIndex === slides.length - 1;
    const isLastInSection = current.stepIndex === current.totalStepsInSection - 1;
    const sectionProgress = ((current.stepIndex + 1) / current.totalStepsInSection) * 100;

    const progressBar = "bg-accent";

    function goTo(index: number) {
        setSlideIndex(Math.max(0, Math.min(slides.length - 1, index)));
    }

    function handleNext() {
        if (isLast){
            {window.location.href = "/employeehome"}
        }
        else goTo(slideIndex + 1);
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border px-6 py-3">
                <SectionPills
                    sections={sections}
                    currentSectionIndex={current.sectionIndex}
                    slides={slides}
                    adminStartIndex={isAdminUser ? adminStartIndex : Infinity}
                    onJump={goTo}
                />
            </div>

            <div className="w-full px-72 py-6 flex flex-col" style={{ height: 'calc(100vh - 110px)' }}>
                <div className={`border-l-4 pl-4 mb-6`}>
                    <h2 className="text-lg font-bold">{current.sectionTitle}</h2>
                </div>

                <div className="mb-6">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs font-semibold font-mono`}>
                            Step {current.stepIndex + 1} of {current.totalStepsInSection}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {Math.round(sectionProgress)}% of this section
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${progressBar}`}
                            style={{ width: `${sectionProgress}%` }}
                        />
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col min-h-0">
                    <h3 className="text-xl font-bold mb-3">{current.step.title}</h3>
                    <Separator className="mb-4" />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {current.step.desc}
                    </p>
                    <div className="mt-5 rounded-lg border-2 border-dashed border-border bg-secondary overflow-hidden"
                         style={{ maxHeight: '60vh' }}>
                        <img
                            src={slideDecks[current.step.image]}
                            alt={current.step.image}
                            className="w-full h-auto block max-h-[60vh] object-contain object-top"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between mt-6 gap-3">
                    <button
                        onClick={() => goTo(slideIndex - 1)}
                        disabled={isFirst}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold border border-border bg-card hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={16} />
                        Back
                    </button>

                    <span className="text-xs text-muted-foreground font-mono select-none">
                        {slideIndex + 1} / {slides.length}
                    </span>

                    <button
                        onClick={handleNext}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold border border-border bg-card hover:bg-secondary transition-colors`}
                    >
                        {isLast
                            ? "Finish Tutorial"
                            : isLastInSection
                                ? "Next Section"
                                : "Next Step"}
                        {!isLast && <ChevronRight size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TutorialPage;