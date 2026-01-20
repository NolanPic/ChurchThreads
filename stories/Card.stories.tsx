import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Card, CardHeader, CardBody } from "../app/components/ui/Card";
import Button from "../app/components/ui/Button";

type CardProps = React.ComponentProps<typeof Card>;

const meta: Meta<CardProps> = {
  title: "Components/Card",
  component: Card,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A flexible card component with optional header and body sections. Use CardHeader and CardBody as children to structure content.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<CardProps>;

export const BodyOnly: Story = {
  render: () => (
    <Card>
      <CardBody>
        <p>This is a simple card with only body content.</p>
      </CardBody>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: "A card with only body content, no header.",
      },
    },
  },
};

export const MixedContent: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "var(--accent)",
            }}
          />
          <div>
            <h3 style={{ margin: 0, fontSize: "var(--text-base)" }}>
              Card Title
            </h3>
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--light2)" }}>
              Subtitle
            </p>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <p style={{ marginBottom: "var(--spacing4)" }}>
          This card contains mixed content including text, and interactive elements.
        </p>
        <div style={{ display: "flex", gap: "var(--spacing3)" }}>
          <Button variant="primary">Primary Action</Button>
          <Button>Secondary Action</Button>
        </div>
      </CardBody>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "A card with header and body sections containing various types of content including text, avatars, and buttons.",
      },
    },
  },
};
