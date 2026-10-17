import "dotenv/config";

import { OwnerService } from "../auth/owner.service";

/**
 * Seeds the predefined single business-owner account from the ADMIN_* env
 * variables. Idempotent: if an owner already exists for the configured email
 * or mobile it is left untouched. Safe to run repeatedly.
 */
async function main() {
  const { created, owner } = await OwnerService.seedOwner();

  if (created) {
    console.log(`Owner account created: ${owner.name}`);
  } else {
    console.log(`Owner account already exists: ${owner.name} (unchanged)`);
  }

  process.exit(0);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to seed owner account: ${message}`);
  process.exit(1);
});
