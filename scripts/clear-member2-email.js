const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("==================================================");
  console.log("   Clearing 2nd Member Email Fields in Database");
  console.log("==================================================\n");

  const teams = await prisma.participant_team.findMany({
    include: {
      accounts_user: true,
      participant_teammember: {
        orderBy: { created_at: "asc" },
      },
    },
  });

  console.log(`Found ${teams.length} teams in database.\n`);

  let clearedCount = 0;

  for (const team of teams) {
    const leaderEmail = team.accounts_user?.email?.toLowerCase();
    
    // Find non-leader members
    const nonLeaderMembers = team.participant_teammember.filter(
      (m) => m.email.toLowerCase() !== leaderEmail
    );

    // The 2nd member in the team
    const member2 = nonLeaderMembers[0];

    if (member2) {
      console.log(`Team "${team.name}" (ID: ${team.id}) -> Clearing email for 2nd member "${member2.name}" (Current: "${member2.email}")`);
      
      await prisma.participant_teammember.update({
        where: { id: member2.id },
        data: {
          email: "",
        },
      });
      clearedCount++;
    }
  }

  console.log("\n==================================================");
  console.log(`✅ Successfully cleared email field for ${clearedCount} 2nd member records.`);
  console.log("==================================================");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Error clearing member2 emails:", err);
  process.exit(1);
});
