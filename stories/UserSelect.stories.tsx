import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import UserSelect, { UserOption } from "../app/components/users/UserSelect";

// Sample user data
const sampleUsers: UserOption[] = [
  {
    _id: "user1" as any,
    name: "Alice Johnson",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
    text: "Alice Johnson",
    value: "user1",
  },
  {
    _id: "user2" as any,
    name: "Bob Smith",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
    text: "Bob Smith",
    value: "user2",
  },
  {
    _id: "user3" as any,
    name: "Charlie Brown",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie",
    text: "Charlie Brown",
    value: "user3",
  },
  {
    _id: "user4" as any,
    name: "Diana Prince",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Diana",
    text: "Diana Prince",
    value: "user4",
  },
  {
    _id: "user5" as any,
    name: "Ethan Hunt",
    image: null,
    text: "Ethan Hunt",
    value: "user5",
  },
  {
    _id: "user6" as any,
    name: "Fiona Green",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fiona",
    text: "Fiona Green",
    value: "user6",
  },
  {
    _id: "user7" as any,
    name: "George Wilson",
    image: null,
    text: "George Wilson",
    value: "user7",
  },
  {
    _id: "user8" as any,
    name: "Hannah Lee",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Hannah",
    text: "Hannah Lee",
    value: "user8",
  },
  {
    _id: "user9" as any,
    name: "Ian Malcolm",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ian",
    text: "Ian Malcolm",
    value: "user9",
  },
  {
    _id: "user10" as any,
    name: "Julia Roberts",
    image: null,
    text: "Julia Roberts",
    value: "user10",
  },
];

const meta: Meta<typeof UserSelect> = {
  title: "Components/UserSelect",
  component: UserSelect,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A specialized multi-select component for selecting users with avatars. Built on top of MultiSelectComboBox, it displays user avatars and names in both the dropdown and selected tags. Features alphabetical sorting with relevance-based ordering during search.",
      },
    },
  },
  argTypes: {
    label: {
      control: "text",
      description: "The label for the user select field",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text when no users are selected",
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
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Select Team Members",
    users: sampleUsers,
    placeholder: "Search users...",
  },
};

export const WithInitialValues: Story = {
  args: {
    label: "Assigned Users",
    users: sampleUsers,
    initialValues: ["user1", "user3", "user5"],
    placeholder: "Add more users...",
  },
};

export const WithHelperText: Story = {
  args: {
    label: "Project Collaborators",
    users: sampleUsers,
    placeholder: "Add collaborators...",
    helperText: "Type to search and select multiple users for this project",
  },
};

export const WithError: Story = {
  args: {
    label: "Required Reviewers",
    users: sampleUsers,
    placeholder: "Select reviewers...",
    error: "Please select at least two reviewers",
  },
};

export const Disabled: Story = {
  args: {
    label: "Team Members (Locked)",
    users: sampleUsers,
    initialValues: ["user2", "user4"],
    disabled: true,
    placeholder: "This field is locked",
  },
};

export const WithoutLabel: Story = {
  args: {
    users: sampleUsers,
    placeholder: "Select users...",
    helperText: "Example without a label",
  },
};

export const MixedAvatars: Story = {
  args: {
    label: "Select Users",
    users: sampleUsers,
    placeholder: "Search...",
    helperText:
      "Notice how users without images show initials as fallback avatars",
  },
};

export const ControlledExample: Story = {
  render: () => {
    const [selectedUsers, setSelectedUsers] = useState<string[]>([
      "user1",
      "user2",
    ]);

    return (
      <div style={{ width: "500px" }}>
        <UserSelect
          label="Team Members (Controlled)"
          users={sampleUsers}
          initialValues={selectedUsers}
          placeholder="Add team members..."
          onChange={(userId, isDeselecting) => {
            if (isDeselecting) {
              setSelectedUsers((prev) => prev.filter((id) => id !== userId));
            } else {
              setSelectedUsers((prev) => [...prev, userId]);
            }
          }}
        />
        <div style={{ marginTop: "1rem", color: "#E0E0E0" }}>
          <strong>Selected Users:</strong>{" "}
          {selectedUsers.length > 0
            ? selectedUsers
                .map(
                  (id) =>
                    sampleUsers.find((u) => u.value === id)?.name || "Unknown"
                )
                .join(", ")
            : "None"}
        </div>
        <div style={{ marginTop: "0.5rem", color: "#8387A1" }}>
          <small>Count: {selectedUsers.length}</small>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates controlled usage where parent component manages selected user IDs",
      },
    },
  },
};

