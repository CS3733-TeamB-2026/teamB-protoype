
export type ServiceReqFormValues = {
    id: number;
    created: string;
    deadline: string;
    type: string;
    assignee: number;
    owner: number;
}

export function initialValues(): ServiceReqFormValues {
    return {
        id: -1,
        created: "",
        deadline: "",
        type: "",
        assignee: -1,
        owner: -1
    }
}

export function buildServiceReqFormData(values: ServiceReqFormValues): FormData {
    const formData = new FormData();

    formData.append("id", values.id.toString());
    formData.append("created", values.created);
    formData.append("deadline", values.deadline);
    formData.append("type", values.type);
    formData.append("assignee", values.assignee.toString());
    formData.append("owner", values.owner.toString());

    return formData;
}