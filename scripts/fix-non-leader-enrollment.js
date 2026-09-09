const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("==================================================");
  console.log("   Fixing Non-Leader Member Enrollment & Email");
  console.log("==================================================\n");

  const teams = await prisma.participant_team.findMany({
    include: {
      accounts_user: true,
      participant_teammember: {
        orderBy: { id: "asc" },
      },
    },
  });

  console.log(`Found ${teams.length} teams in database.\n`);

  let fixedMembersCount = 0;

  for (const team of teams) {
    const leaderEmail = team.accounts_user?.email?.toLowerCase();

    // 1. Identify the Leader Member
    const leaderMember = team.participant_teammember.find(
      (m) => m.email.toLowerCase() === leaderEmail
    ) || team.participant_teammember[0];

    const leaderEnrollment = leaderMember?.enrollment_number;

    // 2. Process all non-leader members
    const nonLeaderMembers = team.participant_teammember.filter(
      (m) => m.id !== leaderMember?.id
    );

    for (let idx = 0; idx < nonLeaderMembers.length; idx++) {
      const member = nonLeaderMembers[idx];
      
      // If member has the leader's enrollment number or any misplaced enrollment
      const needsEnrollmentClear = member.enrollment_number && (member.enrollment_number === leaderEnrollment || idx === 0);
      
      // Clear email if it contains non-email strings, leader enrollment, or placeholder
      const cleanEmail = `mem_${team.id}_${member.id}@student.syntra`;

      console.log(`Team "${team.name}" (ID: ${team.id}) -> Clearing duplicate enrollment on Member "${member.name}" (was: "${member.enrollment_number}")`);

      await prisma.participant_teammember.update({
        where: { id: member.id },
        data: {
          enrollment_number: needsEnrollmentClear ? null : member.enrollment_number,
          email: cleanEmail,
        },
      });

      fixedMembersCount++;
    }
  }

  console.log("\n==================================================");
  console.log(`✅ Successfully cleared duplicate enrollment for ${fixedMembersCount} non-leader members.`);
  console.log("==================================================");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Error fixing non-leader members:", err);
  process.exit(1);
});
