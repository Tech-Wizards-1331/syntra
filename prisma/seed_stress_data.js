const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting DB seeding for stress test (250 teams)...");

  const now = new Date();

  // 1. Clean up any previous stress test data to prevent duplicate record errors
  console.log("Cleaning up previous stress test records...");
  await prisma.participant_team.deleteMany({
    where: { name: { startsWith: "Stress Team " } }
  });
  await prisma.participant_participantprofile.deleteMany({
    where: { college: "Stress Testing University" }
  });
  await prisma.accounts_user.deleteMany({
    where: { email: { startsWith: "stress_leader_" } }
  });
  await prisma.organizer_problemstatement.deleteMany({
    where: { title: "Stress Problem Statement" }
  });
  await prisma.organizer_hackathon.deleteMany({
    where: { name: "Stress Test Hackathon" }
  });

  // 2. Find or create an organizer profile
  let organizerProfile = await prisma.organizer_organizerprofile.findFirst();
  if (!organizerProfile) {
    console.log("Creating temporary organizer for stress test...");
    const orgUser = await prisma.accounts_user.create({
      data: {
        email: "stress_organizer@example.com",
        password: "hashedpasswordhere",
        first_name: "Stress",
        last_name: "Organizer",
        full_name: "Stress Organizer",
        is_superuser: false,
        is_staff: false,
        is_active: true,
        date_joined: now,
        created_at: now,
        updated_at: now,
        is_profile_complete: true,
        role: "organizer"
      }
    });
    organizerProfile = await prisma.organizer_organizerprofile.create({
      data: {
        user_id: orgUser.id,
        organization_name: "Stress Org",
        created_at: now,
        updated_at: now
      }
    });
  }

  // 3. Create Stress Hackathon with released problems
  console.log("Creating Stress Test Hackathon...");
  const hackathon = await prisma.organizer_hackathon.create({
    data: {
      name: "Stress Test Hackathon",
      description: "Temporary hackathon for testing 250 parallel selections",
      start_date: new Date(now.getTime() + 5 * 24 * 3600 * 1000),
      end_date: new Date(now.getTime() + 7 * 24 * 3600 * 1000),
      registration_deadline: new Date(now.getTime() + 3 * 24 * 3600 * 1000),
      status: "published",
      min_team_size: 1,
      max_team_size: 4,
      created_at: now,
      updated_at: now,
      organizer_id: organizerProfile.id,
      is_paid: false,
      release_problems: true // Critical for selection to be open!
    }
  });

  // 4. Create Problem Statement with max_teams_allowed = 50
  console.log("Creating Stress Problem Statement...");
  const ps = await prisma.organizer_problemstatement.create({
    data: {
      title: "Stress Problem Statement",
      description: "A test problem statement with a capacity limit of 50 teams.",
      is_active: true,
      created_at: now,
      updated_at: now,
      hackathon_id: hackathon.id,
      max_teams_allowed: 50 // We will test if more than 50 teams can select it
    }
  });

  // 5. Create 250 Users and Profiles
  console.log("Creating 250 participant users...");
  const usersData = [];
  for (let i = 1; i <= 250; i++) {
    usersData.push({
      email: `stress_leader_${i}@example.com`,
      password: "nopasswordneededforapitest",
      first_name: "Stress",
      last_name: `Leader ${i}`,
      full_name: `Stress Leader ${i}`,
      is_superuser: false,
      is_staff: false,
      is_active: true,
      date_joined: now,
      created_at: now,
      updated_at: now,
      is_profile_complete: true,
      role: "participant"
    });
  }

  // Use createMany for high performance seeding
  await prisma.accounts_user.createMany({ data: usersData });

  // Retrieve the created users to get their IDs
  const seededUsers = await prisma.accounts_user.findMany({
    where: { email: { startsWith: "stress_leader_" } },
    orderBy: { id: "asc" }
  });

  console.log("Creating profiles and teams for the 250 users...");
  const profilesData = seededUsers.map(user => ({
    user_id: user.id,
    college: "Stress Testing University",
    semester: 4,
    degree: "B.Tech",
    visibility: true,
    created_at: now,
    updated_at: now
  }));

  await prisma.participant_participantprofile.createMany({ data: profilesData });

  const teamsData = seededUsers.map((user, idx) => ({
    name: `Stress Team ${idx + 1}`,
    food_tokens_total: 0,
    food_tokens_used: 0,
    created_at: now,
    updated_at: now,
    hackathon_id: hackathon.id,
    leader_id: user.id,
    is_registered: true,
    is_qr_active: false
  }));

  await prisma.participant_team.createMany({ data: teamsData });

  // Retrieve the created teams to map them to user IDs
  const seededTeams = await prisma.participant_team.findMany({
    where: { name: { startsWith: "Stress Team " } },
    orderBy: { id: "asc" }
  });

  // Map team IDs and leader IDs
  const mappings = seededTeams.map((team, idx) => ({
    teamId: team.id,
    leaderId: team.leader_id
  }));

  // Write mapping data to JSON file for k6 usage
  const mappingsPath = path.join(__dirname, "../tests/stress-ids.json");
  fs.writeFileSync(
    mappingsPath,
    JSON.stringify({
      hackathonId: hackathon.id,
      problemStatementId: ps.id,
      teams: mappings
    }, null, 2)
  );

  console.log(`Seeding complete! Saved 250 team mappings to ${mappingsPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
