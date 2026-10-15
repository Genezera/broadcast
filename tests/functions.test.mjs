import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

process.env.GCLOUD_PROJECT = "demo-broadcast-functions";
const functions = await import("../functions/lib/index.js");
const { processDueMessages } =
  await import("../functions/lib/scheduled/processScheduled.js");
const db = getFirestore();

/** Simula a chamada autenticada de uma callable. */
const as = (uid, data) => ({ auth: { uid }, data });
const anonymous = (data) => ({ auth: undefined, data });

const hoursFromNow = (hours) =>
  new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
const secondsAgo = (seconds) =>
  Timestamp.fromMillis(Date.now() - seconds * 1000);

const newMessage = (overrides = {}) => ({
  connectionId: "alice-connection",
  contactIds: ["alice-contact"],
  body: "Olá",
  mode: "now",
  ...overrides,
});
const code = (expected) => (error) => error?.code === expected;

before(async () => {
  const seed = [
    [
      "connections",
      "alice-connection",
      { tenantId: "alice", name: "Alice", status: "active" },
    ],
    [
      "connections",
      "alice-other-connection",
      { tenantId: "alice", name: "Outra", status: "active" },
    ],
    [
      "connections",
      "bob-connection",
      { tenantId: "bob", name: "Bob", status: "active" },
    ],
    [
      "contacts",
      "alice-contact",
      {
        tenantId: "alice",
        connectionId: "alice-connection",
        name: "Contato Alice",
        phone: "+55 11 99999-9999",
      },
    ],
    [
      "contacts",
      "alice-contact-2",
      {
        tenantId: "alice",
        connectionId: "alice-connection",
        name: "Segundo",
        phone: "+55 11 96666-6666",
      },
    ],
    [
      "contacts",
      "alice-other-contact",
      {
        tenantId: "alice",
        connectionId: "alice-other-connection",
        name: "Outro contato",
        phone: "+55 11 97777-7777",
      },
    ],
    [
      "contacts",
      "bob-contact",
      {
        tenantId: "bob",
        connectionId: "bob-connection",
        name: "Contato Bob",
        phone: "+55 11 98888-8888",
      },
    ],
  ];
  await Promise.all(
    seed.map(([collection, id, data]) =>
      db.collection(collection).doc(id).set(data),
    ),
  );
});

after(async () => {
  await db.terminate();
});

test("createMessage requires authentication and valid input", async () => {
  await assert.rejects(
    () => functions.createMessage.run(anonymous(newMessage())),
    code("unauthenticated"),
  );
  for (const invalid of [
    newMessage({ body: "   " }),
    newMessage({ body: "a".repeat(2001) }),
    newMessage({ contactIds: [] }),
    newMessage({ contactIds: ["alice-contact", "alice-contact"] }),
    newMessage({ connectionId: "../etc" }),
    newMessage({ mode: "scheduled", scheduledAt: undefined }),
    newMessage({
      mode: "scheduled",
      scheduledAt: new Date(Date.now() - 60_000).toISOString(),
    }),
    newMessage({ mode: "scheduled", scheduledAt: hoursFromNow(24 * 400) }),
    newMessage({ mode: "scheduled", scheduledAt: "amanhã" }),
  ]) {
    await assert.rejects(
      () => functions.createMessage.run(as("alice", invalid)),
      code("invalid-argument"),
    );
  }
});

test("createMessage stores an immediate message with recipient snapshots", async () => {
  const { id } = await functions.createMessage.run(as("alice", newMessage()));
  const message = await db.collection("messages").doc(id).get();
  assert.equal(message.get("status"), "sent");
  assert.equal(message.get("tenantId"), "alice");
  assert.equal(message.get("scheduledAt"), null);
  assert.ok(message.get("sentAt"));
  assert.deepEqual(message.get("recipients"), [
    { id: "alice-contact", name: "Contato Alice", phone: "+55 11 99999-9999" },
  ]);
});

test("createMessage rejects cross-tenant and cross-connection references", async () => {
  await assert.rejects(
    () => functions.createMessage.run(as("bob", newMessage())),
    code("not-found"),
  );
  await assert.rejects(
    () =>
      functions.createMessage.run(
        as("alice", newMessage({ contactIds: ["bob-contact"] })),
      ),
    code("invalid-argument"),
  );
  await assert.rejects(
    () =>
      functions.createMessage.run(
        as("alice", newMessage({ contactIds: ["alice-other-contact"] })),
      ),
    code("invalid-argument"),
  );
  await assert.rejects(
    () =>
      functions.createMessage.run(
        as("alice", newMessage({ contactIds: ["inexistente"] })),
      ),
    code("invalid-argument"),
  );
});

test("a scheduled message stays scheduled until the backend sweep finds it due", async () => {
  const { id } = await functions.createMessage.run(
    as(
      "alice",
      newMessage({ mode: "scheduled", scheduledAt: hoursFromNow(1) }),
    ),
  );
  const ref = db.collection("messages").doc(id);
  assert.equal((await ref.get()).get("status"), "scheduled");
  assert.equal((await ref.get()).get("sentAt"), null);

  await processDueMessages();
  assert.equal((await ref.get()).get("status"), "scheduled");

  await ref.update({ scheduledAt: secondsAgo(1) });
  await functions.processScheduledMessages.run({});
  const sent = await ref.get();
  assert.equal(sent.get("status"), "sent");
  assert.ok(sent.get("sentAt"));
});

