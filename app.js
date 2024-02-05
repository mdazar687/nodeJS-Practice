const express = require('express')
const isValid = require('date-fns/isValid')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, 'todoApplication.db')
const app = express()
app.use(express.json())

let db = null
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server running at http://localhost:3000'),
    )
  } catch (error) {
    console.log(`Db Error ${error.messgae}`)
  }
}

initializeDbAndServer()

const authenticateApi = async (request, response, next) => {
  const requestApi = request.query
  const validDatas = {
    status: ['TO DO', 'IN PROGRESS', 'DONE'],
    priority: ['HIGH', 'MEDIUM', 'LOW'],
    category: ['WORK', 'HOME', 'LEARNING'],
  }
  let condition = true
  for (let items in requestApi) {
    if (!validDatas[items].includes(requestApi[items])) {
      response.status(400)
      items = items[0].toUpperCase() + items.slice(1)
      response.send(`Invalid Todo ${items}`)
      condition = false
    }
  }
  if (condition === true) {
    next()
  }
}

app.get('/todos/', authenticateApi, async (request, response) => {
  const {
    priority = '',
    status = '',
    category = '',
    search_q = '',
  } = request.query
  let dbQuery = ''
  if (priority !== '' && status !== '') {
    dbQuery = `SELECT * FROM todo WHERE priority = '${priority}' AND status = '${status}'`
  } else if (priority !== '' && category !== '') {
    dbQuery = `SELECT * FROM todo WHERE priority = '${priority}' AND category = '${category}'`
  } else if (status !== '' && category !== '') {
    dbQuery = `SELECT * FROM todo WHERE category = '${category}' AND status = '${status}'`
  } else if (status !== '') {
    dbQuery = `SELECT * FROM todo WHERE status = '${status}'`
  } else if (priority !== '') {
    dbQuery = `SELECT * FROM todo WHERE priority = '${priority}'`
  } else if (category !== '') {
    dbQuery = `SELECT * FROM todo WHERE category = '${category}'`
  } else if (search_q !== '') {
    dbQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'`
  }
  const todoList = await db.all(dbQuery)
  response.send(todoList)
})

app.get('/todos/:todoId/', authenticateApi, async (request, response) => {
  const {todoId} = request.params
  const dbQuery = ` SELECT * FROM todo WHERE id = ${todoId}`
  const todo = await db.get(dbQuery)
  response.send(todo)
})

app.get('/agenda/', async (request, response) => {
  let {date} = request.query
  const validDate = isValid(new Date(date))
  if (validDate === true) {
    date = date.split('-')
    if (date[1].length < 2) {
      date[1] = '0' + date[1]
    } else if (date[2].lenght < 2) {
      date[2] = '0' + date[2]
    }
    date = date.join('-')
    const dbQuery = `SELECT * FROM todo WHERE due_date = '${date}'`
    const todo = await db.all(dbQuery)
    response.send(todo)
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

app.post('/todos/', async (request, response) => {
  const {id, todo, category, priority, status, dueDate} = request.body
  const dbQuery = `
      INSERT INTO todo (id, todo, category, priority, status, due_date)
      values(${id}, '${todo}', '${category}', '${priority}', '${status}', '${dueDate}')`
  await db.run(dbQuery)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  const {
    status = '',
    priority = '',
    dueDate = '',
    todo = '',
    category = '',
  } = request.body
  const {todoId} = request.params
  let dbQuery = ''
  if (status !== '') {
    dbQuery = `UPDATE todo SET status = '${status}' WHERE id = ${todoId}`
    await db.run(dbQuery)
    response.send('Status Updated')
  } else if (priority !== '') {
    dbQuery = `UPDATE todo SET priority = '${priority}' WHERE id = ${todoId}`
    await db.run(dbQuery)
    response.send('Priority Updated')
  } else if (dueDate !== '') {
    dbQuery = `UPDATE todo SET due_date = '${dueDate}' WHERE id = ${todoId}`
    await db.run(dbQuery)
    response.send('Due Date Updated')
  } else if (category !== '') {
    dbQuery = `UPDATE todo SET category = '${category}' WHERE id = ${todoId}`
    await db.run(dbQuery)
    response.send('Category Updated')
  } else if (todo !== '') {
    dbQuery = `UPDATE todo SET todo = '${todo}' WHERE id = ${todoId}`
    await db.run(dbQuery)
    response.send('Todo Updated')
  }
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const dbQuery = `DELETE FROM todo WHERE id = ${todoId}`
  await db.run(dbQuery)
  response.send('Todo Deleted')
})

module.exports = app
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