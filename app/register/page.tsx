"use client";

import Button from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import Hint from "@/app/components/ui/Hint";
import styles from "./page.module.css";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState } from "react";
import { useOrganization } from "@/app/context/OrganizationProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { useAction } from "convex/react";

export default function Register() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const org = useOrganization();

  const token = searchParams.get("token");

  // State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries/actions
  const invite = useQuery(
    api.registration.lookupInviteByToken,
    token && org?._id ? { token, orgId: org._id } : "skip"
  );
  const registerAction = useAction(api.registration.register);

  // Pre-populate from invite
  useEffect(() => {
    if (invite && !("error" in invite)) {
      if (invite.name) setName(invite.name);
      if (invite.email) setEmail(invite.email);
    }
  }, [invite]);

  // Form handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token || !org?._id) {
      setError("Invalid registration link");
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    try {
      await registerAction({
        token,
        name,
        email,
        orgId: org._id,
      });

      // Redirect to login with email pre-populated
      router.push(`/login?email=${encodeURIComponent(email)}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Registration failed";
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  // Determine content to render
  let content: React.ReactNode;

  if (!token) {
    content = <Hint type="error">No invite token provided</Hint>;
  } else if (invite === undefined) {
    content = <p className={styles.loadingMessage}>Loading...</p>;
  } else if ("error" in invite) {
    content = <Hint type="error">{invite.error}</Hint>;
  } else {
    content = (
      <form onSubmit={handleSubmit}>
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          disabled={!!invite.email}
          helperText={invite.email ? "Email set by invite" : undefined}
          required
        />
        {error && <Hint type="error">{error}</Hint>}
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className={styles.submitButton}
        >
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </Button>
      </form>
    );
  }

  return (
    <main>
      <div className={styles.registrationCard}>
        <h1>Create Account</h1>
        {content}
      </div>
    </main>
  );
}
