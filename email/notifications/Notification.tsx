import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Font,
} from "@react-email/components";
import React from "react";

interface NotificationProps {
  title: string;
  children: React.ReactNode;
  orgHost: string;
}

export const Notification: React.FC<NotificationProps> = ({
  title,
  children,
  orgHost,
}) => {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Gentium Plus"
          fallbackFontFamily="Georgia"
          webFont={{
            url: `https://${orgHost}/fonts/gentium-plus-italic.ttf`,
            format: "truetype",
          }}
          fontWeight={400}
          fontStyle="italic"
        />
        <Font
          fontFamily="Lato"
          fallbackFontFamily="Arial"
          webFont={{
            url: `https://${orgHost}/fonts/lato-regular.ttf`,
            format: "truetype",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="Lato"
          fallbackFontFamily="Arial"
          webFont={{
            url: `https://${orgHost}/fonts/lato-bold.ttf`,
            format: "truetype",
          }}
          fontWeight={700}
          fontStyle="normal"
        />
      </Head>
      <Body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#424769",
          backgroundImage: "linear-gradient(to bottom, #424769, #5B628B)",
          fontFamily: "Lato, Arial, sans-serif",
        }}
      >
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "40px 20px",
          }}
        >
          {/* Title */}
          <Section
            style={{
              textAlign: "center",
              marginTop: "38px",
              marginBottom: "38px",
            }}
          >
            <Text
              style={{
                fontFamily: "'Gentium Plus', Georgia, serif",
                fontStyle: "italic",
                fontSize: "36px",
                color: "#E0E0E0",
                margin: "0 0 38px 0",
              }}
            >
              {title}
            </Text>

            {/* Chevron Icon */}
            <div style={{ margin: "0 auto", width: "30px", height: "30px" }}>
              <svg
                width="29"
                height="30"
                viewBox="0 0 29 30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_787_349)">
                  <path
                    d="M0.553757 16.5578L13.2348 29.4617C13.5736 29.8064 14.0331 30.0001 14.5123 30.0001C14.9915 30.0001 15.451 29.8064 15.7898 29.4617L28.4708 16.5578C28.8096 16.2131 29 15.7454 29 15.2579C29 14.7703 28.8096 14.3026 28.4708 13.9579C28.132 13.6349 27.681 13.4621 27.2169 13.4775C26.7529 13.4929 26.3139 13.6953 25.9965 14.04L14.813 25.42C14.7333 25.3389 14.6251 25.2933 14.5123 25.2933C14.3995 25.2933 14.2913 25.3389 14.2115 25.42L3.02806 14.04C2.68924 13.6953 2.2297 13.5016 1.75053 13.5016C1.27136 13.5016 0.811823 13.6953 0.473 14.04C0.155596 14.3848 -0.0142121 14.8438 0.000932667 15.316C0.0160774 15.7881 0.214934 16.2349 0.553757 16.5578Z"
                    fill="#F6B17A"
                  />
                  <path
                    d="M0.553757 3.08127L13.2348 15.9851C13.5736 16.3299 14.0331 16.5236 14.5123 16.5236C14.9915 16.5236 15.451 16.3299 15.7898 15.9851L28.4708 3.08127C28.8096 2.73649 29 2.26888 29 1.78129C29 1.2937 28.8096 0.826087 28.4708 0.481311C28.132 0.158329 27.681 -0.0144618 27.2169 0.00094906C26.7529 0.0163599 26.3139 0.21871 25.9965 0.563486L14.813 11.9435C14.7333 11.8623 14.6251 11.8167 14.5123 11.8167C14.3995 11.8167 14.2913 11.8623 14.2115 11.9435L3.02806 0.563486C2.68924 0.21871 2.2297 0.0250166 1.75053 0.0250166C1.27136 0.0250166 0.811823 0.21871 0.473 0.563486C0.155596 0.908262 -0.0142121 1.36722 0.000932667 1.8394C0.0160774 2.31157 0.214934 2.75829 0.553757 3.08127Z"
                    fill="#F6B17A"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_787_349">
                    <rect width="29" height="30" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
          </Section>

          {/* Content Card */}
          <Section
            style={{
              backgroundColor: "#424769",
              borderRadius: "32px",
              padding: "57px 47px",
              boxShadow:
                "21px 16px 63px -36px rgba(0, 0, 0, 0.25), -21px 16px 63px -36px rgba(0, 0, 0, 0.25)",
              marginBottom: "32px",
            }}
          >
            {children}
          </Section>

          {/* Footer */}
          <Section style={{ textAlign: "center" }}>
            <Text
              style={{
                fontSize: "14px",
                color: "#E0E0E0",
                margin: 0,
              }}
            >
              <Link
                href={`https://${orgHost}/profile`}
                style={{
                  color: "#F6B17A",
                  textDecoration: "none",
                }}
              >
                Manage notification settings
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};
