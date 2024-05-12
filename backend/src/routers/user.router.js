// import { Router } from "express";
// import jwt from 'jsonwebtoken';
// import { sample_foods, sample_users } from "../data.js";
// const router=Router();
// import { BAD_REQUEST } from "../constants/httpStatus.js";
// router.post('/login',(req,res)=>
// {
//     const {email,password}=req.body;
    
//     const user=sample_users.find(
//         user=>user.email===email && user.password===password
//     );

//     if (user) {
//         res.send(generateTokenResponse(user));
//         return;
//       }
  
//       res.status(BAD_REQUEST).send('Username or password is invalid');
// });

// const generateTokenResponse = user => {
//     const token = jwt.sign(
//       {
//         id: user.id,
//         email: user.email,
//         isAdmin: user.isAdmin,
//       },
//       // process.env.JWT_SECRET,
//       'SomeRandomText',
//       {
//         expiresIn: '30d',
//       }
//     );
  
//     return {
//         id: user.id,
//         email: user.email,
//         name: user.name,
//         address: user.address,
//         isAdmin: user.isAdmin,
//         token,
//       };
//     };

//     export default router;

import { Router } from 'express';

import jwt from 'jsonwebtoken';
const router = Router();
import { BAD_REQUEST } from '../constants/httpStatus.js';
import handler from 'express-async-handler';
import { UserModel } from '../models/user.model.js';
import bcrypt from 'bcryptjs';

import auth from '../middleware/auth.mid.js';

const PASSWORD_HASH_SALT_ROUNDS = 10;
router.post('/login', handler(async(req, res) => {
  const { email, password } = req.body;
  const user = await UserModel.findOne({email});

  if (user && (await bcrypt.compare(password,user.password))) {
    res.send(generateTokenResponse(user));
    return;
  }

  res.status(BAD_REQUEST).send('Username or password is invalid');
}));

router.post(
  '/register',
  handler(async (req, res) => {
    const { name, email, password, address } = req.body;

    const user = await UserModel.findOne({ email });

    if (user) {
      res.status(BAD_REQUEST).send('User already exists, please login!');
      return;
    }

    const hashedPassword = await bcrypt.hash(
      password,
      PASSWORD_HASH_SALT_ROUNDS
    );

    const newUser = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      address,
    };

    const result = await UserModel.create(newUser);
    res.send(generateTokenResponse(result));
  })
);
const generateTokenResponse = user => {
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '30d',
    }
  );

  router.put(
    '/updateProfile',
    auth,
    handler(async (req, res) => {
      const { name, address } = req.body;
      const user = await UserModel.findByIdAndUpdate(
        req.user.id,
        { name, address },
        { new: true }
      );
  
      res.send(generateTokenResponse(user));
    })
  );
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    address: user.address,
    isAdmin: user.isAdmin,
    token,
  };
};

export default router;
