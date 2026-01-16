import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import MultiSelectComboBox, {
  MultiSelectOption,
} from "../app/components/common/MultiSelectComboBox";

const sampleOptions: MultiSelectOption[] = [
  { value: "option1", text: "Apple" },
  { value: "option2", text: "Banana" },
  { value: "option3", text: "Cherry" },
  { value: "option4", text: "Date" },
  { value: "option5", text: "Elderberry" },
  { value: "option6", text: "Fig" },
  { value: "option7", text: "Grape" },
  { value: "option8", text: "Honeydew" },
];

const tagOptions: MultiSelectOption[] = [
  { value: "javascript", text: "JavaScript" },
  { value: "typescript", text: "TypeScript" },
  { value: "react", text: "React" },
  { value: "vue", text: "Vue" },
  { value: "angular", text: "Angular" },
  { value: "svelte", text: "Svelte" },
  { value: "next", text: "Next.js" },
  { value: "node", text: "Node.js" },
  { value: "python", text: "Python" },
  { value: "django", text: "Django" },
  { value: "flask", text: "Flask" },
  { value: "java", text: "Java" },
  { value: "spring", text: "Spring Boot" },
  { value: "csharp", text: "C#" },
  { value: "dotnet", text: ".NET" },
];

const colorOptions: MultiSelectOption[] = [
  { value: "red", text: "Red", color: "#ff0000" },
  { value: "blue", text: "Blue", color: "#0000ff" },
  { value: "green", text: "Green", color: "#00ff00" },
  { value: "yellow", text: "Yellow", color: "#ffff00" },
  { value: "purple", text: "Purple", color: "#800080" },
  { value: "orange", text: "Orange", color: "#ffa500" },
];

const meta: Meta<typeof MultiSelectComboBox> = {
  title: "Components/MultiSelectComboBox",
  component: MultiSelectComboBox,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A flexible multi-select combobox component with search, filtering, and custom rendering support. Features include: search-as-you-type filtering with prefix match priority, removable selection tags, keyboard navigation, and customizable option/selection rendering.",
      },
    },
  },
  argTypes: {
    label: {
      control: "text",
      description: "The label for the combobox field",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text when no items are selected",
    },
    error: {
      control: "text",
      description: "Error message to display",
    },
    helperText: {
      control: "text",
      description: "Helper text to display below the combobox",
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
    label: "Select Fruits",
    options: sampleOptions,
    placeholder: "Search fruits...",
  },
};

export const WithInitialValues: Story = {
  args: {
    label: "Technologies",
    options: tagOptions,
    initialValues: ["react", "typescript", "next"],
    placeholder: "Search technologies...",
  },
};

export const WithHelperText: Story = {
  args: {
    label: "Programming Languages",
    options: tagOptions,
    placeholder: "Search and select...",
    helperText: "Type to search and select multiple programming languages",
  },
};

export const WithError: Story = {
  args: {
    label: "Required Technologies",
    options: tagOptions,
    placeholder: "Select at least one...",
    error: "Please select at least one technology",
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled Field",
    options: sampleOptions,
    initialValues: ["option1", "option2"],
    disabled: true,
    placeholder: "This field is disabled",
  },
};

export const WithoutLabel: Story = {
  args: {
    options: sampleOptions,
    placeholder: "Search and select...",
    helperText:
      "Example without a label - uses aria-label for accessibility",
  },
};

export const CustomRenderOption: Story = {
  args: {
    label: "Select Colors",
    options: colorOptions,
    placeholder: "Search colors...",
    renderOption: (option) => (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "4px",
            backgroundColor: option.color as string,
            border: "1px solid #ccc",
          }}
        />
        <span>{option.text}</span>
      </div>
    ),
    renderSelection: (option) => (
      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "2px",
            backgroundColor: option.color as string,
          }}
        />
        {option.text}
      </span>
    ),
  },
};

export const ControlledExample: Story = {
  render: () => {
    const [selectedValues, setSelectedValues] = useState<string[]>([
      "javascript",
      "react",
    ]);

    return (
      <div style={{ width: "400px" }}>
        <MultiSelectComboBox
          label="Technologies (Controlled)"
          options={tagOptions}
          initialValues={selectedValues}
          placeholder="Search technologies..."
          onChange={(value, isDeselecting) => {
            if (isDeselecting) {
              setSelectedValues((prev) => prev.filter((v) => v !== value));
            } else {
              setSelectedValues((prev) => [...prev, value]);
            }
          }}
        />
        <div style={{ marginTop: "1rem", color: "#E0E0E0" }}>
          <strong>Selected:</strong> {selectedValues.join(", ") || "None"}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates controlled usage where parent component manages the selected values",
      },
    },
  },
};

export const CustomFilter: Story = {
  args: {
    label: "Exact Match Filter",
    options: tagOptions,
    placeholder: "Type exact name...",
    helperText: "This example uses exact matching instead of substring",
    filter: (option, searchTerm) => {
      if (!searchTerm) return true;
      return option.text.toLowerCase() === searchTerm.toLowerCase();
    },
  },
};

export const SearchBehavior: Story = {
  render: () => (
    <div style={{ width: "400px" }}>
      <MultiSelectComboBox
        label="Search Priority Demo"
        options={[
          { value: "1", text: "Apple Pie" },
          { value: "2", text: "Pineapple" },
          { value: "3", text: "Apple" },
          { value: "4", text: "Crab Apple" },
          { value: "5", text: "Apple Juice" },
          { value: "6", text: "Snapple" },
        ]}
        placeholder="Type 'apple'..."
        helperText="Notice how prefix matches (Apple*) appear before substring matches (*apple*)"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates search prioritization: prefix matches rank higher than substring matches",
      },
    },
  },
};
