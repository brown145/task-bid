/* eslint-disable no-param-reassign */
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const DATA_FILE = path.join(__dirname, 'data.json');

app.set('port', (process.env.PORT || 3000));

app.use('/', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.get('/api/tasks', (req, res) => {
  fs.readFile(DATA_FILE, (err, data) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.json(JSON.parse(data));
  });
});

app.post('/api/tasks', (req, res) => {
  fs.readFile(DATA_FILE, (err, data) => {
    const tasks = JSON.parse(data);
    const newTask = {
      id: req.body.id,
      title: req.body.title,
      subtitle: req.body.subtitle,
      startedTime: null,
      bids: null,
    };
    tasks.push(newTask);
    fs.writeFile(DATA_FILE, JSON.stringify(tasks, null, 4), () => {
      res.setHeader('Cache-Control', 'no-cache');
      res.json(tasks);
    });
  });
});

app.post('/api/tasks/start', (req, res) => {
  fs.readFile(DATA_FILE, (err, data) => {
    const tasks = JSON.parse(data);
    tasks.forEach((task) => {
      if (task.id === req.body.id) {
        task.startedTime = req.body.startedTime;
      }
    });
    fs.writeFile(DATA_FILE, JSON.stringify(tasks, null, 4), () => {
      res.json({});
    });
  });
});

app.put('/api/tasks', (req, res) => {
  fs.readFile(DATA_FILE, (err, data) => {
    const tasks = JSON.parse(data);
    tasks.forEach((task) => {
      if (task.id === req.body.id) {
        task.title = req.body.title || task.title;
        task.subtitle = req.body.subtitle || task.subtitle;
        task.startedTime = req.body.startedTime || task.startedTime;
        task.bids = (req.body.bids || req.body.bids === null) ? req.body.bids : task.bids;
      }
    });
    fs.writeFile(DATA_FILE, JSON.stringify(tasks, null, 4), () => {
      res.json({});
    });
  });
});

app.delete('/api/tasks', (req, res) => {
  fs.readFile(DATA_FILE, (err, data) => {
    let tasks = JSON.parse(data);
    tasks = tasks.reduce((memo, task) => {
      if (task.id === req.body.id) {
        return memo;
      } else {
        return memo.concat(task);
      }
    }, []);
    fs.writeFile(DATA_FILE, JSON.stringify(tasks, null, 4), () => {
      res.json({});
    });
  });
});

app.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});
