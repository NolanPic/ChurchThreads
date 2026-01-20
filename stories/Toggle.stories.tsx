import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import Toggle from "../app/components/ui/Toggle";

const meta: Meta<typeof Toggle> = {
  title: "Components/Toggle",
  component: Toggle,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "An accessible toggle switch component for binary on/off states. Fully keyboard accessible and WCAG compliant.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: "boolean",
      description: "Current toggle state (true = on, false = off)",
    },
    label: {
      control: "text",
      description: "Optional label text displayed next to the toggle",
    },
    disabled: {
      control: "boolean",
      description: "Whether the toggle is disabled",
    },
    onToggle: {
      action: "toggled",
      description: "Callback fired when toggle state changes",
    },
    ariaLabel: {
      control: "text",
      description: "ARIA label for accessibility when no visible label",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component for interactive stories
const ToggleWrapper = (props: Partial<React.ComponentProps<typeof Toggle>>) => {
  const [value, setValue] = useState(props.value || false);
  return (
    <Toggle
      {...props}
      value={value}
      onToggle={(newValue) => {
        setValue(newValue);
        props.onToggle?.(newValue);
      }}
    />
  );
};

// Basic stories
export const Default: Story = {
  render: () => <ToggleWrapper label="Enable notifications" />,
};

export const On: Story = {
  render: () => <ToggleWrapper value={true} label="Push notifications" />,
  parameters: {
    docs: {
      description: {
        story: "Toggle in the 'on' state with accent color.",
      },
    },
  },
};

export const Off: Story = {
  render: () => <ToggleWrapper value={false} label="Email notifications" />,
  parameters: {
    docs: {
      description: {
        story: "Toggle in the 'off' state with default background.",
      },
    },
  },
};

export const NoLabel: Story = {
  render: () => <ToggleWrapper ariaLabel="Enable feature" />,
  parameters: {
    docs: {
      description: {
        story: "Toggle without visible label, using ariaLabel for accessibility.",
      },
    },
  },
};

export const Disabled: Story = {
  render: () => <ToggleWrapper label="Disabled toggle" disabled />,
};

export const DisabledOn: Story = {
  render: () => <ToggleWrapper value={true} label="Disabled (on)" disabled />,
};

// Comprehensive view
export const AllStates: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        padding: "2rem",
      }}
    >
      <ToggleWrapper value={false} label="Off state" />
      <ToggleWrapper value={true} label="On state" />
      <ToggleWrapper value={false} label="Disabled (off)" disabled />
      <ToggleWrapper value={true} label="Disabled (on)" disabled />
      <ToggleWrapper ariaLabel="No visible label" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Shows all possible states of the Toggle component.",
      },
    },
  },
};

// Usage example
export const NotificationSettings: Story = {
  render: () => {
    const [push, setPush] = useState(true);
    const [email, setEmail] = useState(false);
    const [sms, setSms] = useState(false);

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          padding: "1.5rem",
          backgroundColor: "var(--mid2)",
          borderRadius: "12px",
          width: "300px",
        }}
      >
        <h3 style={{ marginBottom: "0.5rem", fontSize: "1.25rem" }}>
          Notification Preferences
        </h3>
        <Toggle value={push} onToggle={setPush} label="Push notifications" />
        <Toggle
          value={email}
          onToggle={setEmail}
          label="Email notifications"
        />
        <Toggle value={sms} onToggle={setSms} label="SMS notifications" />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Example of toggles used in a notification settings panel.",
      },
    },
  },
};
