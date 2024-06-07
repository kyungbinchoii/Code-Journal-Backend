/* eslint-disable @typescript-eslint/no-unused-vars -- Remove me */
import 'dotenv/config';
import pg from 'pg';
import express from 'express';
import { ClientError, errorMiddleware } from './lib/index.js';
import { time } from 'console';
import { title } from 'process';

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const app = express();
app.use(express.json());

app.get('/api/entries', async (req,res,next)=>{
  try{
    const sql = `
      select *
      from "entries"
      order by "entryId" desc
      `;
    const result = await db.query(sql);
    if(!result){
      throw new ClientError(400, 'invalid entries');
    }
    res.json(result.rows);

  } catch (err){
    next(err);
  }
})
app.get('/api/entries/:entryId', async (req,res,next)=>{
  try{
    const {entryId} = req.params
    const sql = `
      select *
      from "entries"
      where "entryId" = $1
      `;
    const result = await db.query(sql, [entryId]);
    if(!result){
      throw new ClientError(400, 'invalid entries');
    }
    res.json(result.rows);

  } catch (err){
    next(err);
  }
})

app.post('/api/entries', async (req,res,next)=>{
  try{
    const {title, notes, photoUrl} = req.body
    if(!title){
      throw new ClientError(400, `${title} is invalid`);
    }
    if(!notes){
      throw new ClientError(400, `${notes} is invalid`);
    }
    if(!photoUrl){
      throw new ClientError(400, `${photoUrl} is invalid`);
    }
    const sql = `
    insert into "entries" ("title", "notes", "photoUrl")
    values($1, $2, $3)
    returning *
    `;

    const result = await db.query(sql, [title,notes,photoUrl]);
    if(!result){
      throw new ClientError(400, `invalid entry`);
    }
    const [entry] = result.rows
    res.status(201).json(entry);
  }catch(err){
    next(err)
  }
})

app.put('/api/entries/:entryId', async (req,res,next)=>{
  try{
    const {entryId} = req.params
    const {title,notes,photoUrl} = req.body
    const sql = `
    update "entries"
    set "title" = $1,
        "notes" = $2,
        "photoUrl" = $3
        where "entryId" = $4
      returning *;
      `;
      const result = await db.query(sql, [title,notes, photoUrl, entryId]);
      if(!result){
        throw new ClientError(400, `the ${entryId} was invalid`)
      }
      const [updatedEntry] = result.rows
      res.status(201).json(updatedEntry)
  } catch(err){
      next(err)
  }
})

app.delete('/api/entries/:entryId', async (req,res,next)=>{
  try{
    const {entryId} = req.params
    const sql = `
    delete from "entries"
      where "entryId" = $1
      returning *;
      `;
      const result = await db.query(sql, [entryId]);
      if(!result){
        throw new ClientError(400, `the ${entryId} was invalid`)
      }
      res.sendStatus(204)
  } catch(err){
      next(err)
  }
})


app.use(errorMiddleware);

app.listen(process.env.PORT, () => {
  console.log(`express server listening on port ${process.env.PORT}`);
});
