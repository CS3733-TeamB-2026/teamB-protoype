import * as p from "../generated/prisma/client";

export class Helper {
    public static personaHelper(_persona: string | null): p.Persona | null {
        if (_persona == "underwriter") {
            return p.Persona.underwriter
        } else if (_persona == "businessAnalyst") {
            return p.Persona.businessAnalyst
        } else if (_persona == "admin") {
            return p.Persona.admin
        } else {
            return null
            //TODO: figure out a default return
        }

    }

    public static statusHelper(_status: string | null): p.Status {
        if (_status == "new") {
            return p.Status.new
        } else if (_status == "inProgress") {
            return p.Status.inProgress
        } else if (_status == "complete") {
            return p.Status.complete
        } else {
            return p.Status.new
            //TODO: figure out a default return
        }

    }
}