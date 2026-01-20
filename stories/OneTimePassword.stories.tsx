import type { Meta, StoryObj } from "@storybook/react";
import { OneTimePassword } from "../app/components/ui/OneTimePassword";
import { useState } from "react";

const meta: Meta<typeof OneTimePassword> = {
  title: "Components/OneTimePassword",
  component: OneTimePassword,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A one-time password input component with configurable slots, paste handling, and keyboard navigation. Perfect for verification codes and OTP authentication.",
      },
    },
  },
  argTypes: {
    slots: {
      control: { type: "number", min: 3, max: 10 },
      description: "Number of code slots",
    },
    error: {
      control: "text",
      description: "Error message to display",
    },
    onComplete: {
      action: "completed",
      description: "Called when the complete code is entered",
    },
    onChange: {
      action: "changed",
      description: "Called when the code changes",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    slots: 5,
  },
};

export const SixDigits: Story = {
  args: {
    slots: 6,
  },
};

export const FourDigits: Story = {
  args: {
    slots: 4,
  },
};

export const WithError: Story = {
  args: {
    slots: 6,
    error: "The code is either incorrect or has expired",
  },
};

export const Interactive: Story = {
  render: () => {
    const [code, setCode] = useState("");
    const [isComplete, setIsComplete] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (newCode: string) => {
      setCode(newCode);
      setError("");
      setIsComplete(false);
    };

    const handleComplete = (completeCode: string) => {
      setIsComplete(true);
      if (completeCode !== "12345") {
        setError("Invalid code. Please try again.");
      }
    };

    return (
      <div style={{ width: "400px" }}>
        <OneTimePassword
          slots={5}
          error={error}
          onChange={handleChange}
          onComplete={handleComplete}
        />
        <div
          style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#7077A1" }}
        >
          Current code: {code}
        </div>
        {isComplete && !error && (
          <div
            style={{
              marginTop: "0.5rem",
              fontSize: "0.875rem",
              color: "#F6B17A",
            }}
          >
            ✓ Code verified successfully!
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Interactive example showing real-time validation. Try entering '12345' for success.",
      },
    },
  },
};

export const AllStates: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "3rem",
        width: "400px",
      }}
    >
      <div>
        <h3 style={{ color: "#E0E0E0", marginBottom: "1rem" }}>
          Default State
        </h3>
        <OneTimePassword slots={5} />
      </div>

      <div>
        <h3 style={{ color: "#E0E0E0", marginBottom: "1rem" }}>6-Digit Code</h3>
        <OneTimePassword slots={6} />
      </div>

      <div>
        <h3 style={{ color: "#E0E0E0", marginBottom: "1rem" }}>Error State</h3>
        <OneTimePassword
          slots={6}
          error="The code is either incorrect or has expired"
        />
      </div>

      <div>
        <h3 style={{ color: "#E0E0E0", marginBottom: "1rem" }}>4-Digit PIN</h3>
        <OneTimePassword slots={4} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Shows different configurations of the OneTimePassword component",
      },
    },
  },
};

export const PasteExample: Story = {
  render: () => {
    const [code, setCode] = useState("");

    return (
      <div style={{ width: "400px" }}>
        <OneTimePassword slots={6} onChange={setCode} />
        <div
          style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#7077A1" }}
        >
          Current code: {code}
        </div>
        <div
          style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#8387A1" }}
        >
          You can paste a code or type each digit individually. Use Tab/Arrow
          keys to navigate.
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates paste functionality and keyboard navigation features.",
      },
    },
  },
};
