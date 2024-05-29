import 'reflect-metadata';
import express from 'express';
import dotenv from 'dotenv';
import { InversifyExpressServer } from 'inversify-express-utils';
import { configureContainer } from './config/inversify.config';
import './controller/contactController';

const startServer = async () => {
  const container = await configureContainer();

  const server = new InversifyExpressServer(container);
  server.setConfig((app) => {
    app.use(express.json());
  });

  dotenv.config();

  const port = process.env.PORT || 3000;

  const app = server.build();
  app.listen(port, () => {
    console.log(`Server is live on port ${port}`);
  });
};

startServer();