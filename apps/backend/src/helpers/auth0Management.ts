import { ManagementClient } from 'auth0';

const auth0 = new ManagementClient({
    domain: 'dev-s638hh1d5ry67sv6.us.auth0.com',
    clientId: process.env.AUTH0_MGMT_CLIENT_ID!,
    clientSecret: process.env.AUTH0_MGMT_CLIENT_SECRET!,
})

export const createAuth0User = async (username: string, password: string, email: string) => {
    const user = await auth0.users.create({
        connection: 'Username-Password-Authentication',
        username,
        password,
        email
    })
    console.log("Auth0 response:", JSON.stringify(user, null, 2));
    return user.user_id;
};