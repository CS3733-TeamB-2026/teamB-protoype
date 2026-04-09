import { useSidebar } from "@/components/ui/sidebar.tsx"

function SidebarOverlay() {

    const {open, toggleSidebar} = useSidebar();

    return (
        <div
            className={`fixed inset-0 bg-black/50 z-55 transition-opacity duration-500 ${open ? "opacity-50" : "opacity-0 pointer-events-none"}`}
            onClick={ () => toggleSidebar() }
        />
    )
}

export default SidebarOverlay;