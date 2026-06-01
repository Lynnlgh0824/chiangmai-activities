const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 4000;

const DATA_FILE = path.join(path.resolve(__dirname, '..'), 'data', 'items.json');
const GUIDE_FILE = path.join(path.resolve(__dirname, '..'), 'data', 'guide.json');
const VERSION_FILE = path.join(path.resolve(__dirname, '..'), 'data', 'version.json');
const APP_VERSION_FILE = path.join(path.resolve(__dirname, '..'), 'app-version.json');
const REQUIREMENTS_LOG_FILE = path.join(path.resolve(__dirname, '..'), 'data', 'requirements-log.json');

module.exports = {
  express,
  axios,
  fs,
  path,
  multer,
  app,
  PORT,
  DATA_FILE,
  GUIDE_FILE,
  VERSION_FILE,
  APP_VERSION_FILE,
  REQUIREMENTS_LOG_FILE
};
