import 'dotenv/config';
import pg from 'pg';
import argon2 from 'argon2';
import express from 'express';
import jwt from 'jsonwebtoken';
import { ClientError, authMiddleware, errorMiddleware } from './lib/index.js';

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// type User = {
//   userId: number;
//   username: string;
//   hashedPassword: string;
// };
type Auth = {
  username: string;
  password: string;
};

const hashKey = process.env.TOKEN_SECRET;
if (!hashKey) throw new Error('TOKEN_SECRET not found in .env');

const app = express();
app.use(express.json());

// app.get('/api/entries', async (req,res,next)=>{
//   try{
//     const sql = `
//       select *
//       from "entries"
//       order by "entryId" desc
//       `;
//     const result = await db.query(sql);
//     if(!result){
//       throw new ClientError(400, 'invalid entries');
//     }
//     res.json(result.rows);

//   } catch (err){
//     next(err);
//   }
// })
app.get('/api/entries/:entryId', authMiddleware, async (req, res, next) => {
  try {
    const id = req.user?.userId;
    const { entryId } = req.params;
    const sql = `
      select *
      from "entries"
      where "entryId" = $1 and "userId"=$2
      `;
    const result = await db.query(sql, [entryId, id]);
    if (!result) {
      throw new ClientError(400, 'invalid entries');
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

app.post('/api/entries', authMiddleware, async (req, res, next) => {
  try {
    const id = req.user?.userId;
    const { title, notes, photoUrl } = req.body;
    if (!title) {
      throw new ClientError(400, `${title} is invalid`);
    }
    if (!notes) {
      throw new ClientError(400, `${notes} is invalid`);
    }
    if (!photoUrl) {
      throw new ClientError(400, `${photoUrl} is invalid`);
    }
    const sql = `
    insert into "entries" ("title", "notes", "photoUrl", "userId")
    values($1, $2, $3, $4)
    returning *
    `;

    const result = await db.query(sql, [title, notes, photoUrl, id]);
    if (!result) {
      throw new ClientError(400, `invalid entry`);
    }
    const [entry] = result.rows;
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
});

app.put('/api/entries/:entryId', authMiddleware, async (req, res, next) => {
  try {
    const id = req.user?.userId;
    const { entryId } = req.params;
    const { title, notes, photoUrl } = req.body;
    const sql = `
    update "entries"
    set "title" = $1,
        "notes" = $2,
        "photoUrl" = $3
        where "entryId" = $4 and "userId"=$5
      returning *;
      `;
    const result = await db.query(sql, [title, notes, photoUrl, entryId, id]);
    if (!result) {
      throw new ClientError(400, `the ${entryId} was invalid`);
    }
    const [updatedEntry] = result.rows;
    res.status(201).json(updatedEntry);
  } catch (err) {
    next(err);
  }
});

app.delete('/api/entries/:entryId', authMiddleware, async (req, res, next) => {
  try {
    const id = req.user?.userId;
    const { entryId } = req.params;
    const sql = `
    delete from "entries"
      where "entryId" = $1 and "userId" =$2
      returning *;
      `;
    const result = await db.query(sql, [entryId, id]);
    if (!result) {
      throw new ClientError(400, `the ${entryId} was invalid`);
    }
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

//  start of authorization and users middleware

app.post('/api/auth/sign-up', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new ClientError(400, 'username and password are required fields');
    }
    const hashedPassword = await argon2.hash(password);
    const sql = `
      insert into "users" ("username", "hashedPassword")
      values($1,$2)
      returning "userId", "username", "createdAt";
      `;
    const result = await db.query(sql, [username, hashedPassword]);
    const [user] = result.rows;
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

app.post('/api/auth/sign-in', async (req, res, next) => {
  try {
    const { username, password } = req.body as Partial<Auth>;
    if (!username || !password) {
      throw new ClientError(401, 'invalid login');
    }
    const sql = `
        select "userId",
              "hashedPassword",
              "username"
            from "users"
        where "username" = $1
        `;
    const result = await db.query(sql, [username]);
    const user = result.rows[0];
    if (!user) {
      throw new ClientError(401, 'invalid login');
    }
    const matchPassword = await argon2.verify(user.hashedPassword, password);
    if (!matchPassword) {
      throw new ClientError(401, 'invalid login');
    }
    const payload = {
      userId: user.userId,
      username: user.username,
    };
    const token = jwt.sign(payload, hashKey);
    res.status(200).send({ token, user: payload });
  } catch (err) {
    next(err);
  }
});

app.get('/api/entries', authMiddleware, async (req, res, next) => {
  try {
    const sql = `
      select *
        from "entries"
        where "userId" = $1
        order by "entryId" desc
    `;
    const result = await db.query(sql, [req.user?.userId]);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.use(errorMiddleware);

app.listen(process.env.PORT, () => {
  console.log(`express server listening on port ${process.env.PORT}`);
});
