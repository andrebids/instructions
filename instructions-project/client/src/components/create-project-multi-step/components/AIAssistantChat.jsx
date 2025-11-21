import React from "react";
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Input,
    Button,
    Avatar,
    ScrollShadow,
} from "@heroui/react";
import { Icon } from "@iconify/react";

export function AIAssistantChat({ isOpen, onClose }) {
    const [messages, setMessages] = React.useState([
        {
            id: 1,
            role: "assistant",
            content: "Olá! Em que posso ajudar?",
            timestamp: new Date(),
        },
    ]);
    const [inputValue, setInputValue] = React.useState("");
    const messagesEndRef = React.useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    React.useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const newMessage = {
            id: Date.now(),
            role: "user",
            content: inputValue,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newMessage]);
        setInputValue("");

        // Simulate AI response (placeholder for now)
        // setTimeout(() => {
        //   setMessages((prev) => [
        //     ...prev,
        //     {
        //       id: Date.now() + 1,
        //       role: "assistant",
        //       content: "I'm just a demo for now, but I'm listening!",
        //       timestamp: new Date(),
        //     },
        //   ]);
        // }, 1000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] shadow-2xl">
            <Card className="h-[500px] max-h-[80vh] flex flex-col border border-default-200">
                <CardHeader className="flex justify-between items-center px-4 py-3 border-b border-default-100 bg-default-50">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-gradient-to-tr from-primary-500 to-secondary-500 rounded-lg">
                            <Icon icon="lucide:sparkles" className="text-white w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-default-900">AI Assistant</h3>
                            <p className="text-xs text-default-500">Logo Design Helper</p>
                        </div>
                    </div>
                    <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        onPress={onClose}
                        className="text-default-500 hover:text-default-900"
                    >
                        <Icon icon="lucide:x" className="w-5 h-5" />
                    </Button>
                </CardHeader>

                <CardBody className="p-0 overflow-hidden flex-1 relative">
                    <ScrollShadow className="h-full p-4 space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"
                                    }`}
                            >
                                <Avatar
                                    size="sm"
                                    src={msg.role === "assistant" ? undefined : undefined} // Add user avatar if available
                                    icon={
                                        msg.role === "assistant" ? (
                                            <Icon icon="lucide:sparkles" className="text-white w-4 h-4" />
                                        ) : (
                                            <Icon icon="lucide:user" className="text-default-500 w-4 h-4" />
                                        )
                                    }
                                    classNames={{
                                        base: msg.role === "assistant"
                                            ? "bg-gradient-to-tr from-primary-500 to-secondary-500"
                                            : "bg-default-200",
                                    }}
                                />
                                <div
                                    className={`flex flex-col max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"
                                        }`}
                                >
                                    <div
                                        className={`px-4 py-2 rounded-2xl text-sm ${msg.role === "user"
                                                ? "bg-primary text-white rounded-tr-none"
                                                : "bg-default-100 text-default-900 rounded-tl-none"
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                    <span className="text-[10px] text-default-400 mt-1 px-1">
                                        {msg.timestamp.toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </ScrollShadow>
                </CardBody>

                <CardFooter className="p-3 border-t border-default-100 bg-white">
                    <form
                        className="flex w-full gap-2 items-center"
                        onSubmit={handleSendMessage}
                    >
                        <Input
                            placeholder="Type a message..."
                            size="sm"
                            variant="faded"
                            radius="full"
                            value={inputValue}
                            onValueChange={setInputValue}
                            classNames={{
                                inputWrapper: "bg-default-100 hover:bg-default-200",
                            }}
                        />
                        <Button
                            isIconOnly
                            color="primary"
                            size="sm"
                            radius="full"
                            type="submit"
                            isDisabled={!inputValue.trim()}
                            className="bg-gradient-to-tr from-primary-500 to-secondary-500 shadow-md"
                        >
                            <Icon icon="lucide:send" className="w-4 h-4 text-white" />
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    );
}
