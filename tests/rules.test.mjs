import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import {
  addDoc,
  deleteDoc,
  getCountFromServer,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

let environment;
let alice;
let bob;

before(async () => {
  environment = await initializeTestEnvironment({
    projectId: "demo-broadcast-rules",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
  alice = environment.authenticatedContext("alice").firestore();
  bob = environment.authenticatedContext("bob").firestore();
  await environment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();
    await setDoc(doc(database, "connections", "alice-connection"), {
      tenantId: "alice",
      name: "Alice",
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(database, "connections", "bob-connection"), {
      tenantId: "bob",
      name: "Bob",
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(database, "contacts", "alice-contact"), {
      tenantId: "alice",
      connectionId: "alice-connection",
      name: "Contato Alice",
      phone: "+55 11 99999-9999",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(database, "messages", "alice-message"), {
      tenantId: "alice",
      connectionId: "alice-connection",
      body: "Olá",
      contactIds: ["alice-contact"],
      recipients: [
        {
          id: "alice-contact",
          name: "Contato Alice",
          phone: "+55 11 99999-9999",
        },
      ],
      status: "sent",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
});
after(async () => {
  await environment?.cleanup();
});

test("a tenant only reads their own documents and scoped queries", async () => {
  await assertSucceeds(getDoc(doc(alice, "connections", "alice-connection")));
  await assertFails(getDoc(doc(bob, "connections", "alice-connection")));
  await assertFails(getDoc(doc(bob, "contacts", "alice-contact")));
  await assertFails(getDoc(doc(bob, "messages", "alice-message")));
  await assertSucceeds(
    getDocs(
      query(collection(alice, "connections"), where("tenantId", "==", "alice")),
    ),
  );
  await assertSucceeds(
    getDocs(
      query(
        collection(alice, "contacts"),
        where("tenantId", "==", "alice"),
        where("connectionId", "==", "alice-connection"),
      ),
    ),
  );
  await assertSucceeds(
    getDocs(
      query(
        collection(alice, "messages"),
        where("tenantId", "==", "alice"),
        where("connectionId", "==", "alice-connection"),
      ),
    ),
  );
  await assertFails(getDocs(collection(alice, "connections")));
  await assertFails(
    getDocs(
      query(
        collection(bob, "messages"),
        where("connectionId", "==", "alice-connection"),
      ),
    ),
  );
});

test("connections and contacts reject tenant spoofing and cross-tenant references", async () => {
  await assertSucceeds(
    addDoc(collection(alice, "connections"), {
      tenantId: "alice",
      name: "Nova",
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    addDoc(collection(alice, "connections"), {
      tenantId: "bob",
      name: "Falsa",
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    addDoc(collection(alice, "connections"), {
      tenantId: "alice",
      name: "   ",
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    addDoc(collection(alice, "contacts"), {
      tenantId: "alice",
      connectionId: "bob-connection",
      name: "Intruso",
      phone: "+55 11 98888-8888",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  const ownContact = await assertSucceeds(
    addDoc(collection(alice, "contacts"), {
      tenantId: "alice",
      connectionId: "alice-connection",
      name: "Novo contato",
      phone: "+55 11 98888-8888",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    updateDoc(ownContact, {
      name: "Contato atualizado",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(ownContact, { tenantId: "bob", updatedAt: serverTimestamp() }),
  );
  await assertFails(
    updateDoc(doc(bob, "connections", "alice-connection"), {
      name: "Alterada",
      updatedAt: serverTimestamp(),
    }),
  );
});

test("tenant profiles are private and can only be created for the own uid", async () => {
  const profile = (email) => ({
    email,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await assertSucceeds(
    setDoc(doc(alice, "tenants", "alice"), profile("a@x.com")),
  );
  await assertFails(setDoc(doc(alice, "tenants", "bob"), profile("a@x.com")));
  await assertFails(
    setDoc(doc(alice, "tenants", "alice"), {
      ...profile("a@x.com"),
      plan: "pro",
    }),
  );
  await assertSucceeds(getDoc(doc(alice, "tenants", "alice")));
  await assertFails(getDoc(doc(bob, "tenants", "alice")));
  await assertFails(
    updateDoc(doc(alice, "tenants", "alice"), {
      email: "b@x.com",
      updatedAt: serverTimestamp(),
    }),
  );
});

test("tenants can edit only their name and photo, with limits", async () => {
  const profile = doc(alice, "tenants", "alice");
  const edit = (data) =>
    updateDoc(profile, { ...data, updatedAt: serverTimestamp() });
  const smallPhoto = "data:image/jpeg;base64," + "A".repeat(5000);

  await assertSucceeds(edit({ name: "Alice Souza" }));
  await assertSucceeds(edit({ photoData: smallPhoto }));
  await assertSucceeds(edit({ photoData: null })); // remover a foto

  // Nome inválido, foto de outro tipo ou grande demais.
  await assertFails(edit({ name: "A" }));
  await assertFails(edit({ name: "x".repeat(61) }));
  await assertFails(edit({ photoData: "https://exemplo.com/foto.png" }));
  await assertFails(
    edit({ photoData: "data:image/jpeg;base64," + "A".repeat(130000) }),
  );
  await assertFails(edit({ photoData: 123 }));
  // Campos que o cliente não pode mexer.
  await assertFails(edit({ createdAt: serverTimestamp() }));
  await assertFails(edit({ plan: "pro" }));
  // Outro cliente não edita este perfil.
  await assertFails(
    updateDoc(doc(bob, "tenants", "alice"), {
      name: "Invasor",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(deleteDoc(profile));
});

test("a profile can be created with a valid name only", async () => {
  const carol = environment.authenticatedContext("carol").firestore();
  const dave = environment.authenticatedContext("dave").firestore();
  const create = (db, uid, data) =>
    setDoc(doc(db, "tenants", uid), {
      email: "x@x.com",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...data,
    });
  await assertFails(create(carol, "carol", { name: "" }));
  await assertSucceeds(create(carol, "carol", { name: "Carol Lima" }));
  await assertSucceeds(create(dave, "dave", {})); // contas antigas, sem nome
});

test("connections cannot be deleted or have status and ownership changed by the client", async () => {
  await assertFails(deleteDoc(doc(alice, "connections", "alice-connection")));
  await assertFails(
    updateDoc(doc(alice, "connections", "alice-connection"), {
      status: "deleting",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(alice, "connections", "alice-connection"), {
      tenantId: "bob",
      updatedAt: serverTimestamp(),
    }),
  );
});

test("contacts keep their connection, validate phones and block cross-tenant deletes", async () => {
  const contact = doc(alice, "contacts", "alice-contact");
  await assertFails(
    updateDoc(contact, {
      connectionId: "bob-connection",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(contact, { phone: "abc", updatedAt: serverTimestamp() }),
  );
  await assertFails(deleteDoc(doc(bob, "contacts", "alice-contact")));
  await assertSucceeds(
    updateDoc(contact, {
      phone: "+55 11 90000-0000",
      updatedAt: serverTimestamp(),
    }),
  );
});

test("writes to a connection that is being deleted are rejected", async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "connections", "alice-deleting"), {
      tenantId: "alice",
      name: "Em exclusão",
      status: "deleting",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  await assertFails(
    addDoc(collection(alice, "contacts"), {
      tenantId: "alice",
      connectionId: "alice-deleting",
      name: "Tarde demais",
      phone: "+55 11 98888-8888",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(alice, "connections", "alice-deleting"), {
      name: "Renomeada",
      updatedAt: serverTimestamp(),
    }),
  );
});

test("count aggregations (dashboard) respect tenant isolation", async () => {
  const sentMessages = (db, tenantId) =>
    query(
      collection(db, "messages"),
      where("tenantId", "==", tenantId),
      where("status", "==", "sent"),
    );
  const aliceCount = await assertSucceeds(
    getCountFromServer(sentMessages(alice, "alice")),
  );
  assert.equal(aliceCount.data().count, 1);
  // Filtrar pelo tenantId de outro cliente ou omitir o filtro é negado.
  await assertFails(getCountFromServer(sentMessages(bob, "alice")));
  await assertFails(getCountFromServer(query(collection(alice, "contacts"))));
});

test("message mutations are backend-only", async () => {
  await assertFails(
    updateDoc(doc(alice, "messages", "alice-message"), { body: "Alterada" }),
  );
  await assertFails(
    setDoc(doc(alice, "messages", "new-message"), {
      tenantId: "alice",
      connectionId: "alice-connection",
      body: "Teste",
    }),
  );
});
