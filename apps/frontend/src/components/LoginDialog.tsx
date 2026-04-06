import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {useState} from "react";

type LoginDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function LoginDialog({ open, onOpenChange }: LoginDialogProps) {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        })

        if (res.ok) {
            const user = await res.json();
            console.log("Logged in: ", user);
            onOpenChange(false);
        } else {
            console.log("Login failed");
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Login</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <div>
                        <Label>Username</Label>
                        <Input placeholder="Enter Username" onChange={(e) => setUsername(e.target.value)} />
                    </div>
                    <div>
                        <Label>Password</Label>
                        <Input placeholder="Enter Password" onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <button onClick={() => {
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