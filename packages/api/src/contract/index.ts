import { populateRouterContractOpenAPIPaths } from "@orpc/openapi";

import { health } from "./health";
import { users } from "./users";

export { health } from "./health";
export { users } from "./users";

export const contract = populateRouterContractOpenAPIPaths({
  health,
  users,
});
