import FacebookIcon from "@/assets/facebook-logo.png";
import InstagramIcon from "@/assets/instagram-icon.png";
import TwitterIcon from "@/assets/twitter-icon.png";

function Footer (){
    return (
        <>
            {/*Footer (Appears on all pages)*/}
            <footer className="shrink-0 bg-primary text-primary-foreground mt-auto py-8 px-6">
                <div className="w-full mx-auto grid grid-cols-1 md:grid-cols-3 items-center gap-6">
                    <div className="text-center md:text-left justify-self-start">
                        <h3 className="font-bold text-lg">Hanover Content Manager</h3>
                        <p className="text-sm text-primary-foreground/70">&copy; 2026 Team B. All Rights Reserved.</p>
                    </div>
                    <div className="flex items-center justify-center gap-5">
                        <a href="https://www.facebook.com/hanoverinsurance/">
                            <img src={FacebookIcon} alt="facebook" className="w-5 h-5"/>
                        </a>
                        <a href="https://x.com/The_Hanover">
                            <img src={TwitterIcon} alt="twitter" className="w-5 h-5"/>
                        </a>
                        <a href="https://www.instagram.com/the.hanover/">
                            <img src={InstagramIcon} alt="instagram" className="w-5 h-5"/>
                        </a>
                    </div>
                    <div className="text-center md:text-right justify-self-end">
                        <h3 className="font-bold text-lg"></h3>
                        <p className="text-sm text-primary-foreground/70"></p>
                    </div>
                </div>
            </footer>
        </>
    )
}
export default Footer;