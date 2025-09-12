const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const listingsRoutes = require("./routes/listings");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/listings", listingsRoutes);


app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});