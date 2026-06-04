const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

// Helper to hash password using Django-compatible pbkdf2_sha256 format
function hashPassword(password) {
  const iterations = 600000;
  const salt = crypto
    .randomBytes(9)
    .toString("base64")
    .replace(/\+/g, "a")
    .replace(/\//g, "b")
    .substring(0, 12);

  const key = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256");
  const hashBase64 = key.toString("base64");

  return `pbkdf2_sha256$${iterations}$${salt}$${hashBase64}`;
}

async function main() {
  console.log("Seeding test database...");

  const now = new Date();
  const passwordHash = hashPassword("password123");

  // 1. Create or Update Organizer
  const orgUser = await prisma.accounts_user.upsert({
    where: { email: "organizer@example.com" },
    update: {
      password: passwordHash,
      role: "organizer",
      is_profile_complete: true,
    },
    create: {
      email: "organizer@example.com",
      password: passwordHash,
      first_name: "Test",
      last_name: "Organizer",
      full_name: "Test Organizer",
      is_superuser: false,
      is_staff: false,
      is_active: true,
      date_joined: now,
      created_at: now,
      updated_at: now,
      is_profile_complete: true,
      role: "organizer",
    },
  });

  const orgProfile = await prisma.organizer_organizerprofile.upsert({
    where: { user_id: orgUser.id },
    update: {
      organization_name: "Syntra Org",
    },
    create: {
      user_id: orgUser.id,
      organization_name: "Syntra Org",
      created_at: now,
      updated_at: now,
    },
  });

  // 2. Create Room Config JSON
  const roomConfig = [
    {
      room_no: "Room 101",
      type: "configured",
      columns: [
        { bench_count: 3, capacity: 4 },
        { bench_count: 3, capacity: 4 }
      ]
    },
    {
      room_no: "Auditorium",
      type: "open",
      total_seats: 12,
      seats_per_row: 6
    }
  ];

  // 3. Create or Update Hackathon
  const hackathon = await prisma.organizer_hackathon.create({
    data: {
      name: "Syntra Hackathon 2026",
      description: "A test hackathon with seating allocation and payment checkouts.",
      start_date: new Date(now.getTime() + 10 * 24 * 3600 * 1000),
      end_date: new Date(now.getTime() + 12 * 24 * 3600 * 1000),
      registration_deadline: new Date(now.getTime() + 5 * 24 * 3600 * 1000),
      status: "published",
      min_team_size: 2,
      max_team_size: 4,
      created_at: now,
      updated_at: now,
      organizer_id: orgProfile.id,
      room_configuration: JSON.stringify(roomConfig, null, 2),
      fee_amount: 999.0,
      fee_type: "team",
      is_paid: true,
    },
  });

  console.log(`Created Hackathon: "${hackathon.name}" (ID: ${hackathon.id})`);

  // 4. Create Coordinator
  await prisma.organizer_hackathoncoordinator.create({
    data: {
      is_active: true,
      created_at: now,
      hackathon_id: hackathon.id,
      user_id: orgUser.id,
    },
  });

  // 5. Create Participant Users and Teams
  const teamsData = [
    {
      name: "Binary Beasts",
      leaderEmail: "leader1@example.com",
      leaderName: "Alice Beasts",
      members: ["Member 1A", "Member 1B"],
      isRegistered: false,
    },
    {
      name: "Cyber Knights",
      leaderEmail: "leader2@example.com",
      leaderName: "Bob Knights",
      members: ["Member 2A", "Member 2B", "Member 2C"],
      isRegistered: true,
    },
    {
      name: "Pixel Wizards",
      leaderEmail: "leader3@example.com",
      leaderName: "Charlie Wizards",
      members: ["Member 3A"],
      isRegistered: false,
    }
  ];

  for (const t of teamsData) {
    const leader = await prisma.accounts_user.upsert({
      where: { email: t.leaderEmail },
      update: {
        password: passwordHash,
        role: "participant",
        is_profile_complete: true,
      },
      create: {
        email: t.leaderEmail,
        password: passwordHash,
        first_name: t.leaderName.split(" ")[0],
        last_name: t.leaderName.split(" ")[1],
        full_name: t.leaderName,
        is_superuser: false,
        is_staff: false,
        is_active: true,
        date_joined: now,
        created_at: now,
        updated_at: now,
        is_profile_complete: true,
        role: "participant",
      },
    });

    await prisma.participant_participantprofile.upsert({
      where: { user_id: leader.id },
      update: {},
      create: {
        user_id: leader.id,
        college: "Syntra Tech College",
        semester: 4,
        degree: "B.Tech CSE",
        visibility: true,
        created_at: now,
        updated_at: now,
      },
    });

    const team = await prisma.participant_team.create({
      data: {
        name: t.name,
        hackathon_id: hackathon.id,
        leader_id: leader.id,
        food_tokens_total: t.members.length + 1,
        food_tokens_used: 0,
        is_registered: t.isRegistered,
        is_qr_active: true,
        invite_token: crypto.randomUUID().replace(/-/g, ""),
        qr_token: crypto.randomUUID().replace(/-/g, ""),
        created_at: now,
        updated_at: now,
      },
    });

    for (const mName of t.members) {
      await prisma.participant_teammember.create({
        data: {
          name: mName,
          email: `${mName.toLowerCase().replace(/ /g, "")}@example.com`,
          college: "Syntra Tech College",
          semester: 4,
          degree: "B.Tech CSE",
          created_at: now,
          team_id: team.id,
        },
      });
    }

    console.log(`Created Team "${team.name}" (ID: ${team.id}) with leader ${t.leaderEmail} (${t.isRegistered ? "Registered/Paid" : "Unpaid"})`);
  }

  console.log("\nSeeding complete!");
  console.log("--------------------------------------------------");
  console.log("ORGANIZER CREDENTIALS:");
  console.log("  Email: organizer@example.com");
  console.log("  Password: password123");
  console.log("PARTICIPANT CREDENTIALS:");
  console.log("  Email: leader1@example.com (Unpaid Team leader)");
  console.log("  Email: leader2@example.com (Paid Team leader)");
  console.log("  Email: leader3@example.com (Unpaid Team leader)");
  console.log("  Password: password123");
  console.log("--------------------------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
