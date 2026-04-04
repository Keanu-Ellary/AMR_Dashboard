// testing get users function
import { getUsers } from "@/functions/users/getUsers";

async function test() {
    const res = await getUsers();
    console.log("Response: ", res.body);
}

test();