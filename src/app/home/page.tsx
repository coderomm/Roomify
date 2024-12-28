import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";



export default async function Home(){
  const session =await  getServerSession(authOptions);

  if (!session?.user.id) {
    return <h1>Please Log in....</h1>;
  }
 return <HomeView></HomeView>

}