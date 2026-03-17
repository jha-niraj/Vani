import prisma from "./client";

async function main() {
    const demoEmail = process.env.DEMO_USER_EMAIL?.toLowerCase() || "demo@vani.app";

    await prisma.user.upsert({
        where: { email: demoEmail },
        update: {
            name: "Vani Demo User",
            emailVerified: new Date(),
        },
        create: {
            email: demoEmail,
            name: "Vani Demo User",
            emailVerified: new Date(),
        },
    });

    console.log(`Seed complete. Demo user ready: ${demoEmail}`);
}

main()
    .catch((error) => {
        console.error("Seed failed:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
