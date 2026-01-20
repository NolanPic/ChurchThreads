import type { Meta, StoryObj } from "@storybook/react";
import Select, { SelectOption } from "../app/components/ui/Select";

const sampleOptions: SelectOption[] = [
  { value: "option1", label: "Option 1" },
  { value: "option2", label: "Option 2" },
  { value: "option3", label: "Option 3" },
  { value: "option4", label: "Option 4" },
  { value: "option5", label: "Very Long Option Name That Should Wrap Nicely" },
];

const feedOptions: SelectOption[] = [
  { value: "general", label: "General" },
  { value: "announcements", label: "Announcements" },
  { value: "prayer-requests", label: "Prayer Requests" },
  { value: "events", label: "Events" },
  { value: "youth", label: "Youth Ministry" },
];

const longTextOptions: SelectOption[] = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium Length Option" },
  {
    value: "long",
    label:
      "This is a very long option name that should definitely be truncated with ellipses",
  },
  {
    value: "extremely-long",
    label:
      "This is an extremely long option name that will definitely be truncated and should show ellipses to indicate there is more text available when you hover over it",
  },
  {
    value: "another-long",
    label:
      "Another very long option to demonstrate the truncation behavior across multiple items in the dropdown list",
  },
];

const meta: Meta<typeof Select> = {
  title: "Components/Select",
  component: Select,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A flexible, accessible dropdown select component with support for validation, helper text, and keyboard navigation. Supports both controlled and uncontrolled modes like React's standard form elements. Follows the same design patterns as the Input component.",
      },
    },
  },
  argTypes: {
    label: {
      control: "text",
      description:
        "The label for the select field (optional - uses placeholder as aria-label if not provided)",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text when no option is selected",
    },
    prependToSelected: {
      control: "text",
      description: "Text to prepend to the selected option (e.g., 'Post in: ')",
    },
    error: {
      control: "text",
      description: "Error message to display",
    },
    helperText: {
      control: "text",
      description: "Helper text to display below the select",
    },
    disabled: {
      control: "boolean",
      description: "Whether the field is disabled",
    },
    value: {
      control: "select",
      options: ["", ...sampleOptions.map((opt) => opt.value)],
      description: "The currently selected value for controlled mode",
    },
    defaultValue: {
      control: "select",
      options: ["", ...sampleOptions.map((opt) => opt.value)],
      description: "The default selected value for uncontrolled mode",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Choose an Option",
    options: sampleOptions,
    placeholder: "Select an option",
  },
};

export const ControlledSelect: Story = {
  args: {
    label: "Controlled Select",
    options: sampleOptions,
    value: "option2",
    placeholder: "Select an option",
  },
};

export const WithHelperText: Story = {
  args: {
    label: "Feed Selection",
    options: feedOptions,
    placeholder: "Choose a feed",
    helperText: "Select the feed where you want to post your message.",
  },
};

export const WithError: Story = {
  args: {
    label: "Category",
    options: sampleOptions,
    placeholder: "Select a category",
    error: "Please select a valid category",
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled Field",
    options: sampleOptions,
    disabled: true,
    placeholder: "This field is disabled",
  },
};

export const WithoutLabel: Story = {
  args: {
    options: sampleOptions,
    placeholder: "Choose an option",
    helperText:
      "Example without a label - uses placeholder as accessibility label",
  },
};

export const WithPrependText: Story = {
  args: {
    label: "Feed Selection",
    options: feedOptions,
    prependToSelected: "Post in: ",
    placeholder: "Choose a feed",
  },
};

export const TextTruncation: Story = {
  render: () => (
    <div style={{ width: "250px" }}>
      <Select
        label="Long Text Options"
        options={longTextOptions}
        prependToSelected="Selected: "
        placeholder="Choose an option with long text"
        helperText="Hover over options to see full text in tooltip"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates text truncation with ellipses for both selected text and dropdown options. Hover over truncated text to see the full content in a tooltip. Container is constrained to 250px width to force truncation.",
      },
    },
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
      <Select
        label="Default State"
        options={sampleOptions}
        placeholder="Select an option"
      />

      <Select
        label="Required Field"
        options={sampleOptions}
        placeholder="This field is required"
      />

      <Select
        label="With Helper Text"
        options={feedOptions}
        placeholder="Choose a feed"
        helperText="Select the feed for your post"
      />

      <Select
        label="Error State"
        options={sampleOptions}
        placeholder="Invalid selection"
        error="Please select a valid option"
      />

      <Select
        label="Disabled State"
        options={sampleOptions}
        placeholder="Cannot select"
        disabled
      />

      <Select label="With Selection" options={sampleOptions} />

      <div style={{ width: "250px" }}>
        <Select
          label="Long Text Truncation"
          options={longTextOptions}
          prependToSelected="Selected: "
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Shows all possible states of the Select component",
      },
    },
  },
};
