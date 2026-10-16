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

/** Dados próprios deste bloco (testes anteriores apagam o seed inicial). */
const seedNotificationData = async () => {
  const conn = (id, name) =>
    db
      .collection("connections")
      .doc(id)
      .set({ tenantId: "alice", name, status: "active" });
  const contact = (id, connectionId, name) =>
    db.collection("contacts").doc(id).set({
      tenantId: "alice",
      connectionId,
      name,
      phone: "+55 11 90000-0000",
    });
  await Promise.all([
    conn("n-conn-a", "Alice"),
    conn("n-conn-b", "Outra"),
    contact("n-contact-1", "n-conn-a", "Ana"),
    contact("n-contact-2", "n-conn-a", "Bia"),
    contact("n-contact-3", "n-conn-b", "Caio"),
  ]);
};
await seedNotificationData();

test("audience connections sends one message per connection to all of its contacts", async () => {
  const result = await functions.createMessage.run(
    as("alice", {
      audience: "connections",
      connectionIds: ["n-conn-a", "n-conn-b"],
      body: "Para todas",
      mode: "now",
    }),
  );
  assert.equal(result.ids.length, 2);
  assert.equal(result.connectionCount, 2);
  // 2 contatos em n-conn-a + 1 em n-conn-b.
  assert.equal(result.recipientCount, 3);

  const messages = await Promise.all(
    result.ids.map((id) => db.collection("messages").doc(id).get()),
  );
  assert.deepEqual(
    messages.map((message) => message.get("connectionId")).sort(),
    ["n-conn-a", "n-conn-b"],
  );
  for (const message of messages) {
    assert.equal(message.get("status"), "sent");
    assert.equal(message.get("tenantId"), "alice");
    assert.equal(message.get("body"), "Para todas");
  }
});

test("audience connections rejects other tenants, empty picks and connections without contacts", async () => {
  await assert.rejects(
    () =>
      functions.createMessage.run(
        as("alice", {
          audience: "connections",
          connectionIds: ["bob-connection"],
          body: "Oi",
          mode: "now",
        }),
      ),
    code("not-found"),
  );
  await assert.rejects(
    () =>
      functions.createMessage.run(
        as("alice", {
          audience: "connections",
          connectionIds: [],
          body: "Oi",
          mode: "now",
        }),
      ),
    code("invalid-argument"),
  );
  await db
    .collection("connections")
    .doc("n-conn-empty")
    .set({ tenantId: "alice", name: "Vazia", status: "active" });
  await assert.rejects(
    () =>
      functions.createMessage.run(
        as("alice", {
          audience: "connections",
          connectionIds: ["n-conn-empty"],
          body: "Oi",
          mode: "now",
        }),
      ),
    (error) => error.details?.key === "noContactsInConnections",
  );
});

test("an immediate message creates a notification with the connection and recipient count", async () => {
  const { id } = await functions.createMessage.run(
    as(
      "alice",
      newMessage({ connectionId: "n-conn-a", contactIds: ["n-contact-1"] }),
    ),
  );
  const notification = await db.collection("notifications").doc(id).get();
  assert.equal(notification.get("tenantId"), "alice");
  assert.equal(notification.get("type"), "message_sent");
  assert.equal(notification.get("connectionName"), "Alice");
  assert.equal(notification.get("recipientCount"), 1);
  assert.equal(notification.get("scheduled"), false);
  assert.equal(notification.get("read"), false);
});

test("a scheduled message only notifies when the sweep sends it, exactly once", async () => {
  const { id } = await functions.createMessage.run(
    as(
      "alice",
      newMessage({
        connectionId: "n-conn-a",
        contactIds: ["n-contact-1"],
        mode: "scheduled",
        scheduledAt: hoursFromNow(1),
      }),
    ),
  );
  const notification = db.collection("notifications").doc(id);
  assert.equal((await notification.get()).exists, false);

  await db
    .collection("messages")
    .doc(id)
    .update({ scheduledAt: secondsAgo(1) });
  await Promise.all([processDueMessages(), processDueMessages()]);
  const created = await notification.get();
  assert.equal(created.get("scheduled"), true);
  assert.equal(created.get("connectionName"), "Alice");

  // Marcar como lida e rodar a varredura de novo não recria o aviso.
  await notification.update({ read: true });
  await processDueMessages();
  assert.equal((await notification.get()).get("read"), true);
});

test("deleting a message also removes its notification", async () => {
  const { id } = await functions.createMessage.run(
    as(
      "alice",
      newMessage({ connectionId: "n-conn-a", contactIds: ["n-contact-1"] }),
    ),
  );
  await functions.deleteMessage.run(as("alice", { messageId: id }));
  assert.equal(
    (await db.collection("notifications").doc(id).get()).exists,
    false,
  );
});
