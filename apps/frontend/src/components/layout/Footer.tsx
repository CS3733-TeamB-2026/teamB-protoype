import FacebookIcon from "@/assets/facebook-logo.png";
import InstagramIcon from "@/assets/instagram-icon.png";
import TwitterIcon from "@/assets/x_icon.png";
import { useLocale } from "@/languageSupport/localeContext.tsx";
import { useTranslation } from "@/languageSupport/useTranslation.ts";

function Footer() {
    const { locale } = useLocale();
    const { ts } = useTranslation(locale);

    return (
        <footer
            className="shrink-0 mt-auto px-6 pt-10 pb-6 text-primary-foreground"
            style={{
                background:
                    "linear-gradient(to right, var(--primary-surface-dark), var(--primary-surface), var(--primary-surface-light))",
            }}>
            <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
                <h2 className="text-lg font-semibold tracking-tight">
                    {ts("footer.hanoverContentManager")}
                </h2>
                {/* Divider */}
                <div className="w-80 h-0.5 bg-primary-foreground/20 rounded-full my-4 mb-5" />
                {/* Social Icons */}
                <div className="flex items-center gap-6 mb-6">
                    <a href="https://www.facebook.com/hanoverinsurance/" className="group">
                        <img
                            src={FacebookIcon}
                            alt="facebook"
                            className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition
                            saturate-0 contrast-500 brightness-60"/>
                    </a>
                    <a href="https://x.com/The_Hanover" className="group">
                        <img
                            src={TwitterIcon}
                            alt="twitter"
                            className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition saturate-0"/>
                    </a>
                    <a href="https://www.instagram.com/the.hanover/" className="group">
                        <img
                            src={InstagramIcon}
                            alt="instagram"
                            className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition
                            saturate-0 contrast-500 brightness-60"/>
                    </a>
                </div>
                {/* Info row */}
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 text-xs text-primary-foreground/60">
                    <span>&copy; {ts("footer.rightsReserved")}</span>
                    <span className="hidden md:inline">•</span>
                    <span>{ts("footer.notice")}</span>
                    <span className="hidden md:inline">•</span>
                    <span>{ts("footer.WPI")}</span>
                </div>
            </div>
        </footer>
    );
}

export default Footer;