import { currentUser } from "@clerk/nextjs/server";
import { getUserCredits } from "@/app/actions/user";
import { HeaderClient } from "./HeaderClient";

export async function Header() {
    const user = await currentUser();
    const credits = await getUserCredits();

    return (
        <HeaderClient
            isSignedIn={!!user}
            username={user?.username}
            credits={credits}
        />
    );
}
