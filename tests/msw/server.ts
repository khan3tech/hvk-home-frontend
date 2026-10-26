import { setupServer } from "msw/node";
import { defaultHandlers } from "./handlers";

/** MSW server for component/unit tests. Unhandled requests fail the test (see tests/setup.ts). */
export const server = setupServer(...defaultHandlers);
