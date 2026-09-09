const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const fileArgIndex = args.indexOf("--file");
  const filePath = fileArgIndex !== -1 ? args[fileArgIndex + 1] : null;

  console.log("==================================================");
  console.log("   Syntra Enrollment Number Backfill Script");
  console.log(`   Mode: ${isDryRun ? "DRY RUN (No DB changes)" : "LIVE (Applying changes to DB)"}`);
  if (filePath) {
    console.log(`   Reconciling from Excel file: ${filePath}`);
  } else {
    console.log("   Mode: DB Inspection (Migrating misplaced member emails to enrollment numbers)");
  }
  console.log("==================================================\n");

  if (filePath) {
    await backfillFromExcel(filePath, isDryRun);
  } else {
    await backfillFromDb(isDryRun);
  }

  await prisma.$disconnect();
}

async function backfillFromExcel(filePath, isDryRun) {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`Error: File not found at path: ${fullPath}`);
    return;
  }

  const workbook = XLSX.readFile(fullPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  console.log(`Parsed ${rawRows.length} rows from ${path.basename(fullPath)}.\n`);

  let updatedTeamsCount = 0;
  let updatedMembersCount = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const normalizedRow = {};
    for (const [k, v] of Object.entries(row)) {
      normalizedRow[k.toLowerCase().replace(/[^a-z0-9]/g, "")] = typeof v === "string" ? v.trim() : String(v || "");
    }

    const getField = (aliases) => {
      for (const a of aliases) {
        if (normalizedRow[a]) return normalizedRow[a];
      }
      return "";
    };

    const teamName = getField(["teamname", "name", "team"]);
    const leaderEmail = getField(["teamleaderemail", "leaderemail", "email", "emailid", "teamleaderemailaddress"]).toLowerCase();
    const leaderEnrollment = getField([
      "teamleaderenrollmentnumber",
      "teamleaderenrollmentno",
      "teamleaderenrollment",
      "leaderenrollmentnumber",
      "leaderenrollmentno",
      "leaderenrollment",
      "enrollmentnumber",
      "enrollmentno",
      "enrollment",
      "leaderenroll",
    ]);

    if (!teamName && !leaderEmail) continue;

    // Find team in DB
    const team = await prisma.participant_team.findFirst({
      where: {
        OR: [
          leaderEmail ? { accounts_user: { email: leaderEmail } } : undefined,
          teamName ? { name: teamName } : undefined,
        ].filter(Boolean),
      },
      include: {
        accounts_user: true,
        participant_teammember: {
          orderBy: { created_at: "asc" },
        },
      },
    });

    if (!team) {
      console.log(`⚠️  [Skip] Team "${teamName}" (${leaderEmail}) not found in DB.`);
      continue;
    }

    console.log(`📌 Processing Team: "${team.name}" (ID: ${team.id})`);

    // 1. Update Leader Member
    const leaderMember = team.participant_teammember.find(
      (m) => m.email.toLowerCase() === team.accounts_user.email.toLowerCase()
    ) || team.participant_teammember[0];

    if (leaderMember && leaderEnrollment) {
      console.log(`   ↳ [Leader] ${leaderMember.name}: Setting enrollment_number = "${leaderEnrollment}"`);
      if (!isDryRun) {
        await prisma.participant_teammember.update({
          where: { id: leaderMember.id },
          data: { enrollment_number: leaderEnrollment },
        });

        // Also update leader profile if exists
        await prisma.participant_participantprofile.updateMany({
          where: { user_id: team.leader_id },
          data: { enrollment_number: leaderEnrollment },
        });
      }
      updatedMembersCount++;
    }

    // 2. Update Other Members
    const otherMembers = team.participant_teammember.filter((m) => m.id !== leaderMember?.id);

    for (let mIdx = 0; mIdx < otherMembers.length; mIdx++) {
      const member = otherMembers[mIdx];
      const slotNum = mIdx + 2;

      const mEnroll = getField([
        `member${slotNum}enrollmentnumber`,
        `member${slotNum}enrollmentno`,
        `member${slotNum}enrollment`,
        `member${slotNum}enroll`,
        `othermember${slotNum}enrollmentnumber`,
        `othermember${slotNum}enrollmentno`,
        `othermember${slotNum}enrollment`,
        `teammember${slotNum}enrollmentnumber`,
        `teammember${slotNum}enrollmentno`,
      ]);

      const finalEnroll = mEnroll || (member.email && !member.email.includes("@") && !member.email.startsWith("mem_") ? member.email : null);
      const isPlaceholderNeeded = !member.email || !member.email.includes("@") || !member.email.endsWith("@student.syntra");
      const cleanEmail = `mem_${team.id}_${member.id}@student.syntra`;

      console.log(`   ↳ [Member ${slotNum}] ${member.name}: Setting enrollment_number = "${finalEnroll || 'N/A'}" (Email reset to internal placeholder)`);

      if (!isDryRun) {
        await prisma.participant_teammember.update({
          where: { id: member.id },
          data: {
            enrollment_number: finalEnroll || member.enrollment_number || null,
            email: isPlaceholderNeeded ? cleanEmail : member.email,
          },
        });
      }
      updatedMembersCount++;
    }

    updatedTeamsCount++;
  }

  console.log("\n==================================================");
  console.log(`✅ Completed: Updated ${updatedTeamsCount} teams and ${updatedMembersCount} member records.`);
  console.log("==================================================");
}

