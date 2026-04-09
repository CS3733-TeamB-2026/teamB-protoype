// Its yelling at you, but it works
export type req = Request<{}, any, any, QueryString.ParsedQs, Record<string, any>>
export type res = Response<any, Record<string, any>, number>