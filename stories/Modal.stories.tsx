import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import Modal, { ModalTab } from "../app/components/ui/Modal";
import Button from "../app/components/ui/Button";

type ModalProps = React.ComponentProps<typeof Modal>;

const meta: Meta<ModalProps> = {
  title: "Components/Modal",
  component: Modal,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A responsive modal component with support for tabs, drag-to-close on mobile, and custom toolbars. Features full accessibility support including ARIA attributes and keyboard navigation.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    isOpen: {
      control: "boolean",
      description: "Whether the modal is open",
    },
    onClose: {
      action: "closed",
      description: "Callback when modal is closed",
    },
    title: {
      control: "text",
      description: "Modal title",
    },
    ariaLabel: {
      control: "text",
      description: "ARIA label for the modal",
    },
    dragToClose: {
      control: "boolean",
      description: "Enable drag-to-close on mobile devices",
    },
    fullScreen: {
      control: "boolean",
      description:
        "When true, the modal uses a full-screen layout on all breakpoints",
    },
  },
};

export default meta;
type Story = StoryObj<ModalProps>;

// Wrapper component to manage modal state
const ModalWrapper = ({
  children,
  ...props
}: Omit<ModalProps, "isOpen" | "onClose">) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal {...props} isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {children}
      </Modal>
    </>
  );
};

// Basic Modal Stories
export const Default: Story = {
  render: () => (
    <ModalWrapper title="Welcome">
      <div style={{ padding: "0 var(--spacing7)" }}>
        <p>This is a basic modal with a title and some content.</p>
        <p>Press ESC or click outside to close.</p>
      </div>
    </ModalWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: "A basic modal with title and content.",
      },
    },
  },
};

export const WithoutTitle: Story = {
  render: () => (
    <ModalWrapper ariaLabel="Information modal">
      <div style={{ padding: "0 var(--spacing7)" }}>
        <p>This modal has no title, just content.</p>
        <p>Make sure to provide an ariaLabel when omitting the title.</p>
      </div>
    </ModalWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Modal without a title. An ariaLabel should be provided for accessibility.",
      },
    },
  },
};

export const DragToClose: Story = {
  render: () => (
    <ModalWrapper title="Drag to Close" dragToClose>
      <div style={{ padding: "0 var(--spacing7)" }}>
        <p>On mobile devices, you can drag down to close this modal.</p>
        <p>Try it on a phone or in responsive mode!</p>
      </div>
    </ModalWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: "Modal with drag-to-close enabled for mobile devices.",
      },
    },
  },
};

export const FullScreen: Story = {
  render: () => (
    <ModalWrapper title="Full Screen Modal" fullScreen>
      <div style={{ padding: "0 var(--spacing7)" }}>
        <p>This modal uses a full-screen layout across all breakpoints.</p>
        <p>
          On tablet and desktop, the close button remains visible in the top
          right.
        </p>
      </div>
    </ModalWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Modal with fullScreen enabled. It fills the viewport on mobile, tablet, and desktop while keeping the tablet/desktop close button visible.",
      },
    },
  },
};

// Tab Stories
const TabsWrapper = ({ tabs, title }: { tabs: ModalTab[]; title: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id || "");

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal with Tabs</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={title}
        tabs={tabs}
        activeTabId={activeTabId}
        onTabChange={setActiveTabId}
      />
    </>
  );
};

export const WithTabs: Story = {
  render: () => (
    <TabsWrapper
      title="Settings"
      tabs={[
        {
          id: "organization",
          label: "Organization",
          content: (
            <div style={{ padding: "0 var(--spacing7)" }}>
              <h2>Organization Settings</h2>
              <p>Configure your organization settings here.</p>
            </div>
          ),
        },
        {
          id: "feeds",
          label: "Feeds",
          content: (
            <div style={{ padding: "0 var(--spacing7)" }}>
              <h2>Feed Settings</h2>
              <p>Manage your feeds here.</p>
              <ul>
                <li>Main Feed</li>
                <li>News Feed</li>
                <li>Events Feed</li>
              </ul>
            </div>
          ),
        },
        {
          id: "users",
          label: "Users",
          content: (
            <div style={{ padding: "0 var(--spacing7)" }}>
              <h2>User Management</h2>
              <p>Add, remove, and manage users.</p>
            </div>
          ),
        },
      ]}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Modal with tabs. Click tabs to switch between content. Use arrow keys, Home, and End for keyboard navigation.",
      },
    },
  },
};

export const WithManyTabs: Story = {
  render: () => (
    <TabsWrapper
      title="Admin Panel"
      tabs={[
        {
          id: "dashboard",
          label: "Dashboard",
          content: (
            <div style={{ padding: "0 var(--spacing7)" }}>
              <h2>Dashboard</h2>
              <p>Overview of your system.</p>
            </div>
          ),
        },
        {
          id: "analytics",
          label: "Analytics",
          content: (
            <div style={{ padding: "0 var(--spacing7)" }}>
              <h2>Analytics</h2>
              <p>View your analytics data.</p>
            </div>
          ),
        },
        {
          id: "settings",
          label: "Settings",
          content: (
            <div style={{ padding: "0 var(--spacing7)" }}>
              <h2>Settings</h2>
              <p>Configure your preferences.</p>
            </div>
          ),
        },
        {
          id: "notifications",
          label: "Notifications",
          content: (
            <div style={{ padding: "0 var(--spacing7)" }}>
              <h2>Notifications</h2>
              <p>Manage your notifications.</p>
            </div>
          ),
        },
        {
          id: "security",
          label: "Security",
          content: (
            <div style={{ padding: "0 var(--spacing7)" }}>
              <h2>Security</h2>
              <p>Security and privacy settings.</p>
            </div>
          ),
        },
        {
          id: "integrations",
          label: "Integrations",
          content: (
            <div style={{ padding: "0 var(--spacing7)" }}>
              <h2>Integrations</h2>
              <p>Connect third-party services.</p>
            </div>
          ),
        },
        {
          id: "billing",
          label: "Billing",
          content: (
            <div style={{ padding: "0 var(--spacing7)" }}>
              <h2>Billing</h2>
              <p>Manage your subscription and billing.</p>
            </div>
          ),
        },
      ]}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Modal with many tabs. On mobile, tabs scroll horizontally with a fade effect on the right side.",
      },
    },
  },
};
