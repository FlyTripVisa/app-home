import { useState, useEffect, useRef } from "react";
import type { ActionFunctionArgs } from "react-router";
import { Form, useActionData, useNavigation } from "react-router";

// সার্ভার সাইড লজিক: AI মডেল কল করা
export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData();
  const message = formData.get("message") as string;

  // Cloudflare Workers AI এর ডিফল্ট মডেল (Llama 3) ব্যবহার করা
  // @ts-ignore - context.cloudflare.env.AI contains the binding
  const ai = context.cloudflare.env.AI;
  
  const response = await ai.run("@cf/meta/llama-3-8b-instruct", {
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: message },
    ],
  });

  return { 
    userMessage: message, 
    aiResponse: response.response 
  };
}

export default function ChatHome() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const isSubmitting = navigation.state === "submitting";
  const formRef = useRef<HTMLFormElement>(null);

  // নতুন মেসেজ আসলে লিস্টে আপডেট করা
  useEffect(() => {
    if (actionData) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: actionData.userMessage },
        { role: "assistant", content: actionData.aiResponse },
      ]);
      formRef.current?.reset();
    }
  }, [actionData]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      {/* Header */}
      <header className="p-4 border-b border-gray-800 text-center">
        <h1 className="text-xl font-bold text-orange-500">Ostad PomPom AI Chat</h1>
        <p className="text-xs text-gray-400 italic">Powered by Cloudflare Workers AI</p>
      </header>

      {/* Chat History */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center mt-20 text-gray-500">
            <p>কি খবর ওস্তাদ? কিছু একটা লিখে চ্যাট শুরু করুন!</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl ${
              msg.role === "user" ? "bg-orange-600 rounded-tr-none" : "bg-gray-800 rounded-tl-none"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {isSubmitting && (
          <div className="flex justify-start">
            <div className="bg-gray-800 p-3 rounded-2xl animate-pulse">AI চিন্তা করছে...</div>
          </div>
        )}
      </main>

      {/* Input Area */}
      <footer className="p-4 border-t border-gray-800">
        <Form method="post" ref={formRef} className="flex gap-2">
          <input
            type="text"
            name="message"
            required
            placeholder="আপনার প্রশ্ন লিখুন..."
            className="flex-1 bg-gray-800 border-none rounded-full px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 px-6 py-2 rounded-full font-bold transition"
          >
            পাঠান
          </button>
        </Form>
      </footer>
    </div>
  );
}
