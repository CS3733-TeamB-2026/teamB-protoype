import {
    Dialog,
    DialogContent, DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { useState } from "react";

type User = {
    id: number;
    firstName: string;
    lastName: string;
    persona: string;
}

type LoginDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onLogin: (user: User) => void;
}

function LoginDialog({ open, onOpenChange, onLogin }: LoginDialogProps) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(""); //For login errors ex. wrong password

    const handleLogin = async () => {
        setError("");
        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        })

        if (res.ok) {
            //Successful login
            const user = await res.json();
            console.log("Logged in: ", user.firstName);
            localStorage.setItem("user", JSON.stringify(user)); //Adds employee data into local storage
            onLogin(user); //Call func to update navbar
            onOpenChange(false);
            //navigates to employee home page
            window.location.href = "/employeehome";
        } else {
            //Unsuccessful login
            const err = await res.json();
            console.log(err);
            setError(err.message || "Login failed");
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="px-5 py-4">
                <DialogHeader>
                    <DialogTitle className="text-lg">Login</DialogTitle>
                    <DialogDescription className="text-sm">Enter your credentials to log in.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <div>
                        <Label className="my-2">Username</Label>
                        <Input className="bg-secondary" placeholder="Enter Username" onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleLogin() }} />
                    </div>
                    <div>
                        <Label className="my-2">Password</Label>
                        <Input className="bg-secondary" placeholder="Enter Password" onChange={(e) => setPassword(e.target.value)}
                               onKeyDown={(e) => {
                                   if (e.key === "Enter") handleLogin()
                               }}
                        />
                    </div>
                    <button className="hover:bg-secondary hover:text-secondary-foreground active:scale-95 transition-all bg-primary text-primary-foreground w-20 mx-auto rounded-lg px-2 py-1" onClick={() => {
                        console.log(username);
                        console.log(password);
                        handleLogin();
                    }}>Sign In</button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default LoginDialog;