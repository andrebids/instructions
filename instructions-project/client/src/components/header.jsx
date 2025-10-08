import {Avatar, Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Badge, Popover, PopoverTrigger, PopoverContent} from "@heroui/react";
import {Icon} from "@iconify/react";
import React from "react";
import {useTheme} from "@heroui/use-theme";

export function Header() {
  const {theme, setTheme} = useTheme();
  const [showSearch, setShowSearch] = React.useState(false);
  
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

        <Popover placement="bottom">
          <PopoverTrigger>
            <Button isIconOnly variant="light" aria-label="Notifications" className="relative">
              <Icon icon="lucide:bell" className="text-xl" />
              <Badge content={3} color="danger" shape="circle" className="absolute -top-1 -right-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 bg-background/70 backdrop-blur-md border border-default-200/40 rounded-xl shadow-md">
            <div className="p-3 font-semibold">Notifications</div>
            <div className="p-3 space-y-3">
              <div className="flex items-start gap-3 p-3 border border-default-200/50 rounded-lg hover:bg-default-100/50 transition-colors">
                <Icon icon="lucide:check-circle-2" className="text-success mt-1" />
                <div>
                  <div className="font-medium">Project approved</div>
                  <div className="text-small text-default-500">Client Fashion Outlet approved the draft.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 border border-default-200/50 rounded-lg hover:bg-default-100/50 transition-colors">
                <Icon icon="lucide:clock" className="text-warning mt-1" />
                <div>
                  <div className="font-medium">Deadline approaching</div>
                  <div className="text-small text-default-500">Website Redesign due in 2 days.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 border border-default-200/50 rounded-lg hover:bg-default-100/50 transition-colors">
                <Icon icon="lucide:message-square" className="text-primary mt-1" />
                <div>
                  <div className="font-medium">New comment</div>
                  <div className="text-small text-default-500">Andre left a note on CRM Integration.</div>
                </div>
              </div>
            </div>
            <div className="px-3 py-2 text-center">
              <Button size="sm" variant="light">View all</Button>
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
          <DropdownMenu aria-label="Profile Actions" variant="flat">
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
      </div>
    </header>
  );
}
