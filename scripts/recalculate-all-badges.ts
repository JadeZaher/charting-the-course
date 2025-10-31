import { db } from "../server/db";
import { userTags, userBadges, users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function recalculateAllBadges() {
  console.log("Starting badge recalculation for all users...");

  try {
    const { determineBadgesFromTags } = await import('../server/tagExtraction');

    const allUsers = await db.select({ id: users.id }).from(users);
    
    console.log(`Found ${allUsers.length} users to process`);

    let usersProcessed = 0;
    let totalBadgesDeleted = 0;
    let totalBadgesCreated = 0;

    for (const user of allUsers) {
      const userId = user.id;

      await db.transaction(async (tx) => {
        const existingBadges = await tx.select().from(userBadges)
          .where(eq(userBadges.userId, userId));

        await tx.delete(userBadges)
          .where(eq(userBadges.userId, userId));

        totalBadgesDeleted += existingBadges.length;

        const allUserTags = await tx.select().from(userTags)
          .where(eq(userTags.userId, userId));

        if (allUserTags.length > 0) {
          const badgesToEarn = determineBadgesFromTags(allUserTags);

          if (badgesToEarn.length > 0) {
            await tx.insert(userBadges).values(
              badgesToEarn.map(badge => ({
                userId,
                badgeKey: badge.badgeKey,
                badgeName: badge.badgeName,
                badgeDescription: badge.badgeDescription,
                badgeCategory: badge.badgeCategory,
                badgeIcon: badge.badgeIcon,
                strength: 1,
                sourceTagKeys: badge.sourceTagKeys,
              }))
            );

            totalBadgesCreated += badgesToEarn.length;
          }
        }
      });

      usersProcessed++;
      if (usersProcessed % 10 === 0) {
        console.log(`Progress: ${usersProcessed}/${allUsers.length} users processed`);
      }
    }

    console.log("\n=== Badge Recalculation Complete ===");
    console.log(`Processed ${usersProcessed} users`);
    console.log(`Deleted ${totalBadgesDeleted} old badges`);
    console.log(`Created ${totalBadgesCreated} fresh badges`);
  } catch (error) {
    console.error("Badge recalculation failed:", error);
    throw error;
  }
}

recalculateAllBadges()
  .then(() => {
    console.log("\nBadge recalculation successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nBadge recalculation failed:", error);
    process.exit(1);
  });
