import { currentUser } from "@clerk/nextjs/server";
import { HeaderClient } from "./HeaderClient";

export async function Header() {
    const user = await currentUser();
    return (
        <HeaderClient
            isSignedIn={!!user}
            username={user?.username}
        />
    );
}
