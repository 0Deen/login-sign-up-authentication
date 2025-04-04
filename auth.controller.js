import bcrypt from "bcrypt";
import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    // hash pwd
    const hashedPassword = await bcrypt.hash(password, 10);

    // create use nd save to db
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    console.log(newUser);

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to create user" });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPassValid = await bcrypt.compare(password, user.password);

    if (!isPassValid)
      return res.status(400).json({ message: "Invalid credentials" });

    // res.setHeader("Set-Cookie", "text=" + "myValue").json({ message: "Logged in" });
    const age = 1000 * 60 * 60 * 24 * 7;

    const token = jwt.sign(
      {
        id: user.id,
        isAdmin: false,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: age,
      }
    );

    const { password: userPassword, ...userInfo } = user; // takes all the properties of user except password

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: age,
        sameSite: 'None', // This is needed when using cookies with cross-origin requests
      })
      .status(200)
      .json(userInfo);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to login" });
  }
};

export const logout = (req, res) => {
  res
  .clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None',
  })
  .status(200)
  .json({ message: "Logged out successfully" });
};
//used bcrypt for encryption and security 