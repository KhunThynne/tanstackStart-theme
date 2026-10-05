import { Button } from "@ui/button";
import {
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@ui/dropdown-menu";
import clsx from "clsx";
import { Sun, Moon, Laptop } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from ".";
import { Switch } from "@ui/switch";
import type { Theme } from ".";

const themes: Array<{
  icon: React.ReactNode;
  name: Theme;
}> = [
  {
    name: "light",
    icon: <HugeiconsIcon icon={Sun} className="mr-2 size-4" />,
  },
  {
    name: "dark",
    icon: <HugeiconsIcon icon={Moon} className="mr-2 size-4" />,
  },
  {
    name: "system",
    icon: <HugeiconsIcon icon={Laptop} className="mr-2 size-4" />,
  },
];

/** Dropdown control for selecting and persisting a theme preference. */
export const ThemeDropdown = ({
  className,
  size = "icon",
  variant = "outline",
  ...button
}: React.ComponentPropsWithRef<typeof Button>) => {
  const { theme, setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant={variant}
            size={size}
            title="Switch theme"
            className={className}
            {...button}
          />
        }
      >
        {theme === "light" ? (
          <HugeiconsIcon icon={Sun} />
        ) : theme === "dark" ? (
          <HugeiconsIcon icon={Moon} />
        ) : (
          <HugeiconsIcon icon={Laptop} />
        )}
        {/* <HugeiconsIcon icon={Sun} className="dark:hidden" />

        <HugeiconsIcon icon={Moon} className="hidden dark:block" /> */}
        <span className="sr-only">Switch theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Select Theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={(value) => setTheme(value as Theme)}
          >
            {themes.map((t) => (
              <DropdownMenuRadioItem
                key={t.name}
                value={t.name}
                className={clsx("text")}
                title={`Switch to ${t.name} mode`}
              >
                {t.icon}
                <span>{t.name.charAt(0).toUpperCase() + t.name.slice(1)}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/** Binary light/dark switch. Choosing a side exits `system` preference. */
export const SwitchTheme = ({
  ...props
}: React.ComponentPropsWithoutRef<typeof Switch>) => {
  const { setTheme, theme } = useTheme();
  return (
    <Switch
      id="switch-theme"
      checked={theme === "dark"}
      onClick={(event) => {
        event.preventDefault();
        setTheme(theme === "dark" ? "light" : "dark");
      }}
      {...props}
    />
  );
};
