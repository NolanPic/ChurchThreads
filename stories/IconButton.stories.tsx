import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import IconButton from "../app/components/ui/IconButton";

type IconButtonProps = React.ComponentProps<typeof IconButton>;

const meta: Meta<IconButtonProps> = {
  title: "Components/IconButton",
  component: IconButton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Circular button for icon-driven actions. Supports label, sizes, and primary styling.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "Text label shown inside the button (optional)",
    },
    icon: {
      control: false,
      description:
        "Icon element or string name for built-in icons (e.g. 'plus', 'pen')",
    },
    variant: {
      control: "radio",
      options: ["default", "primary"],
      description: "Visual style of the button background",
    },
    size: {
      control: { type: "number", min: 40, max: 80, step: 2 },
      description: "Overall circular button size in pixels",
    },
    iconSize: {
      control: { type: "number", min: 12, max: 40, step: 1 },
      description: "Icon width/height in pixels",
    },
    ariaLabel: {
      control: "text",
      description: "Accessible name when no visible label is provided",
    },
    onClick: {
      action: "clicked",
      description: "Click handler for button variant",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
    disabled: {
      control: "boolean",
      description: "Whether the button is disabled",
    },
  },
  args: {
    onClick: () => console.log("IconButton clicked"),
  },
};

export default meta;
type Story = StoryObj<IconButtonProps>;

export const Default: Story = {
  args: {
    label: "Add",
    icon: "plus",
  },
};

export const Primary: Story = {
  args: {
    label: "New",
    icon: "plus",
    variant: "primary",
  },
};

export const CustomSize: Story = {
  args: {
    label: "Edit",
    icon: "pen",
    variant: "primary",
    size: 124,
    iconSize: 64,
  },
};

export const IconOnly: Story = {
  args: {
    icon: "ellipsis",
    ariaLabel: "More options",
  },
  parameters: {
    docs: {
      description: {
        story: "Icon-only button with accessible name via aria-label.",
      },
    },
  },
};
