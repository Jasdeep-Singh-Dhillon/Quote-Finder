const express = require('express');
const mysql = require('mysql');
const app = express();
const pool = dbConnection();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

//routes
app.get('/', (req, res) => {
  res.render('add', { 'head': 'Add' });
});

app.get('/authors', async (req, res) => {
  let sql = `SELECT authorId, firstName, lastName
             FROM q_authors
             ORDER BY lastName`
  let authors = await executeSQL(sql);
  res.render('authorList', {'head':'All Authors', 'authors': authors});
});

app.get('/author/edit', async(req, res) => {
  let authorId = req.query.authorId;
  let sql = `SELECT *, 
             DATE_FORMAT(dob, '%Y-%m-%d') as dobISO,
             DATE_FORMAT(dod, '%Y-%m-%d') as dodISO
             FROM q_authors
             WHERE authorId=${authorId}`;

  let author = await executeSQL(sql);;

  res.render('editAuthor', {'head':'Updating Author Information', 'authorInfo': author});
});

app.post('/author/edit', async(req, res) => {
  let authorId = req.body.authorId;

  let firstName = req.body.firstName;
  let lastName = req.body.lastName;
  let dob = req.body.dob;
  let dod = req.body.dod;
  let sex = req.body.sex;
  let profession = req.body.profession;
  let country = req.body.country;
  let portrait = req.body.portrait;
  let biography = req.body.biography;

  let sql = `UPDATE q_authors
             SET firstName = ?, 
             lastName = ?, 
             dob = ?, 
             dod = ?,
             sex = ?, 
             profession = ?, 
             country = ?, 
             portrait = ?, 
             biography = ?
             WHERE authorId = ${authorId}`;

  let params = [firstName, lastName, dob, dod, sex, profession, country, portrait, biography];

  // Update database
  let rows = await executeSQL(sql, params);

  sql = `SELECT *, 
         DATE_FORMAT(dob, '%Y-%m-%d') as dobISO,
         DATE_FORMAT(dod, '%Y-%m-%d') as dodISO
         FROM q_authors
         WHERE authorId=${authorId}`;

  let author = await executeSQL(sql);

  // console.log(params);
  res.render('editAuthor', { 'head': 'Updating Author Information', 'authorInfo': author, 'message':'Author Updated' }); 
});

app.get('/home', async (req, res) => {
  let sql = "SELECT * FROM q_authors ORDER BY lastName";
  let data = await executeSQL(sql);
  // console.log(data);
  sql = `SELECT category FROM q_quotes GROUP BY category ORDER BY category`;
  let cate = await executeSQL(sql);
  res.render('home', { 'authors': data, 'category': cate, 'head': 'Home' });
});

app.get('/searchByAuthor', async (req, res) => {
  let authorId = req.query.authorId;
  let sql = `SELECT q.quote, a.firstName, a.lastName, a.authorId
             FROM q_authors a
             NATURAL JOIN q_quotes q 
             WHERE a.authorId = ${authorId}
             ORDER BY q.quote `;
  let data = await executeSQL(sql);
  // console.log(data);
  res.render('quote_with_author', { "data": data, 'head': 'Searching by Author' });
});

app.get('/author/new', (req, res) => {
  res.render('newAuthor', { 'head': 'Add Author' });
});

app.get('/quote/new', async (req, res) => {
  let sql = `select * from q_authors`;
  let authors = await executeSQL(sql);
  sql = `select category from q_quotes group by category`
  let category = await executeSQL(sql);
  res.render('newQuote', { 'authors': authors, 'category': category, 'head': 'Add Quote' });
});

app.post('/quote/new', async (req, res) => {
  let quote = req.body.quote;
  let authorId = req.body.authorId;
  let category = req.body.category;
  let likes = req.body.likes;
  let sql = `INSERT INTO 
             q_quotes (quote, authorId, category, likes)
             VALUES (?, ?, ?, ?)`;
  let params = [quote, authorId, category, likes];

  // Insert into database
  let rows = await executeSQL(sql, params);
  // console.log(params);
  sql = `select * from q_authors`;
  let authors = await executeSQL(sql);
  sql = `select category from q_quotes group by category`
  let categories = await executeSQL(sql);
  res.render('newQuote', { 'authors': authors, 'category': categories, 'head': 'Add Quote' });
});

