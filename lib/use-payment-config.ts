"use client";

import * as React from "react";
import { portalApi } from "@/lib/api/portal";
import type { PaymentConfig } from "@/types/api";

/**
 * How candidates pay right now. `config` is null while loading; if the request fails (for example an
 * older API) `failed` is true and callers should behave as for online payment.
 */
export function usePaymentConfig(): { config: PaymentConfig | null; failed: boolean } {
  const [state, setState] = React.useState<{ config: PaymentConfig | null; failed: boolean }>({ config: null, failed: false });
  React.useEffect(() => {
    let cancelled = false;
    portalApi
      .paymentConfig()
      .then((config) => !cancelled && setState({ config, failed: false }))
      .catch(() => !cancelled && setState({ config: null, failed: true }));
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}
