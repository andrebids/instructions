import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Textarea } from "@heroui/react";

export default function RequestInfoModal({ isOpen, onOpenChange, product }) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      setMessage(`I'd like to know when ${product?.name || "this product"} is back in stock.`);
    }
  }, [isOpen, product]);

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg" placement="center" hideCloseButton>
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader>Request information</ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <Input label="Name" placeholder="Your name" value={name} onChange={(e)=>setName(e.target.value)} />
                <Input type="email" label="Email" placeholder="you@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
                <Textarea label="Message" value={message} onChange={(e)=>setMessage(e.target.value)} minRows={3} />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button 
                variant="flat" 
                onPress={close}
                className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 shadow-sm"
              >
                Cancel
              </Button>
              <Button color="primary" onPress={() => { /* Stub: send */ console.log("Request info", { productId: product?.id, name, email, message }); close(); }}>Send</Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}