test("rescheduling to the future prevents a stale sweep from sending", async () => {
  const { id } = await functions.createMessage.run(
    as(
      "alice",
      newMessage({ mode: "scheduled", scheduledAt: hoursFromNow(1) }),
    ),
  );
  const ref = db.collection("messages").doc(id);
  await ref.update({ scheduledAt: secondsAgo(1) });
  await functions.updateMessage.run(
    as("alice", {
      messageId: id,
      contactIds: ["alice-contact"],
      body: "Reagendada",
      mode: "scheduled",
      scheduledAt: hoursFromNow(2),
    }),
  );
  await processDueMessages();
  const message = await ref.get();
  assert.equal(message.get("status"), "scheduled");
  assert.equal(message.get("body"), "Reagendada");
});

test("overlapping sweeps send a message exactly once", async () => {
  const { id } = await functions.createMessage.run(
    as(
      "alice",
      newMessage({ mode: "scheduled", scheduledAt: hoursFromNow(1) }),
    ),
  );
  const ref = db.collection("messages").doc(id);
  await ref.update({ scheduledAt: secondsAgo(1) });

  const counts = await Promise.all([
    processDueMessages(),
    processDueMessages(),
  ]);
  assert.equal(counts[0] + counts[1], 1);

  const sentAt = (await ref.get()).get("sentAt").toMillis();
  await processDueMessages();
  assert.equal((await ref.get()).get("sentAt").toMillis(), sentAt);
});

test("a deleted message is never recreated or sent by the sweep", async () => {
  const { id } = await functions.createMessage.run(
    as(
      "alice",
      newMessage({ mode: "scheduled", scheduledAt: hoursFromNow(1) }),
    ),
  );
  const ref = db.collection("messages").doc(id);
  await ref.update({ scheduledAt: secondsAgo(1) });

  await assert.rejects(
    () => functions.deleteMessage.run(as("bob", { messageId: id })),
    code("not-found"),
  );
  await functions.deleteMessage.run(as("alice", { messageId: id }));
  await processDueMessages();
  assert.equal((await ref.get()).exists, false);
});

test("updateMessage edits a sent record without resending or rescheduling", async () => {
  const { id } = await functions.createMessage.run(as("alice", newMessage()));
  const ref = db.collection("messages").doc(id);
  const sentAt = (await ref.get()).get("sentAt").toMillis();

  await functions.updateMessage.run(
    as("alice", {
      messageId: id,
      contactIds: ["alice-contact", "alice-contact-2"],
      body: "Editada",
      mode: "now",
    }),
  );
  const edited = await ref.get();
  assert.equal(edited.get("body"), "Editada");
  assert.equal(edited.get("recipients").length, 2);
  assert.equal(edited.get("status"), "sent");
  assert.equal(edited.get("sentAt").toMillis(), sentAt);

  await assert.rejects(
    () =>
      functions.updateMessage.run(
        as("alice", {
          messageId: id,
          contactIds: ["alice-contact"],
          body: "Voltar",
          mode: "scheduled",
          scheduledAt: hoursFromNow(1),
        }),
      ),
    code("failed-precondition"),
  );
  await assert.rejects(
    () =>
      functions.updateMessage.run(
        as("bob", {
          messageId: id,
          contactIds: ["bob-contact"],
          body: "x",
          mode: "now",
        }),
      ),
    code("not-found"),
  );
});

test("updateMessage keeps the history of recipients whose contact was removed", async () => {
  await db.collection("contacts").doc("temporary").set({
    tenantId: "alice",
    connectionId: "alice-connection",
    name: "Temporário",
    phone: "+55 11 95555-5555",
  });
  const { id } = await functions.createMessage.run(
    as("alice", newMessage({ contactIds: ["temporary"] })),
  );
  await db.collection("contacts").doc("temporary").delete();

  await functions.updateMessage.run(
    as("alice", {
      messageId: id,
      contactIds: ["temporary"],
      body: "Ainda legível",
      mode: "now",
    }),
  );
  const message = await db.collection("messages").doc(id).get();
  assert.equal(message.get("recipients")[0].name, "Temporário");

  await assert.rejects(
    () =>
      functions.updateMessage.run(
        as("alice", {
          messageId: id,
          contactIds: ["inexistente"],
          body: "x",
          mode: "now",
        }),
      ),
    code("invalid-argument"),
  );
});

test("deleteConnection cascades to contacts and messages and is tenant-scoped", async () => {
  await functions.createMessage.run(
    as(
      "alice",
      newMessage({
        connectionId: "alice-other-connection",
        contactIds: ["alice-other-contact"],
      }),
    ),
  );

  await assert.rejects(
    () =>
      functions.deleteConnection.run(
        as("bob", { connectionId: "alice-other-connection" }),
      ),
    code("not-found"),
  );
  await functions.deleteConnection.run(
    as("alice", { connectionId: "alice-other-connection" }),
  );

  assert.equal(
    (await db.collection("connections").doc("alice-other-connection").get())
      .exists,
    false,
  );
  assert.equal(
    (await db.collection("contacts").doc("alice-other-contact").get()).exists,
    false,
  );
  const messages = await db
    .collection("messages")
    .where("tenantId", "==", "alice")
    .where("connectionId", "==", "alice-other-connection")
    .get();
  assert.equal(messages.size, 0);
  // Os dados das demais conexões permanecem intactos.
  assert.equal(
    (await db.collection("contacts").doc("alice-contact").get()).exists,
    true,
  );
});

test("a connection being deleted rejects new messages", async () => {
  await db
    .collection("connections")
    .doc("alice-connection")
    .update({ status: "deleting" });
  await assert.rejects(
    () => functions.createMessage.run(as("alice", newMessage())),
    code("not-found"),
  );
  await functions.deleteConnection.run(
    as("alice", { connectionId: "alice-connection" }),
  );
  assert.equal(
    (await db.collection("connections").doc("alice-connection").get()).exists,
    false,
  );
});
