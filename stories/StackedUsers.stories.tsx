import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import StackedUsers from "../app/components/users/StackedUsers";
import { Id } from "@/convex/_generated/dataModel";

type StackedUsersProps = React.ComponentProps<typeof StackedUsers>;

const meta: Meta<StackedUsersProps> = {
  title: "Components/StackedUsers",
  component: StackedUsers,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Displays a horizontal list of overlapping user avatars with an optional count of remaining users.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<StackedUsersProps>;

const mockUsers = [
  {
    _id: "1" as Id<"users">,
    name: "Alice Johnson",
    image: null,
  },
  {
    _id: "2" as Id<"users">,
    name: "Bob Smith",
    image: null,
  },
  {
    _id: "3" as Id<"users">,
    name: "Charlie Davis",
    image: null,
  },
  {
    _id: "4" as Id<"users">,
    name: "Diana Prince",
    image: null,
  },
  {
    _id: "5" as Id<"users">,
    name: "Ethan Hunt",
    image: null,
  },
];

export const ThreeAvatars: Story = {
  args: {
    users: mockUsers,
    numberOfAvatarsToShow: 3,
    showRemainingCount: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Shows 3 overlapping avatars with a +2 count indicating remaining users.",
      },
    },
  },
};

export const FiveAvatarsNoCount: Story = {
  args: {
    users: mockUsers,
    numberOfAvatarsToShow: 5,
    showRemainingCount: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Shows 5 avatars without displaying the remaining count.",
      },
    },
  },
};

export const TwoAvatarsWithCount: Story = {
  args: {
    users: mockUsers,
    numberOfAvatarsToShow: 2,
    showRemainingCount: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Shows 2 avatars with a +3 count.",
      },
    },
  },
};
