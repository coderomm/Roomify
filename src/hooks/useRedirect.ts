import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function useRedirect() {
    const session = useSession();
    const router = useRouter();
    // const pathname = usePathname();
    useEffect(() => {
        if (session.status === "unauthenticated") {
            router.push("/");
        }
    }, [session]);
}