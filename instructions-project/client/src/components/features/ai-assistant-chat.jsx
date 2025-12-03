import React from "react";
import { Input, Avatar, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

export const AIAssistantChat = ({ onClose, initialMessages }) => {
  const createDefaultMessages = () => ([
    {
      id: "1",
      content: "Hello! I'm Blachere Assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date(Date.now() - 180000),
    },
    {
      id: "2",
      content: "Hi! Can you tell me the dimensions of the IPL123?",
      isUser: true,
      timestamp: new Date(Date.now() - 120000),
    },
    {
      id: "3",
      content: "Of course! The IPL123 has dimensions of 1.20m in height by 4m in width. It's one of our most popular illuminated panels for facade decorations. Would you like more details about its specifications or installation requirements?",
      isUser: false,
      timestamp: new Date(Date.now() - 115000),
    },
    {
      id: "4",
      content: "That's perfect, thanks! What about power consumption?",
      isUser: true,
      timestamp: new Date(Date.now() - 60000),
    },
    {
      id: "5",
      content: "The IPL123 operates at 24V with a power consumption of approximately 96W. It features energy-efficient LED technology, which makes it ideal for extended use during the holiday season. The unit also comes with an IP65 rating, making it suitable for outdoor installations.",
      isUser: false,
      timestamp: new Date(Date.now() - 55000),
    },
  ]);

  const [messages, setMessages] = React.useState(() => initialMessages ?? createDefaultMessages());
  const [inputValue, setInputValue] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  
  const messagesEndRef = React.useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    
    // Simulate AI response after a delay
    setTimeout(() => {
      const aiResponses = [
        "I can help you with that! What else would you like to know?",
        "I understand your question. Here's the information you need.",
        "Interesting! Let's explore more about this topic.",
        "I'm here to help with any questions you have.",
        "Let me look that up for you. One moment, please.",
        "Great question! Let me assist you with that.",
        "I understand. I can provide more details about this.",
        "That's a good point. Would you like me to check the specifications?",
        "Absolutely! I can retrieve that information from our product database."
      ];
      
      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      
      const aiMessage = {
        id: Date.now().toString(),
        content: randomResponse,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };
  
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 p-4 border-b border-divider">
        <div className="flex items-center gap-3">
          <Avatar
            src="https://img.heroui.chat/image/ai?w=200&h=200&u=1"
            className="w-10 h-10"
          />
          <div>
            <h3 className="text-lg font-medium">Blachere Assistant</h3>
            <p className="text-xs text-foreground-400">Online now</p>
          </div>
        </div>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={onClose}
          aria-label="Close"
        >
          <Icon icon="lucide:x" className="text-lg" />
        </Button>
      </div>
      
      {/* Messages */}
      <div className="flex-1 py-4 px-4 overflow-y-auto">
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-xl ${
                  message.isUser
                    ? "bg-primary text-white rounded-tr-none"
                    : "bg-content2 rounded-tl-none"
                }`}
              >
                <div className="text-sm">{message.content}</div>
                <div className={`text-xs mt-1 ${message.isUser ? "text-white/70" : "text-foreground-400"}`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-content2 px-4 py-3 rounded-xl rounded-tl-none max-w-[80%]">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-foreground-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-2 h-2 bg-foreground-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-2 h-2 bg-foreground-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex flex-col gap-2 border-t border-divider p-4">
        <div className="flex w-full gap-2">
          <Input
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-grow"
            size="sm"
            aria-label="Message input"
            endContent={
              <Button
                isIconOnly
                color="primary"
                variant="light"
                size="sm"
                isDisabled={!inputValue.trim() || isLoading}
                onPress={handleSendMessage}
                aria-label="Send message"
                aria-label="Send message"
              >
                <Icon icon="lucide:send" className="text-lg" />
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
};

