// Its yelling at you, but it works
// @ts-ignore
export type req = Request<{}, any, any, QueryString.ParsedQs, Record<string, any>>
// @ts-ignore
export type res = Response<any, Record<string, any>, number>