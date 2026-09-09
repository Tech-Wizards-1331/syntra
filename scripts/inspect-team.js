const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const teams = await prisma.participant_team.findMany({
    take: 3,
    orderBy: { id: "desc" },
    include: {
      accounts_user: true,
      participant_teammember: {
        orderBy: { id: "asc" },
      },
    },
  });

  for (const t of teams) {
    console.log(`\n================ Team: ${t.name} (ID: ${t.id}, Leader User ID: ${t.leader_id}) ================`);
    console.log(`Leader User Email: ${t.accounts_user?.email}, Full Name: ${t.accounts_user?.full_name}`);
    console.log("Team Members in DB:");
    t.participant_teammember.forEach((m, idx) => {
      console.log(`  [Slot ${idx + 1}] ID: ${m.id} | Name: "${m.name}" | Email: "${m.email}" | Enrollment: "${m.enrollment_number}"`);
    });
  }

  await prisma.$disconnect();
}

main();
