// import express from "express";
// import mongoose from "mongoose";
// import expressLayouts from "express-ejs-layouts";
// const app = express();
// app.use(expressLayouts)
// app.set("layout","layout")
// app.set("view engine", "ejs");
// app.use(express.static("public"))
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());
// const dbConnect = async () => {
//   await mongoose.connect("mongodb://localhost:27017/merndatabase");
// };
// const startServer = async () => {
//   await dbConnect();
//   app.listen(8080, () => console.log("Server started"));
// };
// const productSchema = mongoose.Schema({
//   name: { type: String, required: true },
//   description: { type: String, required: true },
//   price: { type: Number, required: true },
//   imageurl: { type: String, required: true },
// });
// const productModel = mongoose.model("products", productSchema);
// app.get("/", async (req, res) => {
//   const products = await productModel.find();
//   // res.json(products);
//   res.render("index", { products });
// });

// app.get("/add", (req, res) => {
//   res.render("add");
// });
// app.post("/save", async (req, res) => {
//   const body = req.body;
//   const result = await productModel.create(body);
//   res.redirect("/");
//   // res.json({ message: "Product created" });
// });

// app.get("/:id/edit", async (req, res) => {
//   const id = req.params.id;
//   const product = await productModel.findOne({ _id: id });
//   res.render("edit", { product });
// });

// app.post("/:id/save-product", async (req, res) => {
//   const id = req.params.id;
//   const body = req.body;
//   await productModel.findByIdAndUpdate(id, body);
//   res.redirect("/");
// });

// app.get("/:id/delete", async (req, res) => {
//   const id = req.params.id;
//   await productModel.findByIdAndDelete(id);
//   res.redirect("/");
// });

// startServer();
import express from "express";
import mongoose from "mongoose";
import expressLayouts from "express-ejs-layouts";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(expressLayouts);
app.set("layout", "layout");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// DB connection with caching for serverless
let isConnected = false;
const dbConnect = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
  } catch (err) {
    isConnected = false;
    throw err;
  }
};

const productSchema = mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String, required: true },
  price:       { type: Number, required: true },
  imageurl:    { type: String, required: true },
});
const productModel = mongoose.model("products", productSchema);

// DB middleware
app.use(async (req, res, next) => {
  try {
    await dbConnect();
    next();
  } catch (err) {
    res.status(500).send("Database connection failed: " + err.message);
  }
});

app.get("/", async (req, res) => {
  const products = await productModel.find();
  res.render("index", { products });
});

app.get("/add", (req, res) => {
  res.render("add");
});

app.post("/save", async (req, res) => {
  await productModel.create(req.body);
  res.redirect("/");
});

app.get("/:id/edit", async (req, res) => {
  const product = await productModel.findById(req.params.id);
  res.render("edit", { product });
});

app.post("/:id/save-product", async (req, res) => {
  await productModel.findByIdAndUpdate(req.params.id, req.body);
  res.redirect("/");
});

app.get("/:id/delete", async (req, res) => {
  await productModel.findByIdAndDelete(req.params.id);
  res.redirect("/");
});

export default app;