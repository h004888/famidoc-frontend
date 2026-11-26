const path = require('node:path');
const backendModules = path.resolve(__dirname, '../../../famidoc-backend/node_modules');
const { PrismaClient } = require(path.join(backendModules, '@prisma/client'));
const bcrypt = require(path.join(backendModules, 'bcryptjs'));

const DATABASE_URL =
  process.env.E2E_DATABASE_URL ||
  'postgresql://postgres:postgres@127.0.0.1:5432/famidoc_test?schema=payment_settings_test_0123456789abcdef';

const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

const ADMIN_EMAIL = 'admin-payment-e2e@famidoc.local';
const FAMILY_EMAIL = 'family-payment-e2e@famidoc.local';
const PASSWORD = 'Password123!';

async function seed() {
  await prisma.paymentConfigurationTestDelivery.deleteMany({});
  await prisma.paymentConfigurationTestSession.deleteMany({});
  await prisma.paymentConfigurationCheckWindow.deleteMany({});
  await prisma.paymentWebhookCredentialWindow.deleteMany({});
  await prisma.paymentAccountReconciliationState.deleteMany({});
  await prisma.sePayReconciliationRun.deleteMany({});
  await prisma.paymentReconciliationBatch.deleteMany({});
  await prisma.paymentSettingsHead.deleteMany({});
  await prisma.paymentSettingsRevision.deleteMany({});
  await prisma.paymentMonitoredAccount.deleteMany({});
  await prisma.paymentTransaction.deleteMany({});
  await prisma.invoice.deleteMany({});

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash, role: 'ADMIN', status: 'ACTIVE', failedLoginAttempts: 0, lockedUntil: null },
    create: {
      email: ADMIN_EMAIL,
      phone: '0909990001',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      fullName: 'Admin Payment E2E',
    },
  });

  const family = await prisma.user.upsert({
    where: { email: FAMILY_EMAIL },
    update: { passwordHash, role: 'FAMILY_REP', status: 'ACTIVE', failedLoginAttempts: 0, lockedUntil: null },
    create: {
      email: FAMILY_EMAIL,
      phone: '0909990002',
      passwordHash,
      role: 'FAMILY_REP',
      status: 'ACTIVE',
      fullName: 'Family Payment E2E',
    },
  });

  console.log(
    JSON.stringify({
      adminEmail: admin.email,
      adminId: admin.id,
      familyEmail: family.email,
      familyId: family.id,
      password: PASSWORD,
    }),
  );
}

async function inspect() {
  const [revisions, monitoredAccounts, testSessions, testDeliveries, invoices, paymentTransactions, batches, runs] =
    await Promise.all([
      prisma.paymentSettingsRevision.count(),
      prisma.paymentMonitoredAccount.count(),
      prisma.paymentConfigurationTestSession.findMany({
        select: { id: true, code: true, status: true, amountVnd: true },
      }),
      prisma.paymentConfigurationTestDelivery.findMany({
        select: { id: true, source: true, sessionId: true, providerTransactionId: true },
      }),
      prisma.invoice.count(),
      prisma.paymentTransaction.count(),
      prisma.paymentReconciliationBatch.findMany({
        select: { id: true, status: true, environment: true },
      }),
      prisma.sePayReconciliationRun.findMany({
        select: { id: true, batchId: true, monitoredAccountId: true, status: true },
      }),
    ]);

  console.log(
    JSON.stringify({
      revisions,
      monitoredAccounts,
      testSessions,
      testDeliveries,
      invoices,
      paymentTransactions,
      batches,
      runs,
    }),
  );
}

(async () => {
  const action = process.argv[2] || 'seed';
  if (action === 'seed') await seed();
  else if (action === 'inspect') await inspect();
  else throw new Error(`Unknown action: ${action}`);
})()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
