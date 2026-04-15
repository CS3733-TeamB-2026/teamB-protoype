
export type EmployeeFormValues = {
    id: number;
    firstName: string;
    lastName: string;
    persona: string;
    username: string;
    password: string;
    email: string;
}

export function initialValues(): EmployeeFormValues {
    return {
        id: -1,
        firstName: "",
        lastName: "",
        persona: "",
        username: "",
        password: "",
        email: "",
    }
}

export function buildEmployeeFormData(values: EmployeeFormValues): FormData {
    const formData = new FormData();

    formData.append("id", values.id.toString());
    formData.append("firstName", values.firstName);
    formData.append("lastName", values.lastName);
    formData.append("persona", values.persona);
    formData.append("username", values.username);
    formData.append("password", values.password);
    formData.append("email", values.email);

    return formData;
}