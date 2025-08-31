import { GovChat } from "@/components/ui/gov-chat"
import { ChatProvider } from "@/contexts/chat-context"

export function Demo() {
  return (
    <ChatProvider>
      <div className="flex w-screen overflow-x-hidden">
        <GovChat />
      </div>
    </ChatProvider>
  );
}
