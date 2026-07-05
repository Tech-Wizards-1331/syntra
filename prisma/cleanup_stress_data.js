const fs = require("fs");
const path = require("path");

// Load .env to bypass pooler using DIRECT_URL
const envPath = path.join(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const directUrlMatch = envContent.match(/^DIRECT_URL=["']?([^"'\r\n]+)["']?/m);
  if (directUrlMatch && directUrlMatch[1]) {
    process.env.DATABASE_URL = directUrlMatch[1];
  }
}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Starting cleanup of all stress test data...");

  // 1. Delete DB Records
  console.log("Deleting seeded database records...");
  const teamDel = await prisma.participant_team.deleteMany({
    where: { name: { startsWith: "Stress Team " } }
  });
  console.log(`- Deleted ${teamDel.count} stress teams.`);

  const profileDel = await prisma.participant_participantprofile.deleteMany({
    where: { college: "Stress Testing University" }
  });
  console.log(`- Deleted ${profileDel.count} profiles.`);

  const userDel = await prisma.accounts_user.deleteMany({
    where: { email: { startsWith: "stress_leader_" } }
  });
  console.log(`- Deleted ${userDel.count} user accounts.`);

  const psDel = await prisma.organizer_problemstatement.deleteMany({
    where: { title: "Stress Problem Statement" }
  });
  console.log(`- Deleted ${psDel.count} problem statements.`);

  const hackathonDel = await prisma.organizer_hackathon.deleteMany({
    where: { name: "Stress Test Hackathon" }
  });
  console.log(`- Deleted ${hackathonDel.count} hackathons.`);

  // 2. Delete Temporary Files
  console.log("Removing temporary files from local workspace...");
  const filesToDelete = [
    path.join(__dirname, "../tests/stress-ids.json"),
    path.join(__dirname, "check_results.js"),
    path.join(__dirname, "seed_stress_data.js"),
    path.join(__dirname, "../tests/stress-select-test.js")
  ];

  filesToDelete.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`- Deleted file: ${path.basename(filePath)}`);
    }
  });

  console.log("Cleanup process completed successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
