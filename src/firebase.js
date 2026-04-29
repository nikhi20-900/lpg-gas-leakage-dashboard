import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

export const firebaseConfig = {
  apiKey: "AIzaSyBbu5HSVT5t-H-Xxe2Zqj3W9eTQJTHXesE",
  databaseURL: "https://lpg-gas-leakage-288b0-default-rtdb.asia-southeast1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);
