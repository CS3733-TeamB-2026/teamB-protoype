export class Login {
    public static async queryLoginByUsername(username: string) {
        return {
            "id": 1,
            "username": "admin",
            "password": "admin",
        }
    }
}