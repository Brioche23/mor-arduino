console.log("Firebase fired!");

let allTrees; // Contains all Trees
let updateStrappi; //  add a msg to the DB
let allUsers;
let updateLunghezza;
let updateRotolo;
let updateTot;
let addUsedRoll;
let updateTurnings;

// Load and initialize Firebase
async function firebaseSetup() {
  // load firebase modules using import("url")
  const fb_app = "https://www.gstatic.com/firebasejs/9.5.0/firebase-app.js";
  const fb_database =
    "https://www.gstatic.com/firebasejs/9.5.0/firebase-database.js";

  // Load the libraries
  const { initializeApp } = await import(fb_app);
  console.log("initializeApp:", initializeApp);
  const { getDatabase, ref, push, set, update, onValue } = await import(
    fb_database
  );

  // Your web app's Firebase configuration
  // You can get this information from the firebase console
  const firebaseConfig = {
    apiKey: "AIzaSyCc5zNUGU3WbiU37F2jFlcaWAP-Z_tqKZ0",
    authDomain: "mor-tree-database.firebaseapp.com",
    projectId: "mor-tree-database",
    storageBucket: "mor-tree-database.appspot.com",
    messagingSenderId: "515733813854",
    appId: "1:515733813854:web:1ccc8d97f0d8511ac692cf",
    databaseURL:
      "https://mor-tree-database-default-rtdb.europe-west1.firebasedatabase.app/",
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  // console.log("app:", app);
  // Initialize Database
  const myDatabase = getDatabase(app);

  //Reference to a specific property of the database
  const trees_ref = ref(myDatabase, "trees");
  const user_ref = ref(myDatabase, "user");
  // console.log("greetings_ref:", trees_ref);
  // console.log("user_ref:", user_ref);

  //Function to update strappi value
  updateStrappi = (id, newStrappi, newSpesa) => {
    const strappiRef = ref(myDatabase, "trees/" + id + "/strappi");
    const strappiTotRef = ref(myDatabase, "user/dati_generici/strappi_tot");
    const spesaTotRef = ref(myDatabase, "user/dati_generici/spesa_tot");
    const strappiRollRef = ref(myDatabase, "user/rotolo_in_uso/n_strappi");
    const n_strappi = allTrees[id].strappi + newStrappi;
    const n_strappi_user = allUsers.dati_generici.strappi_tot + newStrappi;
    const n_spesa_user = allUsers.dati_generici.spesa_tot + newSpesa;
    const n_strappi_new = allUsers.rotolo_in_uso.n_strappi + newStrappi;
    console.log("treesRef:", strappiRef);
    set(strappiRef, n_strappi);
    set(strappiTotRef, n_strappi_user);
    set(spesaTotRef, n_spesa_user);
    set(strappiRollRef, n_strappi_new);
  };

  updateNextRoll = (nextRoll) => {
    const nextRollRef = ref(myDatabase, "user/dati_generici/next_roll");
    console.log("nextRollRef:", nextRollRef);
    set(nextRollRef, nextRoll);
  };

  updateLunghezza = (newLunghezza) => {
    const lunghezzaRef = ref(myDatabase, "user/rotolo_in_uso/lunghezza");
    // // console.log("lunghezzaRef:", lunghezzaRef);
    set(lunghezzaRef, newLunghezza);
  };

  updateRotolo = (newRotolo) => {
    const rollRef = ref(myDatabase, "user/rotolo_in_uso");
    set(rollRef, newRotolo);
  };

  updateTurnings = (newTurnings) => {
    const rollTurnings = ref(myDatabase, "user/rotolo_in_uso/turnings");
    set(rollTurnings, newTurnings);
  };

  addUsedRoll = (usedRoll) => {
    const used_ref = ref(myDatabase, "user/rotoli_usati");
    const usedRef = push(used_ref);
    set(usedRef, usedRoll);
  };

  // onValue(ref, function) monitors a ref
  //  Snapshot value of the ref in that moment
  onValue(trees_ref, (snapshot) => {
    allTrees = snapshot.val();
    // // console.table(allTrees);
  });

  onValue(user_ref, (snapshot) => {
    allUsers = snapshot.val();
    // // console.table(allUsers);
  });
}

firebaseSetup();
