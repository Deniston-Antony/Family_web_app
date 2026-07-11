import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChatApp } from "@/components/chat/ChatApp";

export default async function HomePage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return <ChatApp />;
}
