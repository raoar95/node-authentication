import mongoose from "mongoose";
import { DB_NAME, SERVER_URL } from "../constant/constant.js";
import { app } from "../app.js";

const port = process.env.PORT || 5000;

const connectDB = async () => {
  try {
    const dbConnect = await mongoose.connect(
      `${SERVER_URL}/${DB_NAME}?retryWrites=true&w=majority`
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
  }
};

export default connectDB;
