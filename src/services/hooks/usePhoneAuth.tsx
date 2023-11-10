import { RefObject, useCallback, useEffect, useState } from "react";
import { ConfirmationResult, getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { updateUser } from "firebase-soil/client";
import { useSoilContext } from "../context/soilContext";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

export const usePhoneAuth = (buttonElementId: string, phoneNumberElement: RefObject<HTMLInputElement>) => {
  const { user } = useSoilContext();
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult>();

  const enabled = Boolean(user || user === null);
  useEffect(() => {
    if (enabled) {
      window.recaptchaVerifier = new RecaptchaVerifier(getAuth(), buttonElementId, { size: "invisible" });
    }
  }, [buttonElementId, enabled]);

  const handleSubmit = useCallback(async () => {
    const appVerifier = window.recaptchaVerifier;
    if (phoneNumberElement.current && appVerifier) {
      const onlyNumbers = phoneNumberElement.current.value.replace(/\D/g, "");
      const validatedPhone = `+${onlyNumbers[0] !== "1" ? "1" : ""}${onlyNumbers}`;

      setConfirmationResult(await signInWithPhoneNumber(getAuth(), validatedPhone, appVerifier));
    } else {
      // eslint-disable-next-line no-console
      console.error("Missing something in usePhoneAuth", {
        phoneNumberElement: phoneNumberElement.current,
        appVerifier,
      });
    }
  }, [phoneNumberElement]);

  const submitCode = useCallback(
    async (code: string) => {
      const { user: authedUser } = (await confirmationResult?.confirm(code)) || {};

      if (authedUser?.phoneNumber) {
        const now = Date.now();

        await updateUser({
          uid: authedUser.uid,
          phoneNumber: authedUser.phoneNumber,
          createdAt: now,
          updatedAt: now,
        });
      }
    },
    [confirmationResult]
  );

  return { showCodeInput: Boolean(confirmationResult), submitCode, handleSubmit };
};
