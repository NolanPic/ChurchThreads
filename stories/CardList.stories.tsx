import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { CardList } from "../app/components/ui/CardList";
import Button from "../app/components/ui/Button";

type CardListProps = React.ComponentProps<typeof CardList<MockUser>>;

interface MockUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

// Generate mock data
const generateMockUsers = (count: number, startId = 0): MockUser[] => {
  return Array.from({ length: count }, (_, i) => ({
    _id: `user-${startId + i}`,
    name: `User ${startId + i + 1}`,
    email: `user${startId + i + 1}@example.com`,
    role: i % 3 === 0 ? "Owner" : "Member",
  }));
};

const meta: Meta<CardListProps> = {
  title: "Components/CardList",
  component: CardList,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A responsive card list component with infinite scroll support. Works with paginated Convex queries.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<CardListProps>;

export const PaginatedData: Story = {
  render: () => {
    const [data, setData] = useState<MockUser[]>(generateMockUsers(12));
    const [status, setStatus] = useState<"CanLoadMore" | "Exhausted">("CanLoadMore");

    const loadMore = (numItems: number) => {
      // Simulate loading more data
      setTimeout(() => {
        const currentLength = data.length;
        const newUsers = generateMockUsers(numItems, currentLength);
        setData([...data, ...newUsers]);

        // After 50 items, mark as exhausted
        if (data.length + numItems >= 50) {
          setStatus("Exhausted");
        }
      }, 500);
    };

    return (
      <CardList
        data={data}
        status={status}
        loadMore={loadMore}
        renderCardHeader={(user) => (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              }}
            >
              {user.name.charAt(0)}
            </div>
            <span style={{ fontWeight: "700" }}>{user.name}</span>
          </div>
        )}
        renderCardBody={(user) => (
          <div>
            <p style={{ margin: "0 0 var(--spacing3) 0", color: "var(--light2)" }}>
              {user.email}
            </p>
            <div style={{ display: "flex", gap: "var(--spacing3)", alignItems: "center" }}>
              <span style={{ fontSize: "var(--text-sm)" }}>Role: {user.role}</span>
              <Button>Remove</Button>
            </div>
          </div>
        )}
        itemsPerPage={12}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "CardList with paginated data that loads more items as you scroll. The infinite scroll automatically triggers when you reach the bottom.",
      },
    },
  },
};

export const CustomGridLayout: Story = {
  render: () => {
    const users = generateMockUsers(9);

    return (
      <CardList
        data={users}
        status="Exhausted"
        className="custom-grid"
        renderCardHeader={(user) => (
          <span style={{ fontWeight: "700" }}>{user.name}</span>
        )}
        renderCardBody={(user) => (
          <p style={{ margin: 0, color: "var(--light2)" }}>{user.email}</p>
        )}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "CardList with a custom grid layout using the className prop. Add CSS to override the default grid behavior.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div>
        <style>
          {`
            .custom-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: var(--spacing8);
              width: 100%;
            }
          `}
        </style>
        <Story />
      </div>
    ),
  ],
};
