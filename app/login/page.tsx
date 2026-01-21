"use client";

import Button from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import styles from "./page.module.css";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRef, useState } from "react";
import { useOrganization } from "@/app/context/OrganizationProvider";
import { Id } from "@/convex/_generated/dataModel";
import { useSignIn } from "@clerk/clerk-react";
import { OneTimePassword } from "../components/ui/OneTimePassword";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const org = useOrganization();
  const orgId = org?._id as Id<"organizations">;

  const emailParam = searchParams.get("email");
  const [email, setEmail] = useState(emailParam || "");
  const [error, setError] = useState<string | undefined>(undefined);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  const { isLoaded, signIn, setActive } = useSignIn();

  const doesUserExist = useQuery(api.user.doesUserExist, {
    email,
    orgId,
  });
  const { userExists, clerkUserExists, deactivated } = doesUserExist || {};

  const handleSubmitEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email) {
      setError("Email is required");
    } else if (!userExists) {
      setError("We couldn't find this account");
    } else if (!clerkUserExists) {
      setError("Could not log in. Please contact support");
    } else if (deactivated) {
      setError("This account is deactivated");
    } else if (isLoaded) {
      setError(undefined);

      try {
        // Start sign in process
        const { supportedFirstFactors } = await signIn.create({
          identifier: email,
        });

        // get email code factor
        const emailCodeFactor = supportedFirstFactors?.find(
          (factor) => factor.strategy === "email_code"
        );

        if (emailCodeFactor) {
          // Grab the emailId
          const { emailAddressId } = emailCodeFactor;

          // Send the OTP code to the email address
          await signIn.prepareFirstFactor({
            strategy: "email_code",
            emailAddressId,
          });

          setVerifying(true);
        }
      } catch (error) {
        console.error("Error logging in", error);
      }
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isLoaded && !signIn) return;

    try {
      // Use the user-provided code to attempt verification
      const signInAttempt = await signIn.attemptFirstFactor({
        strategy: "email_code",
        code,
      });

      // If successful, set the active session and readirect
      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.push("/");
      }
    } catch (error) {
      console.log("Error verifying OTP", error);
      console.log("code", code);
      setError("The code is either incorrect or expired");
    }
  };

  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmitOnCodeComplete = () => {
    if (!formRef.current) return;

    // Preferred: fires validation & React onSubmit
    if (typeof formRef.current.requestSubmit === "function") {
      formRef.current.requestSubmit();
    } else {
      // Fallback
      formRef.current.submit();
    }
  };

  return (
    <main>
      <div className={styles.signinCard}>
        <h1>Sign in</h1>
        {!verifying ? (
          <form onSubmit={handleSubmitEmail}>
            <Input
              label="Email"
              error={error}
              type="email"
              placeholder="your@email.com"
              className={styles.signinEmail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button
              className={styles.continueButton}
              icon="send"
              type="submit"
              disabled={!isLoaded}
              variant="primary"
            >
              Continue
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} ref={formRef}>
            <p className={styles.otpMessage}>
              Please check your email and enter the code below
            </p>
            <OneTimePassword
              className={styles.otpInput}
              slots={6}
              onChange={setCode}
              error={error}
              onComplete={handleSubmitOnCodeComplete}
            />
            <Button
              className={styles.signinButton}
              type="submit"
              disabled={!isLoaded}
              variant="primary"
            >
              Sign in
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
