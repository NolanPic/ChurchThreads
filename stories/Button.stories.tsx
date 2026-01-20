import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import Button from "../app/components/ui/Button";

type ButtonProps = React.ComponentProps<typeof Button>;

const PlayIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" width="16px" height="16px">
    <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zM6 11.5v-7l5.25 3.5L6 11.5z" />
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" width="16px" height="16px">
    <path d="M8 0L6.59 1.41 12.17 7H0v2h12.17l-5.58 5.59L8 16l8-8z" />
  </svg>
);

const meta: Meta<ButtonProps> = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A versatile button component that can function as either a button or a Next.js Link. Supports icons and is fully accessible.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: "text",
      description: "The content/label of the button",
    },
    icon: {
      control: false,
      description: "Optional icon element to display alongside the text",
    },
    variant: {
      control: "radio",
      options: ["primary", "none"],
      description:
        'Visual style of the button background ("primary" or "none")',
    },
    iconSize: {
      control: { type: "number", min: 12, max: 48, step: 1 },
      description:
        "Width/height (px) applied to the icon without changing hit area",
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
    noBackground: {
      control: "boolean",
      description: "Whether the button has no background",
    },
    as: {
      control: "radio",
      options: ["button", "link"],
      description: "Render as button or Next.js Link",
    },
    href: {
      control: "text",
      description: 'URL for link variant (required when as="link")',
      if: { arg: "as", eq: "link" },
    },
    type: {
      control: "radio",
      options: ["button", "submit", "reset"],
      description: "Button type (only for button variant)",
      if: { arg: "as", neq: "link" },
    },
  },
  args: {
    onClick: () => console.log("Button clicked"),
  },
};

export default meta;
type Story = StoryObj<ButtonProps>;

// Basic stories
export const Default: Story = {
  args: {
    children: "Continue",
  },
};

export const WithIcon: Story = {
  args: {
    children: "Play Video",
    icon: <PlayIcon />,
  },
};

export const IconTrailing: Story = {
  args: {
    children: "Next Step",
    icon: <ArrowIcon />,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Button with an icon that comes after the text. Icons automatically adjust to the correct size (16x16px).",
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    children: "Disabled Button",
    disabled: true,
  },
};

export const DisabledWithIcon: Story = {
  args: {
    children: "Disabled",
    icon: <PlayIcon />,
    disabled: true,
  },
};

// Link variant stories
export const AsLink: Story = {
  args: {
    as: "link",
    href: "/dashboard",
    children: "Go to Dashboard",
  },
  parameters: {
    docs: {
      description: {
        story: "Button rendered as a Next.js Link component for navigation.",
      },
    },
  },
};

export const LinkWithIcon: Story = {
  args: {
    as: "link",
    href: "/profile",
    children: "View Profile",
    icon: <ArrowIcon />,
  },
};

export const DisabledLink: Story = {
  args: {
    as: "link",
    href: "/disabled",
    children: "Disabled Link",
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Links can also be disabled, preventing navigation and applying disabled styling.",
      },
    },
  },
};

// Form button types
export const SubmitButton: Story = {
  args: {
    type: "submit",
    children: "Submit Form",
  },
  parameters: {
    docs: {
      description: {
        story: "Submit button for use in forms.",
      },
    },
  },
};

export const AllVariants: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        gap: "16px",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <Button>Default</Button>
      <Button icon={<PlayIcon />}>With Icon</Button>
      <Button disabled>Disabled</Button>
      <Button as="link" href="/example">
        Link
      </Button>
      <Button as="link" href="/example" icon={<ArrowIcon />}>
        Link with Icon
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Overview of all button variants side by side.",
      },
    },
  },
};

// Icon-only stories

export const IconOnly: Story = {
  args: {
    icon: <PlayIcon />,
    noBackground: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Icon-only button with no background. Focus ring still applies when focused.",
      },
    },
  },
};
