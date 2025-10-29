import {Avatar, Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Badge, Popover, PopoverTrigger, PopoverContent, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter} from "@heroui/react";
import {Icon} from "@iconify/react";
import React from "react";
import {useTheme} from "@heroui/use-theme";
import { useUser } from "../context/UserContext";

export function Header() {
  const {theme, setTheme} = useTheme();
  const [showSearch, setShowSearch] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const { userName, setUserName } = useUser();
  const [tempName, setTempName] = React.useState("");
  
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <header className="flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-3">
        {/* Left side empty (previous search icon removed per request) */}
      </div>
      <div className="flex items-center gap-3">
        <Button 
          isIconOnly 
          variant="light" 
          onClick={toggleTheme}
          className="bg-default-100/50 hover:bg-default-200/50"
          aria-label="Toggle theme"
        >
          <Icon 
            icon={theme === "light" ? "lucide:moon" : "lucide:sun"} 
            className="text-xl" 
          />
        </Button>

        {showSearch ? (
          <Input
            autoFocus
            size="sm"
            className="w-64"
            placeholder="Search..."
            startContent={<Icon icon="lucide:search" className="text-default-400" />}
            onBlur={() => setShowSearch(false)}
          />
        ) : (
          <Button
            isIconOnly
            variant="light"
            aria-label="Open search"
            onClick={() => setShowSearch(true)}
          >
            <Icon icon="lucide:search" className="text-xl" />
          </Button>
        )}

        <Popover 
          placement="bottom-end"
          isOpen={showNotifications}
          onOpenChange={setShowNotifications}
        >
          <PopoverTrigger>
            <Badge content="3" color="danger" shape="circle" placement="top-right">
              <Button 
                isIconOnly 
                variant="light" 
                aria-label="Notifications"
                className="bg-default-100/50 hover:bg-default-200/50"
                onPress={() => {
                  console.log("🔔 Notifications button clicked");
                  setShowNotifications(!showNotifications);
                }}
              >
                <Icon icon="lucide:bell" className="text-xl" />
              </Button>
            </Badge>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 bg-background/70 backdrop-blur-lg border border-default-200/30 rounded-xl shadow-xl">
            <div className="p-4 border-b border-divider/50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Recent Updates</h3>
                <Button 
                  size="sm" 
                  variant="light" 
                  isIconOnly
                  onPress={() => setShowNotifications(false)}
                  className="mr-0"
                  aria-label="Close notifications"
                >
                  <Icon icon="lucide:x" className="text-sm" />
                </Button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              <div className="p-3 space-y-2">
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-default-100/30 transition-colors cursor-pointer">
                  <div className="flex-shrink-0 w-2 h-2 bg-success rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">Design approved</div>
                    <div className="text-xs text-default-500 mt-1">Living room decoration concept approved by client.</div>
                    <div className="text-xs text-default-400 mt-1">2 hours ago</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-default-100/30 transition-colors cursor-pointer">
                  <div className="flex-shrink-0 w-2 h-2 bg-warning rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">Project deadline</div>
                    <div className="text-xs text-default-500 mt-1">Office renovation project due in 3 days.</div>
                    <div className="text-xs text-default-400 mt-1">4 hours ago</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-default-100/30 transition-colors cursor-pointer">
                  <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">New revision</div>
                    <div className="text-xs text-default-500 mt-1">Kitchen design revision requested by client.</div>
                    <div className="text-xs text-default-400 mt-1">1 day ago</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-default-100/30 transition-colors cursor-pointer opacity-60">
                  <div className="flex-shrink-0 w-2 h-2 bg-default-300 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">Project delivered</div>
                    <div className="text-xs text-default-500 mt-1">Bedroom decoration project completed successfully.</div>
                    <div className="text-xs text-default-400 mt-1">2 days ago</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-3 border-t border-divider/50">
              <Button 
                size="sm" 
                variant="light" 
                className="w-full"
                onPress={() => console.log("📋 View all projects clicked")}
              >
                View all projects
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Avatar
              isBordered
              as="button"
              src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
              className="transition-transform"
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="Profile Actions" variant="flat" onAction={(key)=>{
            if (key === 'settings') {
              setTempName(userName || "Christopher");
              setShowSettings(true);
            }
          }}>
            <DropdownItem key="profile" className="h-14 gap-2">
              <p className="font-semibold">Signed in as</p>
              <p className="font-semibold">john@example.com</p>
            </DropdownItem>
            <DropdownItem key="settings">My Settings</DropdownItem>
            <DropdownItem key="team">Team Settings</DropdownItem>
            <DropdownItem key="logout" color="danger">
              Log Out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>

        {/* My Settings Modal */}
        <Modal isOpen={showSettings} onClose={()=>setShowSettings(false)} placement="center" backdrop="blur">
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">My Settings</ModalHeader>
                <ModalBody>
                  <Input
                    label="Your name"
                    placeholder="Enter your name"
                    value={tempName}
                    onValueChange={setTempName}
                  />
                </ModalBody>
                <ModalFooter>
                  <Button variant="flat" onPress={onClose}>Cancel</Button>
                  <Button color="primary" onPress={()=>{ setUserName(tempName?.trim() || "Christopher"); onClose(); }}>Save</Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </header>
  );
}
