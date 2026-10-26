"use client";

import * as React from "react";
import { useSession } from "@/lib/session/session-provider";
import { useAuthDialog } from "./auth-dialog";

/**
 * Renders nothing. Opens the registration popup when the page is reached as
 * /registration#registration (links from other pages, shared URLs) by a visitor who isn't signed in.
 */
export function RegistrationHashOpener() {
  const session = useSession();
  const dialog = useAuthDialog();
  const opened = React.useRef(false);

  React.useEffect(() => {
    if (opened.current || session.status !== "anonymous") return;
    if (window.location.hash === "#registration") {
      opened.current = true;
      dialog?.open("register");
    }
  }, [session.status, dialog]);

  return null;
}
