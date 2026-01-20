import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "../app/components/ui/Input";

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A flexible, accessible input component with support for validation, helper text, and various input types.",
      },
    },
  },
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "number"],
      description: "The type of input field",
    },
    label: {
      control: "text",
      description: "The label for the input field",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
    error: {
      control: "text",
      description: "Error message to display",
    },
    helperText: {
      control: "text",
      description: "Helper text to display below the input",
    },
    required: {
      control: "boolean",
      description: "Whether the field is required",
    },
    disabled: {
      control: "boolean",
      description: "Whether the field is disabled",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Full Name",
    placeholder: "Enter your full name",
  },
};

export const Required: Story = {
  args: {
    label: "Email Address",
    type: "email",
    placeholder: "you@example.com",
    required: true,
  },
};

export const WithHelperText: Story = {
  args: {
    label: "Username",
    placeholder: "Choose a username",
    helperText:
      "Must be at least 3 characters long and contain only letters, numbers, and underscores.",
  },
};

export const WithError: Story = {
  args: {
    label: "Email",
    type: "email",
    placeholder: "Enter your email",
    error: "Please enter a valid email address",
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled Field",
    placeholder: "This field is disabled",
    disabled: true,
  },
};

export const NumberInput: Story = {
  args: {
    label: "Age",
    type: "number",
    placeholder: "25",
    helperText: "Enter your age in years",
  },
};

export const TextInput: Story = {
  args: {
    label: "Full Name",
    type: "text",
    placeholder: "Enter your full name",
    helperText: "First and last name",
  },
};

// Interactive examples showing different states
export const AllStates: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        width: "400px",
      }}
    >
      <Input label="Default State" placeholder="Normal input" />

      <Input
        label="Required Field"
        placeholder="This field is required"
        required
      />

      <Input
        label="With Helper Text"
        placeholder="Enter some text"
        helperText="This is some helpful information"
      />

      <Input
        label="Error State"
        type="email"
        placeholder="Invalid email"
        error="Please enter a valid email address"
        required
      />

      <Input label="Disabled State" placeholder="Cannot edit this" disabled />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Shows all possible states of the Input component",
      },
    },
  },
};

export const FormExample: Story = {
  render: () => (
    <form
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        width: "400px",
      }}
    >
      <Input label="First Name" placeholder="John" required />

      <Input label="Last Name" placeholder="Doe" required />

      <Input
        label="Email"
        type="email"
        placeholder="john.doe@example.com"
        helperText="We'll never share your email with anyone else"
        required
      />

      <Input
        label="Age"
        type="number"
        placeholder="25"
        helperText="Enter your age in years"
      />
    </form>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Example of how the Input component would be used in a typical form",
      },
    },
  },
};
