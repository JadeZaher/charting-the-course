import { db } from "../server/db";
import { quizResults, userTags } from "../shared/schema";
import { eq, sql } from "drizzle-orm";

async function cleanupDuplicateTags() {
  console.log("Starting duplicate tag cleanup migration...");

  try {
    const resultsGroupedQuery = sql`
      SELECT 
        user_id,
        quiz_id,
        ARRAY_AGG(id ORDER BY completed_at DESC) as result_ids,
        ARRAY_AGG(completed_at ORDER BY completed_at DESC) as completed_ats
      FROM ${quizResults}
      GROUP BY user_id, quiz_id
      HAVING COUNT(*) > 1
    `;

    const groupedResults = await db.execute(resultsGroupedQuery);

    let totalGroupsProcessed = 0;
    let totalTagsDeleted = 0;

    for (const row of groupedResults.rows) {
      const userId = row.user_id as string;
      const quizId = row.quiz_id as string;
      const resultIds = row.result_ids as string[];
      const completedAts = row.completed_ats as Date[];

      const mostRecentResultId = resultIds[0];
      const olderResultIds = resultIds.slice(1);

      console.log(`\nProcessing user ${userId}, quiz ${quizId}:`);
      console.log(`  - Total attempts: ${resultIds.length}`);
      console.log(`  - Most recent: ${mostRecentResultId} (${completedAts[0]})`);
      console.log(`  - Cleaning up ${olderResultIds.length} older attempts...`);

      for (const oldResultId of olderResultIds) {
        const tagsToDelete = await db
          .select()
          .from(userTags)
          .where(eq(userTags.quizResultId, oldResultId));

        if (tagsToDelete.length > 0) {
          await db
            .delete(userTags)
            .where(eq(userTags.quizResultId, oldResultId));

          console.log(`    - Deleted ${tagsToDelete.length} tags from result ${oldResultId}`);
          totalTagsDeleted += tagsToDelete.length;
        }
      }

      totalGroupsProcessed++;
    }

    console.log("\n=== Migration Complete ===");
    console.log(`Processed ${totalGroupsProcessed} user-quiz combinations`);
    console.log(`Deleted ${totalTagsDeleted} duplicate tags`);
    console.log("Only the most recent quiz attempt's tags remain for each user-quiz combination");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

cleanupDuplicateTags()
  .then(() => {
    console.log("\nMigration successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nMigration failed:", error);
    process.exit(1);
  });