app.post('/author/new', async (req, res) => {
  let firstName = req.body.firstName;
  let lastName = req.body.lastName;
  let dob = req.body.dob;
  let dod = req.body.dod;
  let sex = req.body.sex;
  let profession = req.body.profession;
  let country = req.body.country;
  let portrait = req.body.portrait;
  let biography = req.body.biography;
  let sql = `INSERT INTO 
             q_authors (firstName, lastName, dob, dod, sex, profession, country, portrait, biography)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  let params = [firstName, lastName, dob, dod, sex, profession, country, portrait, biography];

  // Insert into database
  let rows = await executeSQL(sql, params);

  // console.log(params);
  res.render('newAuthor', { 'head': 'Add Author' });
});

app.get('/searchByLikes', async (req, res) => {
  let start = req.query.start;
  let end = req.query.end;
  let sql = `SELECT q.quote, a.firstName, a.lastName, q.likes, a.authorId
             FROM q_quotes q 
             NATURAL JOIN q_authors a 
             WHERE q.likes>${start} and q.likes<${end}`;
  let data = await executeSQL(sql);
  res.render('quote_with_likes', { "data": data, "head": 'Search by Likes' });
})

app.get('/quoteByCategory', async (req, res) => {
  let category = req.query.category;
  let sql = `SELECT q.quote, a.firstName, a.lastName, a.authorId
             FROM q_quotes q 
             NATURAL JOIN q_authors a
             WHERE q.category = '${category}'`;
  let data = await executeSQL(sql);
  res.render('quote_with_author', { 'data': data, 'head': 'Search by Category' });
})

app.get('/searchByKeyword', async (req, res) => {
  let keyword = req.query.keyword;
  // console.log(keyword);
  let sql = `SELECT q.quote, a.firstName, a.lastName, a.authorId
             FROM q_authors a 
             NATURAL JOIN q_quotes q
             WHERE q.quote LIKE '%${keyword}%' `;
  let data = await executeSQL(sql);
  res.render('quote_with_author', { 'data': data, 'head': 'Search by Keyword' });
})

app.get('/inspirational', async (req, res) => {
  let sql = `SELECT q.quote, a.firstName, a.lastName, q.category, a.authorId
             FROM q_authors a 
             NATURAL JOIN q_quotes q 
             WHERE q.category = 'Inspirational'
             ORDER BY q.quote desc `;
  let data = await executeSQL(sql);
  // console.log(data);
  res.render('quote_with_author', { "data": data, 'head': 'Inspirational Quotes' });
})

app.get('/femaleAuthors', async (req, res) => {
  let sql = `SELECT a.firstName, a.lastName, q.quote, a.sex, a.authorId
             FROM q_authors a
             NATURAL JOIN q_quotes q
             WHERE a.sex = 'F' 
             order by q.quote`;
  let data = await executeSQL(sql);
  // console.log(data);
  res.render('quote_with_author', { "data": data, "head": "Female Authors" });
});

app.get('/api/author/:id', async (req, res) => {
  let authorId = req.params.id;
  if (authorId == undefined) {
    res.send('False');
  }
  let sql = `SELECT * 
             FROM q_authors
             WHERE authorId = ${authorId}`;

  let result = await executeSQL(sql);
  // console.log(result);
  res.send(result);
});

app.get('/nonusa', async (req, res) => {
  let sql = "SELECT * FROM q_authors WHERE country != 'USA'";
  let data = await executeSQL(sql);
  // console.log(data);
  res.render('non_usa.ejs', { 'authors': data, 'head': 'Non American Authors' });
});

app.get('/allQuotes', async (req, res) => {
  let sql = "SELECT * FROM q_quotes";
  let data = await executeSQL(sql);
  res.render('displayQuotes', { 'quotes': data, 'head': 'All Quotes' });
});

app.get("/dbTest", async function (req, res) {
  let sql = "SELECT CURDATE()";
  let rows = await executeSQL(sql);
  res.send(rows);
});//dbTest

app.get('/quotesT', async (req, res) => {
  let sql = `SELECT * 
           FROM q_authors a
           NATURAL JOIN q_quotes q
           WHERE q.quote like 'T%'
           ORDER BY a.lastName`;
  let data = await executeSQL(sql);
  // console.log(data);
  res.render('quote_with_author', { "data": data, 'head': 'Quotes starting with T' });
})

app.get('/americanAuthors', async (req, res) => {
  let sql = `SELECT q.quote, a.firstName, a.lastName, a.country, a.authorId
             FROM q_authors a
             NATURAL JOIN q_quotes q 
             WHERE a.country = "USA"
             ORDER BY q.quote `;
  let data = await executeSQL(sql);
  // console.log(data);
  res.render('quote_with_author', { "data": data, 'head': 'American Authors' });
})

app.get('/lifeQuotes', async (req, res) => {
  let sql = `SELECT * 
           FROM q_authors a
           NATURAL JOIN q_quotes q
           WHERE q.quote like '%Life%'
           ORDER BY a.lastName`;
  let data = await executeSQL(sql);
  // console.log(data);
  res.render('quote_with_author', { "data": data, 'head': 'Life Quotes' });
})

app.get('/likes', async (req, res) => {
  let sql = `SELECT *
             FROM q_authors a
             NATURAL JOIN q_quotes q
             WHERE q.likes>50 and q.likes<100
             ORDER BY q.likes desc`;
  let data = await executeSQL(sql);
  // console.log(data);
  res.render('quote_with_likes', { "data": data, 'head': 'Quotes with more than 50 likes' });
})

//functions
async function executeSQL(sql, params) {
  return new Promise(function (resolve, reject) {
    pool.query(sql, params, function (err, rows, fields) {
      if (err) throw err;
      resolve(rows);
    });
  });
}//executeSQL


//values in red must be updated
function dbConnection() {

  const pool = mysql.createPool({

    connectionLimit: 10,
    host: "grp6m5lz95d9exiz.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
    user: "omhbp2zqhmwl88y6",
    password: "a7m9pp5g932rvavs",
    database: "bdt1z3wls40j65ls"

  });

  return pool;

} //dbConnection

//start server
app.listen(3000, () => {
  console.log("Expresss server running");
});