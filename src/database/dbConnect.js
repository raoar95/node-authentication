import mongoose from "mongoose";
import { DB_NAME } from "../constant/constant.js";
import { app } from "../app.js";

const port = process.env.PORT || 5000;

const connectDB = async () => {
  try {
    //? We can Directly Use `await` to CONNECT with MONGODB but Store in VARIABLE because to KNOW DB HOST.
    //? Sometimes There are Different server for database, testing, etc.
    const dbConnect = await mongoose.connect(
      // process.env.MONGODB_URI
      // `${process.env.MONGODB_URI}/${DB_NAME}`
      `${process.env.MONGODB_URI}/${DB_NAME}?retryWrites=true&w=majority`
    );
    console.log(`DB Host: ${dbConnect.connection.host}`);

    app.on("error", () => {
      console.error("Error Connecting With Express: ", error);
      throw error;
      // OR
      // process.exit(1);
    });

    app.listen(port, () => {
      console.log(`App listening on port ${port}`);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB: ", error);
    throw error;
    // OR
    // process.exit(1);
  }
};

export default connectDB;
