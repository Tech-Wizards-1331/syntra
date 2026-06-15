const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = 8; // test3@gmail.com which has is_profile_complete: false and role: participant
  const now = new Date();

  console.log('Running test transaction on user:', userId);
  const result = await prisma.$transaction(async (tx) => {
    // 1. Resolve skills
    const skills = ["React", "CustomSkillX"];
    const skillRecords = await Promise.all(
      skills.map(async (skillName) => {
        const trimmed = skillName.trim();
        let record = await tx.participant_skill.findUnique({
          where: { name: trimmed },
        });
        if (!record) {
          record = await tx.participant_skill.create({
            data: { name: trimmed },
          });
        }
        return record;
      })
    );

    console.log('Skills resolved:', skillRecords);

    // 2. Upsert Participant Profile
    const profile = await tx.participant_participantprofile.upsert({
      where: { user_id: userId },
      update: {
        college: "Stanford",
        semester: 4,
        degree: "CS",
        visibility: true,
        updated_at: now,
      },
      create: {
        user_id: userId,
        college: "Stanford",
        semester: 4,
        degree: "CS",
        visibility: true,
        created_at: now,
        updated_at: now,
      },
    });

    console.log('Profile upserted:', profile);

    // 3. Sync skills mappings
    const deleteRes = await tx.participant_participantprofile_skills.deleteMany({
      where: { participantprofile_id: profile.id },
    });
    console.log('Deleted skills mapping count:', deleteRes.count);

    if (skillRecords.length > 0) {
      const createRes = await tx.participant_participantprofile_skills.createMany({
        data: skillRecords.map((skill) => ({
          participantprofile_id: profile.id,
          skill_id: skill.id,
        })),
      });
      console.log('Created skills mapping count:', createRes.count);
    }

    // 4. Mark accounts_user profile as complete
    const userUpdate = await tx.accounts_user.update({
      where: { id: userId },
      data: {
        is_profile_complete: true,
        updated_at: now,
      },
    });
    console.log('User marked as complete:', userUpdate.is_profile_complete);

    return {
      success: true,
      profileId: profile.id,
    };
  });
  console.log('Transaction result:', result);
}

main()
  .catch(e => console.error('Transaction failed:', e))
  .finally(async () => {
    await prisma.$disconnect();
  });
