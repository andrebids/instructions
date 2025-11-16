import React from 'react';
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

export function LocaleSelector() {
  const { i18n } = useTranslation();
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Button
          isIconOnly
          variant="light"
          className="bg-default-100/50 hover:bg-default-200/50"
          aria-label="Change language"
        >
          <span className="text-lg">{currentLanguage.flag}</span>
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Language selection"
        selectedKeys={[i18n.language]}
        selectionMode="single"
        onSelectionChange={(keys) => {
          const selectedKey = Array.from(keys)[0];
          if (selectedKey) {
            handleLanguageChange(selectedKey);
          }
        }}
      >
        {languages.map((lang) => (
          <DropdownItem
            key={lang.code}
            startContent={<span className="text-lg">{lang.flag}</span>}
          >
            {lang.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}

