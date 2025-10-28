const express = require("express")
const app = express()
const ejs = require("ejs")
const crypto = require("crypto")
const PORT = 3000
const validUrl = require("valid-url")
const mongoose = require("mongoose")
const { url } = require("inspector")
const { json } = require("stream/consumers")
const path = require("path")
const dotenv = require("dotenv")
const Shortner = require("./models/shortnerModel").default

app.set("view engine", "ejs")
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static(path.join(__dirname, "public")))
dotenv.config()

const BASE_URL = process.env.BASE_URL

main().catch((err) => {
  console.log(err)
})

app.get("/", (req, res) => {
  res.render("boilerplate.ejs", { page: "index" })
})

app.get("/display/:shortCode/clicks", async (req, res) => {
  const shortCode = req.params.shortCode
  let result = await Shortner.findOne({ shortCode })
  if (!result) {
    return res.send("Some error occured")
  }
  return res.render("boilerplate.ejs", {
    page: "clicks",
    clicks: result.clicks,
  })
})

app.get("/clicks/:shortCode", async (req, res) => {
  const shortCode = req.params.shortCode
  let result = await Shortner.findOne({ shortCode })
  if (!result) {
    return res.json({ success: false, msg: "URL not Shortened" })
  }
  return res.json({ success: true, clicks: result.clicks })
})

app.get("/:shortCode", async (req, res) => {
  const shortCode = req.params.shortCode
  let result = await Shortner.findOne({ shortCode })
  if (!result) {
    return res.redirect("/")
  }
  if (!result?.originalUrl) {
    return res.redirect("/")
  }
  await Shortner.findOneAndUpdate({ shortCode }, { clicks: result.clicks + 1 })
  return res.redirect(result.originalUrl)
})

app.post("/submit", async (req, res) => {
  try {
    let { inputUrl } = req.body
    if (!/^https?:\/\//i.test(inputUrl)) {
      inputUrl = "https://" + inputUrl
    }
    if (validUrl.isWebUri(inputUrl)) {
      const shortCode = crypto
        .createHash("sha256")
        .update(inputUrl)
        .digest("hex")
        .substring(0, 6)
      let result = await Shortner.findOne({ shortCode })
      if (result) {
        return res.json({
          success: true,
          data: result,
        })
      }
      result = await Shortner.insertMany([
        {
          shortCode,
          originalUrl: inputUrl,
        },
      ])
      return res.json({
        success: true,
        data: result[0],
      })
    } else {
      return res.json({
        success: false,
        msg: "Not a valid URL",
      })
    }
  } catch (err) {
    console.log(err)
    return res.json({
      success: false,
      msg: "Some error occured",
    })
  }
})

app.listen(PORT, () => {
  console.log("server listening at port:", PORT)
})

async function main() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log("connected to DB!")
}
