import { MongoClient } from "mongodb";

async function connect() {
  const url = `mongodb+srv://root:${process.env.DB_PWD}@riders.hd4vtve.mongodb.net/admin?authSource=admin&replicaSet=atlas-7ub5o0-shard-0&w=majority&readPreference=primary&appname=riders&retryWrites=true&ssl=true`;
  const client = new MongoClient(url);
  await client.connect();
  console.log("Connected successfully to server");
  const db = client.db("greyt");
  return {
    db,
    close: async () => {
      await client.close();
    },
  };
}

export default { connect };