async function backfillFromDb(isDryRun) {
  const teams = await prisma.participant_team.findMany({
    include: {
      accounts_user: true,
      participant_teammember: {
        orderBy: { created_at: "asc" },
      },
    },
  });

  console.log(`Found ${teams.length} teams in database.\n`);

  let updatedMembersCount = 0;

  for (const team of teams) {
    const leaderMember = team.participant_teammember.find(
      (m) => m.email.toLowerCase() === team.accounts_user.email.toLowerCase()
    ) || team.participant_teammember[0];

    const otherMembers = team.participant_teammember.filter((m) => m.id !== leaderMember?.id);

    // If Member 2 has an enrollment number in email column and leader has no enrollment number
    const member2 = otherMembers[0];
    if (member2 && member2.email && !member2.email.includes("@") && !member2.email.startsWith("mem_")) {
      const misplacedEnrollment = member2.email;

      console.log(`📌 Team "${team.name}" (ID: ${team.id}):`);
      console.log(`   Found misplaced enrollment "${misplacedEnrollment}" on Member "${member2.name}"`);

      // If leader has no enrollment number and member2 was given leader's enrollment
      if (leaderMember && !leaderMember.enrollment_number) {
        console.log(`   ↳ Moving enrollment "${misplacedEnrollment}" to Leader "${leaderMember.name}"`);
        if (!isDryRun) {
          await prisma.participant_teammember.update({
            where: { id: leaderMember.id },
            data: { enrollment_number: misplacedEnrollment },
          });
          await prisma.participant_participantprofile.updateMany({
            where: { user_id: team.leader_id },
            data: { enrollment_number: misplacedEnrollment },
          });
        }
      }

      // Reset member2 email to clean internal placeholder
      const cleanEmail = `mem_${team.id}_${member2.id}@student.syntra`;
      console.log(`   ↳ Resetting Member "${member2.name}" email to "${cleanEmail}"`);
      if (!isDryRun) {
        await prisma.participant_teammember.update({
          where: { id: member2.id },
          data: {
            email: cleanEmail,
          },
        });
      }
      updatedMembersCount++;
    }

    // Check all other members for numeric emails
    for (const m of otherMembers) {
      if (m.email && !m.email.includes("@") && !m.email.startsWith("mem_")) {
        const enrollVal = m.email;
        const cleanEmail = `mem_${team.id}_${m.id}@student.syntra`;
        console.log(`   ↳ Member "${m.name}": Moving email "${enrollVal}" to enrollment_number`);
        if (!isDryRun) {
          await prisma.participant_teammember.update({
            where: { id: m.id },
            data: {
              enrollment_number: enrollVal,
              email: cleanEmail,
            },
          });
        }
        updatedMembersCount++;
      }
    }
  }

  console.log("\n==================================================");
  console.log(`✅ Completed: Inspected DB and updated ${updatedMembersCount} member records.`);
  console.log("==================================================");
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
