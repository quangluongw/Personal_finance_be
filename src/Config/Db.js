import mongoose from "mongoose"

export const ConnectDb = async () => {
    try {
        await mongoose.connect(
          "mongodb+srv://quang20042204_db_user:RCmoQVsL9hZnMFjJ@cluster0.asizqsh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
        ).then();
    } catch (error) {
    console.log(error);
        
    }
}