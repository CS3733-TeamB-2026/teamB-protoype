
export type ServiceReqFormValues = {
    id: number;
    created: string;
    deadline: string;
    type: string;
    assigneeId: number;
    ownerId: number;
}

export function initialValues(): ServiceReqFormValues {
    return {
        id: -1,
        created: "",
        deadline: "",
        type: "",
        assigneeId: -1,
        ownerId: -1
    }
}

export function buildServiceReqFormData(values: ServiceReqFormValues): FormData {
    const formData = new FormData();

    formData.append("id", values.id.toString());
    formData.append("created", values.created);
    formData.append("deadline", values.deadline);
    formData.append("type", values.type);
    formData.append("assignee", values.assigneeId.toString());
    formData.append("owner", values.ownerId.toString());

    return formData;
}