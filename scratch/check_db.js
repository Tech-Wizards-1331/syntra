const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.accounts_user.findMany({
    where: { role: 'organizer' },
    include: {
      organizer_organizerprofile: true
    }
  });
  console.log('Organizer users:', JSON.stringify(users, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
