import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const password = await bcrypt.hash("Password123!", 12);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "alice@example.com" },
      update: {},
      create: {
        name: "Alice Johnson",
        username: "alice",
        email: "alice@example.com",
        password,
        bio: "Love chatting with friends!",
        statusMessage: "Available",
        profilePicture: "https://ui-avatars.com/api/?name=Alice+Johnson&background=6366f1&color=fff",
      },
    }),
    prisma.user.upsert({
      where: { email: "bob@example.com" },
      update: {},
      create: {
        name: "Bob Smith",
        username: "bob",
        email: "bob@example.com",
        password,
        bio: "Software developer",
        statusMessage: "Coding...",
        profilePicture: "https://ui-avatars.com/api/?name=Bob+Smith&background=8b5cf6&color=fff",
      },
    }),
    prisma.user.upsert({
      where: { email: "charlie@example.com" },
      update: {},
      create: {
        name: "Charlie Brown",
        username: "charlie",
        email: "charlie@example.com",
        password,
        bio: "Always online",
        statusMessage: "Hey there!",
        profilePicture: "https://ui-avatars.com/api/?name=Charlie+Brown&background=ec4899&color=fff",
      },
    }),
    prisma.user.upsert({
      where: { email: "diana@example.com" },
      update: {},
      create: {
        name: "Diana Prince",
        username: "diana",
        email: "diana@example.com",
        password,
        bio: "Wonder Woman vibes",
        statusMessage: "Saving the world",
        profilePicture: "https://ui-avatars.com/api/?name=Diana+Prince&background=f59e0b&color=fff",
      },
    }),
  ]);

  const [alice, bob, charlie, diana] = users;

  // Create friendships
  await prisma.friendship.upsert({
    where: { user1Id_user2Id: { user1Id: alice.id, user2Id: bob.id } },
    update: {},
    create: { user1Id: alice.id, user2Id: bob.id },
  });

  await prisma.friendship.upsert({
    where: { user1Id_user2Id: { user1Id: alice.id, user2Id: charlie.id } },
    update: {},
    create: { user1Id: alice.id, user2Id: charlie.id },
  });

  // Pending friend request from Diana to Alice
  await prisma.friendRequest.upsert({
    where: { senderId_receiverId: { senderId: diana.id, receiverId: alice.id } },
    update: {},
    create: { senderId: diana.id, receiverId: alice.id, status: "PENDING" },
  });

  // Create conversation between Alice and Bob
  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: alice.id }, { userId: bob.id }],
      },
    },
  });

  const messages = [
    { senderId: alice.id, content: "Hey Bob! How are you doing?" },
    { senderId: bob.id, content: "Hi Alice! I'm doing great, thanks for asking! 😊" },
    { senderId: alice.id, content: "Want to grab coffee later?" },
    { senderId: bob.id, content: "Sure! How about 3pm at the usual spot?" },
    { senderId: alice.id, content: "Perfect! See you then ☕" },
  ];

  for (const msg of messages) {
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: msg.senderId,
        content: msg.content,
        status: "READ",
      },
    });
  }

  // Create conversation between Alice and Charlie
  const conversation2 = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: alice.id }, { userId: charlie.id }],
      },
    },
  });

  await prisma.message.create({
    data: {
      conversationId: conversation2.id,
      senderId: charlie.id,
      content: "Hey Alice! Did you see the new movie?",
      status: "DELIVERED",
    },
  });

  console.log("✅ Seed completed!");
  console.log("\n📧 Test accounts (password: Password123!):");
  console.log("  alice@example.com");
  console.log("  bob@example.com");
  console.log("  charlie@example.com");
  console.log("  diana@example.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
