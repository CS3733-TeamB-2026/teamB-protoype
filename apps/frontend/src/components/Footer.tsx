function Footer (){
    return (
        <>
            {/*Footer (Appears on all pages)*/}
            <footer className="shrink-0 bg-primary text-primary-foreground mt-auto py-8 px-6">
                <div className="w-full mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <h3 className="font-bold text-lg">Hanover Content Manager</h3>
                        <p className="text-sm text-primary-foreground/70">&copy; 2026 Team B. All Rights Reserved.</p>
                    </div>
                    <div className="text-center md:text-right">
                        <h3 className="font-bold text-lg">This is a footer</h3>
                        <p className="text-sm text-primary-foreground/70">TODO - add more footer</p>
                    </div>
                </div>
            </footer>
        </>
    )
}
export default Footer;